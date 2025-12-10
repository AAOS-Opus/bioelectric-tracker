'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  LayoutGrid, 
  PanelLeft, 
  BarChart3, 
  CalendarDays, 
  Gauge, 
  Settings2, 
  Sparkles 
} from 'lucide-react'
import styles from './WizardSteps.module.css'

interface DashboardPreferences {
  layout: string;
  widgets: string[];
}

interface DashboardIntroStepProps {
  preferences: DashboardPreferences;
  onUpdatePreferences: (preferences: DashboardPreferences) => void;
}

export default function DashboardIntroStep({ 
  preferences, 
  onUpdatePreferences 
}: DashboardIntroStepProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Your Personalized Dashboard</h2>
        <p className={styles.description}>
          Your Bioelectric Regeneration Tracker dashboard is fully customizable to meet your needs.
          Let's explore the key features you'll be using to track your healing journey.
        </p>
      </div>

      <div className={styles.preview}>
        <div className={styles.previewContent}>
          <div className={styles.previewIcon}>
            <LayoutGrid className={styles.icon} />
          </div>
          <h3 className={styles.previewTitle}>Dashboard Preview</h3>
          <p className={styles.previewDescription}>
            Your dashboard will be populated with the biomarkers and products you've selected,
            organized in a way that makes tracking your protocol simple and intuitive.
          </p>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.featureSection}>
          <h3 className={styles.featureTitle}>
            <LayoutGrid className={styles.icon} />
            Dashboard Personalization
          </h3>
          
          <div className={styles.featureList}>
            <Feature 
              icon={<PanelLeft className={styles.icon} />}
              title="Widget Management"
              description="Add, remove, and resize widgets to customize your experience. Widgets display your biomarkers, product usage, and treatment schedule."
            />
            
            <Feature 
              icon={<Sparkles className={styles.icon} />}
              title="Layout Presets"
              description="Save multiple dashboard layouts for different phases of your protocol or different aspects of tracking."
            />
            
            <Feature 
              icon={<BarChart3 className={styles.icon} />}
              title="Visualization Options"
              description="Choose how your data is displayed - charts, progress bars, or numerical displays to suit your preferences."
            />
            
            <Feature 
              icon={<CalendarDays className={styles.icon} />}
              title="Schedule Integration"
              description="View your product and treatment schedule directly in your dashboard for easy reference."
            />
          </div>
        </div>

        <div className={styles.featureSection}>
          <h3 className={styles.featureTitle}>
            <Settings2 className={styles.icon} />
            Key Dashboard Components
          </h3>
          
          <Card className={styles.card}>
            <CardContent className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Phase Progress Tracker</h4>
                <Gauge className={styles.icon} />
              </div>
              <div className={styles.progressBar}>
                <div className={`${styles.progress} ${styles.progressWidth35}`}></div>
              </div>
              <p className={styles.cardDescription}>
                Visualize your progress through each phase of the protocol with clear indicators
                of where you are in your healing journey.
              </p>
            </CardContent>
          </Card>
          
          <Card className={styles.card}>
            <CardContent className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Product Checklist</h4>
                <CalendarDays className={styles.icon} />
              </div>
              <div className={styles.checklist}>
                <div className={styles.checklistItem}>
                  <span>Zeolite Pure</span>
                  <span className={styles.checkmark}>✓ Taken</span>
                </div>
                <div className={styles.checklistItem}>
                  <span>Fulvic Acid Complex</span>
                  <span className={styles.pending}>Pending</span>
                </div>
              </div>
              <p className={styles.cardDescription}>
                Track your daily protocol adherence with easy-to-use checklists for supplements and treatments.
              </p>
            </CardContent>
          </Card>
          
          <Card className={styles.card}>
            <CardContent className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Biomarker Trends</h4>
                <BarChart3 className={styles.icon} />
              </div>
              <div className={styles.chart}>
                {[35, 42, 28, 50, 60, 55, 65].map((h, i) => (
                  <div 
                    key={i} 
                    className={`${styles.chartBar} ${styles[`chartBarHeight${h}`]}`}
                  ></div>
                ))}
              </div>
              <p className={styles.cardDescription}>
                Visualize changes in your selected biomarkers over time to identify improvements and patterns.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className={styles.tips}>
        <h3 className={styles.tipTitle}>Customization Tips</h3>
        <ul className={styles.tipList}>
          <li className={styles.tipItem}>
            <span className={styles.bullet}>•</span>
            <span>Start with just a few key widgets to avoid overwhelming your dashboard</span>
          </li>
          <li className={styles.tipItem}>
            <span className={styles.bullet}>•</span>
            <span>Place your most frequently used widgets at the top for easy access</span>
          </li>
          <li className={styles.tipItem}>
            <span className={styles.bullet}>•</span>
            <span>Use the "Save Layout" feature to create different views for different needs</span>
          </li>
          <li className={styles.tipItem}>
            <span className={styles.bullet}>•</span>
            <span>Consider creating a simplified layout for mobile viewing</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

function Feature({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string 
}) {
  return (
    <div className={styles.feature}>
      <div className={styles.featureIcon}>{icon}</div>
      <div>
        <h4 className={styles.featureTitle}>{title}</h4>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  )
}
