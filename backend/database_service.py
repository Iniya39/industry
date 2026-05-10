# Mock Database Service for InfluxDB
class DatabaseService:
    @staticmethod
    async def initialize():
        print("📊 Database Service (InfluxDB) initialized")
    
    @staticmethod
    async def writeSensorData(machineId: str, data):
        print(f"📊 Writing sensor data for {machineId}")
        return True
    
    @staticmethod
    async def writePredictionData(prediction):
        print("📊 Writing AI prediction data")
        return True
    
    @staticmethod
    async def getLatestSensorData():
        print("📊 Getting latest sensor data")
        return []
