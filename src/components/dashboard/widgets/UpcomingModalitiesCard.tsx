"use client";

import { memo, useMemo } from 'react';
import { Notification } from '@/hooks/useNotifications';
import { FetchError } from '@/lib/fetcher';

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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Modalities</h3>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm">
          Unable to load modality data. {error.message}
        </p>
      </div>
    );
  }

  const hasUpcomingSessions = upcomingSessionsMock.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Modalities</h3>
        </div>
        {hasUpcomingSessions && (
          <span className="text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md">
            Today
          </span>
        )}
      </div>

      {/* Sessions List */}
      {!hasUpcomingSessions ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-3 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
            No modalities scheduled for today
          </p>
          <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
            Schedule a session
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingSessionsMock.map((session, index) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Session Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  session.category === 'Light Therapy' ? 'bg-yellow-100 dark:bg-yellow-900' :
                  session.category === 'Electromagnetic' ? 'bg-blue-100 dark:bg-blue-900' :
                  'bg-cyan-100 dark:bg-cyan-900'
                }`}>
                  {session.category === 'Light Therapy' ? (
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : session.category === 'Electromagnetic' ? (
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.415 5 5 0 010-7.072 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.243 1 1 0 010-1.414zM10 8a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Session Details */}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {session.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.category} • {session.duration}
                  </p>
                </div>
              </div>

              {/* Time and Action */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {session.time}
                  </p>
                  {index === 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Next up
                    </p>
                  )}
                </div>
                <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Reminders */}
      {modalityNotifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Reminders</p>
          <div className="space-y-2">
            {modalityNotifications.slice(0, 2).map((notification) => (
              <div key={notification._id} className="flex items-start gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="w-4 h-4 bg-purple-500 rounded-full mt-0.5 flex-shrink-0"></div>
                <p className="text-xs text-purple-800 dark:text-purple-200">
                  {notification.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {hasUpcomingSessions && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button className="flex-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
            View Schedule
          </button>
          <button className="flex-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            Add Session
          </button>
        </div>
      )}
    </div>
  );
});