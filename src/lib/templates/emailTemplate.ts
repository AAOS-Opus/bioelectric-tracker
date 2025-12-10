interface NotificationEmailProps {
  title: string;
  message: string;
  buttonText?: string;
  buttonUrl?: string;
  icon?: string;
  type?: string;
  category?: string;
  metadata?: {
    phaseNumber?: number;
    actionRequired?: boolean;
    achievementType?: string;
    biomarkerType?: string;
    biomarkerValue?: number;
    reportUrl?: string;
    [key: string]: any;
  };
}

export function generateEmailTemplate({
  title,
  message,
  buttonText,
  buttonUrl,
  icon,
  type,
  category,
  metadata
}: NotificationEmailProps): string {
  const getHeaderColor = () => {
    const colors = {
      daily_reminder: '#3B82F6', // blue
      modality_alert: '#8B5CF6', // purple
      weekly_report: '#10B981', // green
      phase_transition: '#6366F1', // indigo
      health_insight: '#14B8A6', // teal
      detox_warning: '#F59E0B', // amber
      supplement_reorder: '#06B6D4', // cyan
      achievement: '#F43F5E', // rose
      biomarker_alert: '#10B981', // emerald
      hydration_reminder: '#0EA5E9', // sky
      rest_period: '#8B5CF6', // violet
      device_maintenance: '#6B7280' // gray
    }
    return colors[type as keyof typeof colors] || '#3B82F6'
  }

  const getIcon = () => {
    const icons = {
      daily_reminder: '⏰',
      modality_alert: '🔬',
      weekly_report: '📊',
      phase_transition: '✨',
      health_insight: 'ℹ️',
      detox_warning: '⚠️',
      supplement_reorder: '💊',
      achievement: '🏆',
      biomarker_alert: '📈',
      hydration_reminder: '💧',
      rest_period: '🌙',
      device_maintenance: '🔧'
    }
    return icon || icons[type as keyof typeof icons] || 'ℹ️'
  }

  const getCategoryLabel = () => {
    const labels = {
      protocol: 'Treatment Protocol',
      device: 'Device Management',
      progress: 'Progress Tracking',
      health: 'Health Status',
      maintenance: 'System Maintenance'
    }
    return labels[category as keyof typeof labels] || 'Notification'
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1F2937;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #FFFFFF;
          }

          .header {
            background-color: ${getHeaderColor()};
            padding: 32px 24px;
            text-align: center;
            border-radius: 12px 12px 0 0;
          }

          .header-icon {
            font-size: 36px;
            margin-bottom: 16px;
          }

          .header-title {
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
          }

          .header-category {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin-top: 8px;
          }

          .content {
            padding: 32px 24px;
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-top: none;
            border-radius: 0 0 12px 12px;
          }

          .message {
            color: #374151;
            font-size: 16px;
            margin: 0 0 24px;
          }

          .metadata {
            background: #F3F4F6;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
          }

          .metadata-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            color: #4B5563;
            font-size: 14px;
          }

          .metadata-item:last-child {
            margin-bottom: 0;
          }

          .action-button {
            display: inline-block;
            background-color: ${getHeaderColor()};
            color: #FFFFFF;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin-top: 24px;
          }

          .footer {
            text-align: center;
            padding: 24px;
            color: #6B7280;
            font-size: 12px;
          }

          .divider {
            height: 1px;
            background: #E5E7EB;
            margin: 24px 0;
          }

          @media (max-width: 600px) {
            .container {
              width: 100%;
            }
            
            .header, .content {
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-icon">${getIcon()}</div>
            <h1 class="header-title">${title}</h1>
            <div class="header-category">${getCategoryLabel()}</div>
          </div>
          
          <div class="content">
            <p class="message">${message}</p>

            ${metadata?.phaseNumber ? `
              <div class="metadata">
                <div class="metadata-item">
                  <strong>Phase:</strong> &nbsp;${metadata.phaseNumber}
                </div>
              </div>
            ` : ''}

            ${metadata?.biomarkerType ? `
              <div class="metadata">
                <div class="metadata-item">
                  <strong>${metadata.biomarkerType}:</strong> &nbsp;${metadata.biomarkerValue}
                </div>
              </div>
            ` : ''}

            ${buttonText && buttonUrl ? `
              <div style="text-align: center;">
                <a href="${buttonUrl}" class="action-button">
                  ${buttonText}
                </a>
              </div>
            ` : ''}

            <div class="divider"></div>

            <div style="text-align: center;">
              <a href="https://bioelectric-tracker.com/dashboard/notifications" style="color: ${getHeaderColor()}; text-decoration: none;">
                View All Notifications
              </a>
            </div>
          </div>

          <div class="footer">
            <p>You received this email because you enabled notifications in your Bioelectric Regeneration Tracker settings.</p>
            <p> 2025 Bioelectric Regeneration Tracker. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
