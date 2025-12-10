'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Loader2,
  Check,
  AlertCircle,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  Download,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { usePreferences } from '@/contexts/PreferencesContext';
import toast from 'react-hot-toast';

type SettingsSection = 'profile' | 'security' | 'preferences' | 'data';

interface ProfileData {
  name: string;
  email: string;
  currentPhaseNumber: number;
  programStartDate: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const { preferences, setThemePreference, setNotificationPreference } = usePreferences();
  const setTheme = useStore((state) => state.setTheme);
  const currentTheme = useStore((state) => state.theme);

  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    currentPhaseNumber: 1,
    programStartDate: null
  });
  const [editedName, setEditedName] = useState('');
  const [hasProfileChanges, setHasProfileChanges] = useState(false);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notification state - FM-NOTIF-003: Use debounced local state
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    inApp: true,
    sms: false
  });
  const [pendingNotificationUpdate, setPendingNotificationUpdate] = useState(false);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch('/api/settings/profile');
        const data = await response.json();

        if (data.success) {
          setProfile(data.profile);
          setEditedName(data.profile.name);
        } else {
          // Fallback to session data
          setProfile({
            name: session.user.name || '',
            email: session.user.email || '',
            currentPhaseNumber: session.user.currentPhaseNumber || 1,
            programStartDate: null
          });
          setEditedName(session.user.name || '');
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        // Fallback to session data
        setProfile({
          name: session.user.name || '',
          email: session.user.email || '',
          currentPhaseNumber: session.user.currentPhaseNumber || 1,
          programStartDate: null
        });
        setEditedName(session.user.name || '');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      loadProfile();
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [session, status, router]);

  // Sync notification settings from preferences
  useEffect(() => {
    if (preferences?.notificationSettings) {
      setNotificationSettings({
        email: preferences.notificationSettings.email ?? true,
        inApp: preferences.notificationSettings.inApp ?? true,
        sms: preferences.notificationSettings.sms ?? false
      });
    }
  }, [preferences?.notificationSettings]);

  // Track profile changes
  useEffect(() => {
    setHasProfileChanges(editedName !== profile.name);
  }, [editedName, profile.name]);

  // Handle profile save - FM-SESS-004: Update session after save
  const handleSaveProfile = async () => {
    if (!hasProfileChanges) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setProfile(prev => ({ ...prev, name: editedName.trim() }));
        setHasProfileChanges(false);

        // FM-SESS-004: Refresh session with new name
        if (updateSession) {
          await updateSession({
            ...session,
            user: { ...session?.user, name: editedName.trim() }
          });
        }

        toast.success('Profile updated successfully');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile save error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change - FM-SEC-001: Require current password
  const handleChangePassword = async () => {
    setPasswordError(null);

    // Validation
    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError('New password is required');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm)
      });

      const data = await response.json();

      if (data.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Password changed successfully');
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle theme change - FM-PREF-002: Update both Zustand and Context
  const handleThemeChange = useCallback((theme: 'light' | 'dark' | 'system') => {
    // Update Zustand store (handles DOM and localStorage)
    setTheme(theme);

    // Update PreferencesContext (syncs to MongoDB)
    setThemePreference('mode', theme);
    setThemePreference('current', theme);

    toast.success(`Theme changed to ${theme}`);
  }, [setTheme, setThemePreference]);

  // Handle notification toggle - FM-NOTIF-003: Debounced updates
  const handleNotificationToggle = useCallback((key: 'email' | 'inApp' | 'sms') => {
    const newValue = !notificationSettings[key];

    // Update local state immediately for responsive UI
    setNotificationSettings(prev => ({ ...prev, [key]: newValue }));

    // Mark as pending to prevent rapid fire
    if (!pendingNotificationUpdate) {
      setPendingNotificationUpdate(true);

      // Debounce the actual save
      setTimeout(async () => {
        try {
          // Update via PreferencesContext which handles MongoDB sync
          setNotificationPreference('channels', {
            ...preferences?.notifications?.channels,
            [key]: newValue
          });
          toast.success('Notification settings updated');
        } catch (error) {
          console.error('Notification toggle error:', error);
          // Revert on failure
          setNotificationSettings(prev => ({ ...prev, [key]: !newValue }));
          toast.error('Failed to update notification settings');
        } finally {
          setPendingNotificationUpdate(false);
        }
      }, 500);
    }
  }, [notificationSettings, pendingNotificationUpdate, preferences?.notifications?.channels, setNotificationPreference]);

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'data', label: 'Data & Privacy', icon: Shield }
  ];

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account and preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="md:w-64 flex-shrink-0">
            <nav className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 overflow-hidden">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as SettingsSection)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-all',
                      isActive
                        ? 'bg-purple-600/20 text-purple-400 border-l-2 border-purple-500'
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white border-l-2 border-transparent'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{section.label}</span>
                    <ChevronRight className={cn(
                      'h-4 w-4 ml-auto transition-transform',
                      isActive && 'rotate-90'
                    )} />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-400" />
                    Profile Information
                  </h2>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className={cn(
                          'w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg',
                          'text-white placeholder-gray-500',
                          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                        )}
                      />
                    </div>

                    {/* Email (read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className={cn(
                          'w-full px-4 py-3 bg-gray-900/30 border border-gray-700/50 rounded-lg',
                          'text-gray-400 cursor-not-allowed'
                        )}
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Current Phase */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Phase
                      </label>
                      <div className="px-4 py-3 bg-gray-900/30 border border-gray-700/50 rounded-lg text-gray-300">
                        Phase {profile.currentPhaseNumber}
                      </div>
                    </div>

                    {/* Save Button */}
                    {hasProfileChanges && (
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className={cn(
                          'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all',
                          'bg-gradient-to-r from-purple-600 to-purple-500 text-white',
                          'hover:from-purple-500 hover:to-purple-400',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Lock className="h-5 w-5 text-purple-400" />
                    Security Settings
                  </h2>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Change Password</h3>

                    {passwordError && (
                      <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {passwordError}
                      </div>
                    )}

                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password *
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                        className={cn(
                          'w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg',
                          'text-white placeholder-gray-500',
                          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                        )}
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password *
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password (min 8 characters)"
                        className={cn(
                          'w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg',
                          'text-white placeholder-gray-500',
                          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                        )}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className={cn(
                          'w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg',
                          'text-white placeholder-gray-500',
                          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                        )}
                      />
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword}
                      className={cn(
                        'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all',
                        'bg-gradient-to-r from-purple-600 to-purple-500 text-white',
                        'hover:from-purple-500 hover:to-purple-400',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Change Password
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Preferences Section */}
              {activeSection === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-400" />
                    Preferences
                  </h2>

                  {/* Theme Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: Monitor }
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => handleThemeChange(value as 'light' | 'dark' | 'system')}
                          className={cn(
                            'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                            currentTheme === value
                              ? 'border-purple-500 bg-purple-900/30 text-white'
                              : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600 hover:text-white'
                          )}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-sm font-medium">{label}</span>
                          {currentTheme === value && (
                            <Check className="h-4 w-4 text-purple-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notification Toggles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Notifications
                    </label>
                    <div className="space-y-3">
                      {[
                        { key: 'email' as const, label: 'Email notifications', description: 'Receive updates via email' },
                        { key: 'inApp' as const, label: 'In-app notifications', description: 'Show notifications in the app' },
                        { key: 'sms' as const, label: 'SMS reminders', description: 'Receive text message reminders' }
                      ].map(({ key, label, description }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-4 bg-gray-900/30 rounded-lg border border-gray-700/50"
                        >
                          <div>
                            <p className="text-white font-medium">{label}</p>
                            <p className="text-sm text-gray-500">{description}</p>
                          </div>
                          <button
                            onClick={() => handleNotificationToggle(key)}
                            disabled={pendingNotificationUpdate}
                            className={cn(
                              'relative w-12 h-6 rounded-full transition-colors',
                              notificationSettings[key] ? 'bg-purple-600' : 'bg-gray-600',
                              pendingNotificationUpdate && 'opacity-50'
                            )}
                          >
                            <span
                              className={cn(
                                'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
                                notificationSettings[key] && 'translate-x-6'
                              )}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Data & Privacy Section */}
              {activeSection === 'data' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    Data & Privacy
                  </h2>

                  {/* Export Data */}
                  <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-700/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-medium flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Export Your Data
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Download a copy of all your data including progress, preferences, and journal entries.
                        </p>
                      </div>
                      <button
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                          'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                        )}
                        onClick={() => toast('Export feature coming soon', { icon: '📦' })}
                      >
                        Export
                      </button>
                    </div>
                  </div>

                  {/* Delete Account */}
                  <div className="p-4 bg-red-900/10 rounded-lg border border-red-500/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-red-400 font-medium flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete Account
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                      </div>
                      <button
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                          'bg-red-900/50 text-red-400 hover:bg-red-900 hover:text-red-300',
                          'border border-red-500/30'
                        )}
                        onClick={() => toast.error('Please contact support to delete your account')}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
