'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function ModalitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logMessage, setLogMessage] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Function to handle logging modality sessions
  const handleLogSession = async (modalityName: string) => {
    try {
      setIsLogging(modalityName);
      
      // Make API call to log modality session
      const response = await fetch('/api/modalities/log-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          modalityName,
          duration: 30, // Default duration in minutes
          timestamp: new Date().toISOString(),
          userId: session?.user?.email
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log modality session');
      }

      const data = await response.json();
      setLogMessage(data.message || `Session of ${modalityName} logged successfully!`);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setLogMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error logging modality session:', error);
      setLogMessage('Error: Failed to log modality session. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setLogMessage(null);
      }, 3000);
    } finally {
      setIsLogging(null);
    }
  };

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-8 px-6 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">Modalities</h1>
          <p className="mt-2 text-muted-foreground">
            Track your bioelectric treatments and healing modalities
          </p>
        </div>
        
        {logMessage && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md text-primary">
            {logMessage}
          </div>
        )}
        
        <div className="bg-card rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 border-b border-border pb-2 text-foreground">Available Modalities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Spooky Scalar */}
            <div className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow bg-card">
              <h3 className="font-medium text-lg mb-3 text-foreground">Spooky Scalar</h3>
              <div className="text-sm text-muted-foreground mb-6 h-24">
                Non-invasive scalar wave therapy for cellular regeneration. Helps enhance cellular 
                communication and energy production.
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm font-medium text-primary">Recommended: 2x daily</span>
                <button 
                  onClick={() => handleLogSession('Spooky Scalar')}
                  disabled={isLogging !== null}
                  className={cn(
                    'text-white px-4 py-2 rounded-lg text-sm transition-colors',
                    isLogging === 'Spooky Scalar' 
                      ? 'bg-primary/70 cursor-wait' 
                      : 'bg-primary hover:bg-primary/90'
                  )}
                >
                  {isLogging === 'Spooky Scalar' ? 'Logging...' : 'Log Session'}
                </button>
              </div>
            </div>
            
            {/* MWO */}
            <div className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow bg-card">
              <h3 className="font-medium text-lg mb-3 text-foreground">MWO (Multi-Wave Oscillator)</h3>
              <div className="text-sm text-muted-foreground mb-6 h-24">
                Multi-frequency therapy for cellular detoxification and rejuvenation. Supports elimination 
                of toxins and cellular revitalization.
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm font-medium text-primary">Recommended: 1x daily</span>
                <button 
                  onClick={() => handleLogSession('MWO')}
                  disabled={isLogging !== null}
                  className={cn(
                    'text-white px-4 py-2 rounded-lg text-sm transition-colors',
                    isLogging === 'MWO' 
                      ? 'bg-primary/70 cursor-wait' 
                      : 'bg-primary hover:bg-primary/90'
                  )}
                >
                  {isLogging === 'MWO' ? 'Logging...' : 'Log Session'}
                </button>
              </div>
            </div>
            
            {/* Schedule - Fixed layout with proper spacing */}
            <div className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow md:col-span-2 mt-4 bg-card">
              <h3 className="font-medium text-lg mb-4 text-foreground">Weekly Schedule</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Day</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Morning</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Afternoon</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Evening</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                      <tr key={day} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        <td className="px-4 py-3 text-sm text-foreground">{day}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">-</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">-</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
