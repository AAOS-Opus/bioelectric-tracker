import { connectDB } from '@/lib/db'
import mongoose from 'mongoose'
import { addDays, startOfDay, endOfDay, subDays } from 'date-fns'
import sgMail from '@sendgrid/mail'
import twilio from 'twilio'
import { generateEmailTemplate } from '@/lib/templates/emailTemplate'
import { PushNotificationService } from './pushNotificationService'
import * as webPush from 'web-push'

// Define interfaces locally to avoid circular dependencies
interface NotificationSettingsInterface extends mongoose.Document {
  userEmail: string;
  dailyReminders: boolean;
  modalityAlerts: boolean;
  weeklyReports: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  preferredTime: string;
  timezone: string;
  phoneNumber?: string;
}

interface NotificationInterface extends mongoose.Document {
  userEmail: string;
  type: string;
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'read' | 'failed';
  priority: 'low' | 'medium' | 'high';
  category: 'protocol' | 'device' | 'progress' | 'health' | 'maintenance';
  scheduledFor: Date;
  sentAt?: Date;
  readAt?: Date;
  metadata: {
    phaseNumber?: number;
    modalityId?: mongoose.Types.ObjectId | string;
    reportUrl?: string;
    actionRequired?: boolean;
    achievementType?: 'streak' | 'milestone' | 'improvement';
    biomarkerType?: string;
    biomarkerValue?: number;
    deviceType?: string;
    [key: string]: any;
  };
  style?: {
    icon?: string;
    color?: string;
    image?: string;
  };
  save(): Promise<this>;
}

interface ModalitySessionInterface extends mongoose.Document {
  userEmail: string;
  type: 'Spooky Scalar' | 'MWO';
  date: Date;
  duration: number;
  completed: boolean;
  notes?: string;
  _id: mongoose.Types.ObjectId | string;
}

interface ProgressNoteInterface extends mongoose.Document {
  userEmail: string;
  date: Date;
  biomarkers: Map<string, number> | Record<string, number>;
  notes: string;
  attachments?: string[];
}

// Initialize email and SMS services
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

// Set up web push notifications
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:support@bioelectric-tracker.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export class NotificationService {
  // Initialize models here to avoid circular dependencies
  private static get NotificationSettings() {
    return mongoose.models.NotificationSettings as mongoose.Model<NotificationSettingsInterface>;
  }

  private static get Notification() {
    return mongoose.models.Notification as mongoose.Model<NotificationInterface>;
  }

  private static get ModalitySession() {
    return mongoose.models.ModalitySession as mongoose.Model<ModalitySessionInterface>;
  }

  private static get ProgressNote() {
    return mongoose.models.ProgressNote as mongoose.Model<ProgressNoteInterface>;
  }

  private static get Phase() {
    return mongoose.models.Phase;
  }

  static async scheduleDailyReminder(userEmail: string, phaseNumber: number): Promise<void> {
    await connectDB()

    const settings = await this.NotificationSettings.findOne({ userEmail })
    if (!settings || !settings.dailyReminders) return

    const phase = await this.Phase.findOne({ 
      userEmail, 
      phaseNumber 
    })
    
    if (!phase) return

    const reminder = new this.Notification({
      userEmail,
      type: 'daily_reminder',
      title: `Day ${Math.floor((new Date().getTime() - new Date(phase.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1)} of Phase ${phaseNumber}`,
      message: `Remember your protocols for today. ${phase.affirmationText || ''}`,
      status: 'pending',
      priority: 'medium',
      category: 'protocol',
      scheduledFor: new Date(),
      metadata: {
        phaseNumber,
        actionRequired: true
      },
      style: {
        icon: '📋',
        color: '#3B82F6'
      }
    })

    await reminder.save()
  }

  // Handle modality session notifications
  static async scheduleModalityAlerts(userEmail: string): Promise<void> {
    await connectDB()

    const settings = await this.NotificationSettings.findOne({ userEmail })
    if (!settings || !settings.modalityAlerts) return

    const upcomingSessions = await this.ModalitySession.find({
      userEmail,
      date: { $gt: new Date() },
      completed: false
    })

    for (const session of upcomingSessions) {
      const sessionData = session as unknown as { 
        _id: string;
        date: Date;
        type: 'Spooky Scalar' | 'MWO';
      }

      const alert = new this.Notification({
        userEmail,
        type: 'modality_alert',
        title: `Upcoming ${sessionData.type} Session`,
        message: this.getModalityPreparationInstructions(sessionData.type),
        status: 'pending',
        priority: 'high',
        category: 'device',
        scheduledFor: subDays(new Date(sessionData.date), 1),
        metadata: {
          modalityId: sessionData._id,
          actionRequired: true,
          deviceType: sessionData.type
        },
        style: {
          icon: '🔬',
          color: '#8B5CF6'
        }
      })

      await alert.save()
    }
  }

  static async scheduleWeeklyProgressReport(userEmail: string): Promise<void> {
    await connectDB()

    const settings = await this.NotificationSettings.findOne({ userEmail })
    if (!settings || !settings.weeklyReports) return

    const lastWeek = {
      start: startOfDay(subDays(new Date(), 7)),
      end: endOfDay(new Date())
    }

    const progressNotes = await this.ProgressNote.find({
      userEmail,
      date: { $gte: lastWeek.start, $lte: lastWeek.end }
    }) as ProgressNoteInterface[]

    const biomarkerTrends = await this.getBiomarkerTrends(userEmail)
    const reportUrl = `/dashboard/reports/weekly/${lastWeek.start.toISOString()}`

    const report = new this.Notification({
      userEmail,
      type: 'weekly_report',
      title: 'Your Weekly Progress Report',
      message: this.generateWeeklyReportMessage(biomarkerTrends),
      status: 'pending',
      priority: 'medium',
      category: 'progress',
      scheduledFor: new Date(),
      metadata: {
        reportUrl,
        actionRequired: false
      },
      style: {
        icon: '📊',
        color: '#10B981'
      }
    })

    await report.save()
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await connectDB()
    await this.Notification.findByIdAndUpdate(notificationId, {
      status: 'read',
      readAt: new Date()
    })
  }

  static async getNotifications(userEmail: string): Promise<NotificationInterface[]> {
    await connectDB()
    return this.Notification.find({ 
      userEmail,
      status: { $in: ['sent', 'read'] }
    }).sort({ 
      scheduledFor: -1 
    }) as unknown as NotificationInterface[]
  }

  static async processScheduledNotifications(): Promise<void> {
    await connectDB()
    
    const pendingNotifications = await this.Notification.find({
      status: 'pending',
      scheduledFor: { $lte: new Date() }
    }) as NotificationInterface[]
    
    for (const notification of pendingNotifications) {
      await this.deliverNotification(notification)
    }
  }

  static async deliverNotification(notification: NotificationInterface): Promise<void> {
    const { userEmail } = notification
    
    const settings = await this.NotificationSettings.findOne({ userEmail })
    if (!settings) return
    
    // Mark as sent immediately to prevent duplicate deliveries
    notification.status = 'sent'
    notification.sentAt = new Date()
    await notification.save()
    
    // Deliver via enabled channels
    const deliveryPromises = []
    
    if (settings.channels.email) {
      deliveryPromises.push(this.sendEmailNotification(notification))
    }
    
    if (settings.channels.sms && settings.phoneNumber) {
      deliveryPromises.push(this.sendSmsNotification(notification, settings.phoneNumber))
    }
    
    // Handle push notification
    if (settings.channels.inApp) {
      try {
        // We would need to look up the user's push subscription from a database
        // This is a placeholder - in a real implementation, you would fetch from DB
        const subscriptions = await this.getPushSubscriptions(notification.userEmail);
        
        // Send to all user's registered devices
        if (subscriptions && subscriptions.length > 0) {
          const pushPromises = subscriptions.map(subscription => 
            PushNotificationService.sendPushNotification(
              subscription,
              notification.title,
              notification.message,
              {
                icon: notification.style?.icon ? `/icons/${notification.category}.png` : undefined,
                data: {
                  url: notification.metadata.reportUrl || '/dashboard/notifications',
                  notificationId: notification._id.toString(),
                  type: notification.type,
                  category: notification.category
                }
              }
            )
          );
          
          deliveryPromises.push(Promise.all(pushPromises));
        }
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }
    
    await Promise.all(deliveryPromises)
  }

  private static async sendEmailNotification(notification: NotificationInterface): Promise<void> {
    if (!process.env.SENDGRID_API_KEY || !process.env.EMAIL_FROM) return
    
    try {
      const msg = {
        to: notification.userEmail,
        from: process.env.EMAIL_FROM,
        subject: notification.title,
        html: generateEmailTemplate({
          title: notification.title,
          message: notification.message,
          buttonText: notification.metadata.actionRequired ? 'View Details' : undefined,
          buttonUrl: notification.metadata.reportUrl,
          icon: notification.style?.icon
        })
      }
      
      await sgMail.send(msg)
    } catch (error) {
      console.error('Error sending email notification:', error)
    }
  }

  private static async sendSmsNotification(notification: NotificationInterface, phoneNumber: string): Promise<void> {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) return
    
    try {
      await twilioClient.messages.create({
        body: `${notification.title}: ${notification.message}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      })
    } catch (error) {
      console.error('Error sending SMS notification:', error)
    }
  }

  private static getModalityPreparationInstructions(modalityType: string): string {
    const instructions = {
      'Spooky Scalar': 'Please hydrate well and avoid caffeine for 4 hours before your session. Wear comfortable clothing and plan for 30-45 minutes of rest during treatment.',
      'MWO': 'Ensure you have eaten a light meal 1-2 hours before your session. Remove any metal jewelry or electronic devices before treatment.'
    }
    
    return instructions[modalityType as keyof typeof instructions] || 'Prepare for your upcoming session'
  }

  private static async getBiomarkerTrends(userEmail: string, days: number = 14): Promise<Record<string, string>> {
    const startDate = subDays(new Date(), days)
    
    const progressNotes = await this.ProgressNote.find({
      userEmail,
      date: { $gte: startDate }
    }).sort({ date: 1 })

    const trends: Record<string, string> = {}
    const biomarkers = ['energyLevel', 'sleepQuality', 'detoxSymptoms']

    for (const marker of biomarkers) {
      const values = progressNotes
        .map(note => {
          // Check if biomarkers is a Map or a plain object
          let biomarkerValue: number | null = null;
          
          if (note.biomarkers instanceof Map) {
            biomarkerValue = note.biomarkers.get(marker) as number;
          } else if (typeof note.biomarkers === 'object' && note.biomarkers !== null) {
            const biomarkerObj = note.biomarkers as unknown as Record<string, number>;
            biomarkerValue = biomarkerObj[marker];
          }
          
          return typeof biomarkerValue === 'number' ? biomarkerValue : null;
        })
        .filter((value): value is number => value !== null)

      if (values.length < 2) continue

      const trend = values[values.length - 1] - values[0]
      trends[marker] = trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'
    }

    return trends
  }

  private static generateWeeklyReportMessage(trends: Record<string, string>): string {
    const messages = []
    
    for (const [marker, trend] of Object.entries(trends)) {
      const markerName = marker === 'energyLevel' 
        ? 'Energy Level' 
        : marker === 'sleepQuality' 
          ? 'Sleep Quality' 
          : 'Detox Symptoms'
          
      const trendEmoji = trend === 'improving' 
        ? '📈' 
        : trend === 'declining' 
          ? '📉' 
          : '➡️'
      
      messages.push(`${markerName}: ${trendEmoji} ${trend.charAt(0).toUpperCase() + trend.slice(1)}`)
    }
    
    if (messages.length === 0) {
      return 'We need more data to generate your weekly trends. Please continue logging your progress.'
    }
    
    return `Here are your weekly trends:\n\n${messages.join('\n')}\n\nView your full report for more details.`
  }

  private static async getPushSubscriptions(userEmail: string): Promise<webPush.PushSubscription[]> {
    // In a real implementation, this would query your database
    // for the user's saved push subscriptions
    
    // For testing/development purposes, this returns an empty array
    // so no actual push notifications are attempted
    return [];
    
    // Example of what the real implementation might look like:
    // const subscriptionsCollection = mongoose.connection.collection('pushSubscriptions');
    // const results = await subscriptionsCollection.find({ userEmail }).toArray();
    // return results.map(result => result.subscription);
  }
}
