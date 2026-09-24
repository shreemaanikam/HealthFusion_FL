class ExplainabilityService:
    def explain_prediction(self, input_data: dict, model):
        return [
            {"feature": "age", "impact": "positive", "contribution": 0.15, "value": input_data.get("age", 0)}
        ]
        
    def get_global_importance(self):
        return [{"feature": "age", "importance": 0.35}]
