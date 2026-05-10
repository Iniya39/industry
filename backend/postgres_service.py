# Mock PostgreSQL Service
class PostgresService:
    @staticmethod
    async def initialize():
        print("🗄️ PostgreSQL Service initialized")
    
    @staticmethod
    async def saveAlert(alert_data):
        print(f"🗄️ Saving alert: {alert_data.get('message', 'Unknown')}")
        return f"alert_{hash(str(alert_data))}"
    
    @staticmethod
    async def getAlerts(limit: int = 50):
        print(f"🗄️ Getting {limit} alerts")
        return []
