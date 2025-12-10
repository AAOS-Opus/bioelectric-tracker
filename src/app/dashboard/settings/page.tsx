'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { FiUser, FiLock, FiSettings, FiActivity, FiBell, FiArrowUp } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsNavigation } from '@/components/settings/SettingsNavigation';
import { SettingsFormField } from '@/components/settings/SettingsFormField';
import { ThemeToggle } from '@/components/settings/ThemeToggle';
import { MotionSettings } from '@/contexts/MotionContext';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/motion/LoadingSpinner';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { FadeIn, SlideUp } from '@/components/motion/MotionElement';
import PhaseSettings from '@/components/dashboard/PhaseSettings';
import { motion } from 'framer-motion';

const navigationItems = [
  { id: 'profile', label: 'Profile', icon: FiUser },
  { id: 'account', label: 'Account', icon: FiLock },
  { id: 'preferences', label: 'Preferences', icon: FiSettings },
  { id: 'protocols', label: 'Protocols', icon: FiActivity },
  { id: 'notifications', label: 'Notifications', icon: FiBell }
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [protocolReminders, setProtocolReminders] = useState('daily');

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    redirect('/auth/login');
  }

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email')
    };

    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating profile' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      {/* <SettingsNavigation items={navigationItems} /> */}
      
      <main className="max-w-6xl mx-auto px-6 py-8 pb-24">
        {message.text && (
          <SlideUp>
            <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          </SlideUp>
        )}

        <StaggerContainer>
          <StaggerItem>
            <SettingsSection
              id="profile"
              title="Profile Settings"
              description="Manage your personal information and preferences"
              icon={FiUser}
            >
              <SettingsCard>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <SettingsFormField
                    label="Name"
                    description="Your display name visible to other users"
                  >
                    <Input
                      type="text"
                      name="name"
                      defaultValue={session.user?.name || ''}
                      disabled={isSaving}
                      className="max-w-md"
                    />
                  </SettingsFormField>

                  <SettingsFormField
                    label="Email"
                    description="Your email address for notifications"
                  >
                    <Input
                      type="email"
                      name="email"
                      defaultValue={session.user?.email || ''}
                      disabled={isSaving}
                      className="max-w-md"
                    />
                  </SettingsFormField>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : null}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </SettingsCard>
            </SettingsSection>
          </StaggerItem>

          <StaggerItem>
            <SettingsSection
              id="preferences"
              title="Preferences"
              description="Customize your experience"
              icon={FiSettings}
            >
              <SettingsCard variant="expanded">
                <ThemeToggle />
                
                <MotionSettings className="p-4" />

                <SettingsFormField
                  label="Protocol Reminders"
                  description="How often should we remind you about your protocols?"
                  className="p-4"
                >
                  <Select value={protocolReminders} onValueChange={setProtocolReminders}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingsFormField>
              </SettingsCard>
            </SettingsSection>
          </StaggerItem>

          <StaggerItem>
            <SettingsSection
              id="notifications"
              title="Notifications"
              description="Manage your notification preferences"
              icon={FiBell}
            >
              <SettingsCard variant="expanded">
                <SettingsFormField
                  label="Enable Notifications"
                  description="Receive updates about your progress and protocols"
                  className="p-4"
                >
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </SettingsFormField>
              </SettingsCard>
            </SettingsSection>
          </StaggerItem>

          <StaggerItem>
            <SettingsSection
              id="protocols"
              title="Protocol Settings"
              description="Configure your bioelectric regeneration protocols"
              icon={FiActivity}
            >
              <PhaseSettings />
            </SettingsSection>
          </StaggerItem>
        </StaggerContainer>

        {/* Back to top button */}
        <FadeIn>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-full shadow-lg transition-colors"
            aria-label="Scroll to top"
          >
            <FiArrowUp className="w-5 h-5" />
          </button>
        </FadeIn>

      </main>
    </DashboardLayout>
  );
}
