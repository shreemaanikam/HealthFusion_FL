class FederatedService:
    def get_status(self):
        return {
            "status": "ACTIVE",
            "current_round": 3,
            "total_rounds": 5,
            "num_clients": 3,
            "strategy": "FedAvg",
            "mode": "simulation",
            "last_updated": "2023-10-01T12:00:00Z"
        }
        
    def get_rounds(self):
        return []
        
    def get_round(self, round_id: int):
        return {}
        
    def get_clients(self):
        return []
        
    def get_metrics(self):
        return {}
