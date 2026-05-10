# Mock Notification Service
class NotificationService:
    @staticmethod
    def initialize():
        print("📧 Notification Service initialized")
    
    @staticmethod
    async def sendNotification(notification_data):
        print(f"📧 Sending {notification_data.get('type', 'email')} notification to {notification_data.get('recipient', 'unknown')}")
        return {"status": "sent", "message_id": f"msg_{hash(str(notification_data))}"}
    
    @staticmethod
    async def getNotificationHistory(limit: int = 50):
        print(f"📧 Getting {limit} notifications from history")
        return []
