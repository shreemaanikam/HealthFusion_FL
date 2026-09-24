"""
Data locality enforcement.
"""
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class DataLocalityEnforcer:
    """Enforce that raw data never leaves the client."""
    
    def __init__(self):
        """Initialize enforcer."""
        self.access_logs = []
        
    def validate_no_raw_data_transfer(self, data_payload: dict) -> bool:
        """Check that data payload contains no raw patient data."""
        forbidden_keys = ['patient_id', 'raw_features', 'phi']
        for key in forbidden_keys:
            if key in data_payload:
                return False
        return True
        
    def log_data_access(self, client_id: str, data_type: str, action: str) -> None:
        """Log data access event."""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'client_id': client_id,
            'data_type': data_type,
            'action': action
        }
        self.access_logs.append(log_entry)
        logger.info(f"Data Access: {log_entry}")
        
    def get_status(self) -> dict:
        """Get enforcement status."""
        return {
            'enforcement_active': True,
            'logs_recorded': len(self.access_logs)
        }
