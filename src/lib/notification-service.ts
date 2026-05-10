// Notification Service for Industrial AI Predictive Maintenance
// Handles email and SMS notifications via SendGrid and SMTP

export interface NotificationRequest {
  type: 'email' | 'sms';
  recipient: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  machineId?: string;
  alertId?: string;
}

export interface EmailTemplate {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface SMSMessage {
  to: string;
  body: string;
  from: string;
}

export class NotificationService {
  private static sendGridApiKey: string;
  private static smtpUser: string;
  private static smtpPassword: string;

  // Initialize notification service
  static initialize(): void {
    this.sendGridApiKey = process.env.SENDGRID_API_KEY || '';
    this.smtpUser = process.env.SMTP_USER || '';
    this.smtpPassword = process.env.SMTP_PASSWORD || '';
    
    console.log('📧 Notification service initialized');
  }

  // Send email notification
  static async sendEmail(notification: NotificationRequest): Promise<boolean> {
    try {
      console.log(`📧 Sending email notification to ${notification.recipient}`);
      
      // Create email content
      const emailContent: EmailTemplate = {
        to: notification.recipient,
        subject: this.generateEmailSubject(notification),
        htmlBody: this.generateEmailHTML(notification),
        textBody: this.generateEmailText(notification)
      };

      // Here you would integrate with SendGrid API
      // const response = await sendGridMail(emailContent);
      
      // For now, simulate email sending
      const emailSent = await this.simulateSendGrid(emailContent);
      
      if (emailSent) {
        console.log(`✅ Email sent successfully to ${notification.recipient}`);
        return true;
      } else {
        console.error(`❌ Failed to send email to ${notification.recipient}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  // Send SMS notification
  static async sendSMS(notification: NotificationRequest): Promise<boolean> {
    try {
      console.log(`📱 Sending SMS notification to ${notification.recipient}`);
      
      // Create SMS content
      const smsContent: SMSMessage = {
        to: notification.recipient,
        body: this.generateSMSMessage(notification),
        from: '+1234567890' // Your Twilio/ SMS service number
      };

      // Here you would integrate with Twilio API or SMS service
      // const response = await twilioClient.messages.create(smsContent);
      
      // For now, simulate SMS sending
      const smsSent = await this.simulateSMS(smsContent);
      
      if (smsSent) {
        console.log(`✅ SMS sent successfully to ${notification.recipient}`);
        return true;
      } else {
        console.error(`❌ Failed to send SMS to ${notification.recipient}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      return false;
    }
  }

  // Generate email subject based on notification type and priority
  private static generateEmailSubject(notification: NotificationRequest): string {
    const priorityEmoji = {
      'low': '🔵',
      'medium': '🟡', 
      'high': '🟠',
      'critical': '🔴'
    };

    let subject = '';
    
    if (notification.alertId) {
      subject = `${priorityEmoji[notification.priority]} Alert: ${notification.alertId}`;
    } else if (notification.machineId) {
      subject = `${priorityEmoji[notification.priority]} Machine ${notification.machineId} Update`;
    } else {
      subject = `${priorityEmoji[notification.priority]} Industrial AI System Notification`;
    }

    return subject;
  }

  // Generate HTML email content
  private static generateEmailHTML(notification: NotificationRequest): string {
    const priorityColor = {
      'low': '#28a745',
      'medium': '#f39c12',
      'high': '#e74c3c',
      'critical': '#dc2626'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Industrial AI Alert</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header { 
            background-color: ${priorityColor[notification.priority]}; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 5px 5px 0;
          }
          .content { 
            background-color: #f8f9fa; 
            padding: 20px; 
            border-radius: 5px;
          }
          .alert-details { 
            background-color: white; 
            padding: 15px; 
            margin: 10px 0; 
            border-left: 4px solid ${priorityColor[notification.priority]}; 
            border-radius: 3px;
          }
          .footer { 
            text-align: center; 
            font-size: 12px; 
            color: #666666; 
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏭 Industrial AI Predictive Maintenance</h1>
          <h2>${notification.subject}</h2>
        </div>
        
        <div class="content">
          <div class="alert-details">
            <h3>📋 Alert Details</h3>
            <p><strong>Message:</strong> ${notification.message}</p>
            <p><strong>Priority:</strong> ${notification.priority.toUpperCase()}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            ${notification.machineId ? `<p><strong>Machine:</strong> ${notification.machineId}</p>` : ''}
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated alert from your Industrial AI Predictive Maintenance System.</p>
          <p>For questions, contact maintenance leadership team.</p>
        </div>
      </body>
      </html>
    `;
  }

  // Generate plain text email content
  private static generateEmailText(notification: NotificationRequest): string {
    return `
Industrial AI Predictive Maintenance Alert

${notification.subject}

Message: ${notification.message}
Priority: ${notification.priority.toUpperCase()}
Time: ${new Date().toLocaleString()}
${notification.machineId ? `Machine: ${notification.machineId}` : ''}

---
This is an automated alert from your Industrial AI Predictive Maintenance System.
For questions, contact maintenance leadership team.
    `;
  }

  // Generate SMS message
  private static generateSMSMessage(notification: NotificationRequest): string {
    return `Industrial AI Alert: ${notification.message}. Priority: ${notification.priority.toUpperCase()}. ${notification.machineId ? `Machine: ${notification.machineId}` : ''}`;
  }

  // Simulate SendGrid email sending
  private static async simulateSendGrid(emailContent: EmailTemplate): Promise<boolean> {
    try {
      console.log(`📧 Simulating SendGrid email send to: ${emailContent.to}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success response
      console.log(`📧 Email sent via SendGrid API`);
      return true;
    } catch (error) {
      console.error('❌ SendGrid simulation error:', error);
      return false;
    }
  }

  // Simulate SMS sending
  private static async simulateSMS(smsContent: SMSMessage): Promise<boolean> {
    try {
      console.log(`📱 Simulating SMS send to: ${smsContent.to}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate success response
      console.log(`📱 SMS sent via SMS service`);
      return true;
    } catch (error) {
      console.error('❌ SMS simulation error:', error);
      return false;
    }
  }

  // Send combined notification (email + SMS)
  static async sendNotification(notification: NotificationRequest): Promise<{ email: boolean; sms: boolean }> {
    const results = await Promise.all([
      this.sendEmail(notification),
      this.sendSMS(notification)
    ]);

    return {
      email: results[0],
      sms: results[1]
    };
  }

  // Get notification history
  static async getNotificationHistory(limit: number = 50): Promise<any[]> {
    try {
      // Here you would query PostgreSQL for notification history
      console.log(`📋 Retrieving ${limit} notifications from database`);
      
      // Return mock data for now
      const mockHistory = [
        {
          id: 'notif_001',
          type: 'email',
          recipient: 'manager@company.com',
          subject: 'Critical Alert: Machine MACHINE_01',
          message: 'Temperature exceeding maximum threshold',
          priority: 'critical',
          sentAt: new Date(Date.now() - 3600000).toISOString(),
          status: 'sent'
        },
        {
          id: 'notif_002',
          type: 'sms',
          recipient: '+1234567890',
          message: 'Machine failure predicted',
          priority: 'high',
          sentAt: new Date(Date.now() - 7200000).toISOString(),
          status: 'sent'
        }
      ];
      
      return mockHistory.slice(0, limit);
    } catch (error) {
      console.error('❌ Error retrieving notification history:', error);
      return [];
    }
  }
}
