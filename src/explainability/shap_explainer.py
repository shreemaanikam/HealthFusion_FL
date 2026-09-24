"""
SHAP integration for explainability.
"""
import numpy as np
import shap

class ShapExplainer:
    """SHAP explainer for providing feature attributions."""
    FEATURE_NAMES = ['gender', 'age', 'hypertension', 'heart_disease', 'smoking_history', 'bmi', 'HbA1c_level', 'blood_glucose_level']
    
    def __init__(self, model, model_type: str = 'tensorflow', background_data: np.ndarray = None):
        """Initialize SHAP explainer."""
        self.model = model
        self.model_type = model_type
        
        if background_data is not None:
            np.random.seed(42)
            if len(background_data) > 100:
                indices = np.random.choice(len(background_data), 100, replace=False)
                self.background_data = background_data[indices]
            else:
                self.background_data = background_data
        else:
            self.background_data = np.zeros((10, 8))
            
        if self.model_type == 'tensorflow':
            try:
                self.explainer = shap.DeepExplainer(self.model, self.background_data)
            except Exception:
                self.explainer = shap.KernelExplainer(self.model.predict, self.background_data)
        elif self.model_type == 'sklearn':
            self.explainer = shap.TreeExplainer(self.model)
        else:
            self.explainer = shap.KernelExplainer(self.model.predict, self.background_data)
            
    def explain_single(self, input_data: np.ndarray) -> dict:
        """Explain a single prediction."""
        if input_data.ndim == 1:
            input_data = input_data.reshape(1, -1)
            
        if self.model_type == 'tensorflow':
            pred = self.model.predict(input_data, verbose=0)
            probability = float(pred[0][0]) if pred.ndim > 1 else float(pred[0])
        else:
            pred = self.model.predict_proba(input_data)
            probability = float(pred[0][1])
            
        shap_values = self.explainer.shap_values(input_data)
        
        if isinstance(shap_values, list):
            shap_values = shap_values[1] if len(shap_values) > 1 else shap_values[0]
            
        return {
            'prediction': 1 if probability >= 0.5 else 0,
            'probability': probability,
            'shap_values': shap_values[0].tolist(),
            'feature_names': self.FEATURE_NAMES
        }
        
    def explain_batch(self, input_data: np.ndarray) -> list[dict]:
        """Explain a batch of predictions."""
        explanations = []
        for i in range(len(input_data)):
            explanations.append(self.explain_single(input_data[i]))
        return explanations
        
    @classmethod
    def get_feature_names(cls) -> list[str]:
        """Get the list of feature names."""
        return cls.FEATURE_NAMES
