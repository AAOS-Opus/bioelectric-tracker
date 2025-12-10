"use client";

import { memo, useMemo } from 'react';
import { Notification } from '@/hooks/useNotifications';
import { FetchError } from '@/lib/fetcher';
import { Clock, AlertCircle, Sun, Zap, Snowflake, ChevronRight, CalendarPlus, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpcomingModalitiesCardProps {
  notifications: Notification[];
  isLoading: boolean;
  error: FetchError | undefined;
}

export const UpcomingModalitiesCard = memo(function UpcomingModalitiesCard({
  notifications,
  isLoading,
  error
}: UpcomingModalitiesCardProps) {
  const modalityNotifications = useMemo(() =>
    notifications?.filter(
      notification => notification.type === 'reminder' &&
    (notification.message.toLowerCase().includes('modality') ||
     notification.message.toLowerCase().includes('session'))
  ) || [], [notifications]);

  // Mock upcoming sessions for demonstration (in real app, this would come from a modalities API)
  const upcomingSessionsMock = [
    {
      id: '1',
      name: 'Red Light Therapy',
      time: '9:00 AM',
      duration: '20 min',
      category: 'Light Therapy'
    },
    {
      id: '2',
      name: 'PEMF Session',
      time: '2:00 PM',
      duration: '30 min',
      category: 'Electromagnetic'
    },
    {
      id: '3',
      name: 'Cold Therapy',
      time: '6:00 PM',
      duration: '15 min',
      category: 'Temperature'
    }
  ];

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6 transition-all duration-200">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gray-700 rounded-lg"></div>
            <div className="h-6 bg-gray-700 rounded w-40"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-700 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-700 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-red-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-900/50 rounded-lg flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Upcoming Modalities</h3>
        </div>
        <p className="text-red-400 text-sm">
          Unable to load modality data. {error.message}
        </p>
      </div>
    );
  }

  const hasUpcomingSessions = upcomingSessionsMock.length > 0;

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6 transition-all duration-200 hover:border-purple-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Upcoming Modalities</h3>
        </div>
        {hasUpcomingSessions && (
          <span className="text-sm font-medium text-purple-400 bg-purple-900/30 px-2 py-1 rounded-md">
            Today
          </span>
        )}
      </div>

      {/* Sessions List */}
      {!hasUpcomingSessions ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-700/50 rounded-lg mx-auto mb-3 flex items-center justify-center">
            <Clock className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-400 text-sm mb-3">
            No modalities scheduled for today
          </p>
          <button className={cn(
            "text-sm font-medium px-4 py-2 rounded-lg transition-all",
            "text-purple-400 bg-purple-900/30 hover:bg-purple-900/50 hover:text-purple-300",
            "focus:outline-none focus:ring-2 focus:ring-purple-500"
          )}>
            <span className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              Schedule a session
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingSessionsMock.map((session, index) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-700/50 hover:border-purple-500/30 hover:bg-gray-700/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                {/* Session Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  session.category === 'Light Therapy' && 'bg-gradient-to-br from-yellow-500 to-amber-600',
                  session.category === 'Electromagnetic' && 'bg-gradient-to-br from-blue-500 to-indigo-600',
                  session.category === 'Temperature' && 'bg-gradient-to-br from-cyan-500 to-blue-600'
                )}>
                  {session.category === 'Light Therapy' ? (
                    <Sun className="h-5 w-5 text-white" />
                  ) : session.category === 'Electromagnetic' ? (
                    <Zap className="h-5 w-5 text-white" />
                  ) : (
                    <Snowflake className="h-5 w-5 text-white" />
                  )}
                </div>

                {/* Session Details */}
                <div>
                  <p className="text-sm font-medium text-white">
                    {session.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {session.category} • {session.duration}
                  </p>
                </div>
              </div>

              {/* Time and Action */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {session.time}
                  </p>
                  {index === 0 && (
                    <p className="text-xs text-green-400">
                      Next up
                    </p>
                  )}
                </div>
                <button className="text-purple-400 hover:text-purple-300 p-1 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Reminders */}
      {modalityNotifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-sm font-medium text-gray-300 mb-2">Recent Reminders</p>
          <div className="space-y-2">
            {modalityNotifications.slice(0, 2).map((notification) => (
              <div key={notification._id} className="flex items-start gap-2 p-2 bg-purple-900/20 border border-purple-500/20 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-xs text-purple-200">
                  {notification.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {hasUpcomingSessions && (
        <div className="mt-4 pt-4 border-t border-gray-700/50 flex gap-2">
          <button className={cn(
            "flex-1 text-sm font-medium px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2",
            "text-purple-400 bg-purple-900/30 hover:bg-purple-900/50 hover:text-purple-300",
            "focus:outline-none focus:ring-2 focus:ring-purple-500"
          )}>
            <Calendar className="h-4 w-4" />
            View Schedule
          </button>
          <button className={cn(
            "flex-1 text-sm font-medium px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2",
            "text-gray-400 bg-gray-700/50 hover:bg-gray-700 hover:text-gray-300",
            "focus:outline-none focus:ring-2 focus:ring-gray-500"
          )}>
            <CalendarPlus className="h-4 w-4" />
            Add Session
          </button>
        </div>
      )}
    </div>
  );
});