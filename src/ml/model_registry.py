"""
Model registry module to track model versions and metadata.
"""
import os
import json
import fcntl
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

class ModelRegistry:
    """Tracks and manages model metadata, versions, and metrics."""
    
    def __init__(self, registry_file: Optional[str] = None):
        """
        Initialize the registry.
        
        Args:
            registry_file (str, optional): Path to the registry JSON file.
        """
        if registry_file is None:
            base_dir = Path(__file__).resolve().parent.parent.parent
            self.registry_file = base_dir / "models" / "registry.json"
        else:
            self.registry_file = Path(registry_file)
            
        os.makedirs(self.registry_file.parent, exist_ok=True)
        if not self.registry_file.exists():
            self._save_registry({"models": []})
            
    def _load_registry(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load the registry with file locking."""
        try:
            with open(self.registry_file, 'r') as f:
                fcntl.flock(f, fcntl.LOCK_SH)
                data = json.load(f)
                fcntl.flock(f, fcntl.LOCK_UN)
                return data
        except json.JSONDecodeError:
            return {"models": []}
            
    def _save_registry(self, data: Dict[str, List[Dict[str, Any]]]) -> None:
        """Save the registry with file locking."""
        with open(self.registry_file, 'w') as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            json.dump(data, f, indent=4)
            fcntl.flock(f, fcntl.LOCK_UN)
            
    def _generate_model_id(self, model_type: str, training_mode: str, version: str) -> str:
        """Generate a consistent model ID."""
        prefix = "HF"
        m_type = "NN" if "NN" in model_type or "keras" in model_type else "RF"
        mode = "FL" if training_mode.lower() == "federated" else ""
        
        parts = [prefix, m_type]
        if mode:
            parts.append(mode)
        parts.append(f"v{version}")
        
        return "-".join(parts)
        
    def register_model(
        self, version: str, model_type: str, metrics: Dict[str, float],
        training_mode: str, artifact_path: str, description: str,
        status: str = "ACTIVE"
    ) -> str:
        """
        Register a new model in the registry.
        
        Returns:
            str: The generated model_id.
        """
        data = self._load_registry()
        
        model_id = self._generate_model_id(model_type, training_mode, version)
        
        # If active, archive existing active models of same type/mode
        if status == "ACTIVE":
            for model in data.get("models", []):
                if model.get("status") == "ACTIVE" and model.get("training_mode") == training_mode:
                    model["status"] = "ARCHIVED"
                    
        new_entry = {
            "model_id": model_id,
            "version": version,
            "model_type": model_type,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "metrics": metrics,
            "training_mode": training_mode,
            "status": status,
            "artifact_path": artifact_path,
            "description": description
        }
        
        # Update if exists, else append
        models = data.get("models", [])
        existing_idx = next((i for i, m in enumerate(models) if m["model_id"] == model_id), None)
        
        if existing_idx is not None:
            models[existing_idx] = new_entry
        else:
            models.append(new_entry)
            
        data["models"] = models
        self._save_registry(data)
        
        return model_id
        
    def get_model(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific model by ID."""
        data = self._load_registry()
        for model in data.get("models", []):
            if model["model_id"] == model_id:
                return model
        return None
        
    def list_models(self) -> List[Dict[str, Any]]:
        """List all models in the registry."""
        return self._load_registry().get("models", [])
        
    def get_active_model(self, training_mode: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get the currently active model.
        
        Args:
            training_mode (str, optional): 'centralized' or 'federated'.
        """
        data = self._load_registry()
        for model in data.get("models", []):
            if model.get("status") == "ACTIVE":
                if training_mode is None or model.get("training_mode") == training_mode:
                    return model
        return None
        
    def archive_model(self, model_id: str) -> bool:
        """Mark a model as ARCHIVED."""
        data = self._load_registry()
        for model in data.get("models", []):
            if model["model_id"] == model_id:
                model["status"] = "ARCHIVED"
                self._save_registry(data)
                return True
        return False
        
    def get_model_history(self) -> List[Dict[str, Any]]:
        """Get chronological history of all models."""
        models = self.list_models()
        return sorted(models, key=lambda x: x.get("created_at", ""))
