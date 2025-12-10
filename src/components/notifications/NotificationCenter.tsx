"use client";

/**
 * NotificationCenter Component
 *
 * Elegant notification system with bell icon, dropdown panel, and real-time updates.
 * Delivers structured, meaningful alerts to users in a non-intrusive manner.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format, isToday, isYesterday } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';

export interface Notification {
  id: string;
  type: 'product-logged' | 'modality-completed' | 'insight' | 'system-alert';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  metadata?: {
    productName?: string;
    modalityType?: string;
    phaseProgress?: number;
    [key: string]: any;
  };
}

interface NotificationIconProps {
  type: Notification['type'];
}

function NotificationIcon({ type }: NotificationIconProps) {
  const iconMap = {
    'product-logged': '📋',
    'modality-completed': '⚡',
    'insight': '💡',
    'system-alert': '🔔',
  };

  const colorMap = {
    'product-logged': 'text-green-500',
    'modality-completed': 'text-blue-500',
    'insight': 'text-amber-500',
    'system-alert': 'text-red-500',
  };

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${colorMap[type]} bg-gray-100 dark:bg-gray-700`}>
      {iconMap[type]}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <NotificationIcon type={notification.type} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {new Date(notification.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Mock notifications for development - replace with actual hook
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'product-logged',
      title: 'Product Logged Successfully',
      message: 'Your morning supplement routine has been recorded.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      isRead: false,
      metadata: { productName: 'Liver Cleanse' }
    },
    {
      id: '2',
      type: 'modality-completed',
      title: 'Scalar Session Complete',
      message: 'Your 30-minute scalar healing session has been logged.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      isRead: false,
      metadata: { modalityType: 'scalar' }
    },
    {
      id: '3',
      type: 'insight',
      title: 'Energy Trend Insight',
      message: 'Your energy levels have improved by 15% this week!',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      isRead: true,
    },
    {
      id: '4',
      type: 'system-alert',
      title: 'Phase Progress Update',
      message: 'You\'re now 75% through Phase 2 of your liver cleanse journey.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      isRead: true,
      metadata: { phaseProgress: 75 }
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) {
      return `Today at ${format(d, 'h:mm a')}`;
    }
    if (isYesterday(d)) {
      return `Yesterday at ${format(d, 'h:mm a')}`;
    }
    return format(d, 'MMM d, yyyy');
  }

  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {/* Bell Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 animate-in slide-in-from-top-2 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500">
                  🔔
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No notifications yet
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  We'll notify you about important updates
                </p>
              </div>
            ) : (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
              <button className="w-full text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-center">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
