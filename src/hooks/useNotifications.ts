/**
 * useNotifications Hook
 *
 * Fetches notifications with real-time updates and polling.
 * Supports marking notifications as read with optimistic updates.
 */

import useSWR, { mutate as globalMutate } from 'swr';
import { fetcher, postFetcher, swrConfig, handleSWRError, FetchError } from '@/lib/fetcher';
import { useCallback, useState } from 'react';

// Notification data structure
export interface Notification {
  _id: string;
  type: 'reminder' | 'achievement' | 'system' | 'progress' | 'celebration';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>; // Additional notification data
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string; // URL to navigate when notification is clicked
}

export interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  hasMore: boolean;
}

export interface UseNotificationsReturn {
  data: NotificationsData | undefined;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: FetchError | undefined;
  mutate: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
  isValidating: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isMarkingAsRead: boolean;
}

/**
 * Hook to fetch notifications with auto-polling
 */
export function useNotifications(options: {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
} = {}): UseNotificationsReturn {
  const {
    limit = 50,
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute default
  } = options;

  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  const {
    data,
    error,
    mutate,
    isValidating,
  } = useSWR<NotificationsData, FetchError>(
    `/api/notifications?limit=${limit}`,
    fetcher,
    {
      ...swrConfig,
      onError: handleSWRError,
      // Auto-poll for notifications if enabled
      refreshInterval: autoRefresh ? refreshInterval : 0,
      // Always revalidate on focus for notifications
      revalidateOnFocus: true,
      // Faster retry for notifications
      errorRetryInterval: 1000,
    }
  );

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    if (!data) return;

    setIsMarkingAsRead(true);

    try {
      // Optimistic update
      const optimisticData = {
        ...data,
        notifications: data.notifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, data.unreadCount - 1),
      };

      // Update local data immediately
      mutate(optimisticData, false);

      // Send API request
      await postFetcher('/api/notifications/mark-read', { notificationId });

      // Refresh to get latest data
      mutate();
    } catch (error) {
      // Revert optimistic update on error
      mutate();
      throw error;
    } finally {
      setIsMarkingAsRead(false);
    }
  }, [data, mutate]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!data) return;

    setIsMarkingAsRead(true);

    try {
      // Optimistic update
      const optimisticData = {
        ...data,
        notifications: data.notifications.map(notification => ({
          ...notification,
          isRead: true
        })),
        unreadCount: 0,
      };

      // Update local data immediately
      mutate(optimisticData, false);

      // Send API request
      await postFetcher('/api/notifications/mark-all-read');

      // Refresh to get latest data
      mutate();
    } catch (error) {
      // Revert optimistic update on error
      mutate();
      throw error;
    } finally {
      setIsMarkingAsRead(false);
    }
  }, [data, mutate]);

  return {
    data,
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading: !data && !error,
    error,
    mutate,
    isValidating,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead,
  };
}

/**
 * Hook for unread notifications count only (lightweight)
 */
export function useUnreadCount() {
  const {
    data,
    error,
    mutate,
    isValidating,
  } = useSWR<{ unreadCount: number }, FetchError>(
    '/api/notifications/unread-count',
    fetcher,
    {
      ...swrConfig,
      onError: handleSWRError,
      refreshInterval: 30000, // 30 seconds for count
      revalidateOnFocus: true,
    }
  );

  return {
    unreadCount: data?.unreadCount || 0,
    isLoading: !data && !error,
    error,
    mutate,
    isValidating,
  };
}

/**
 * Hook for recent notifications (last 24 hours)
 */
export function useRecentNotifications() {
  const {
    data,
    error,
    mutate,
    isValidating,
  } = useSWR<Notification[], FetchError>(
    '/api/notifications/recent',
    fetcher,
    {
      ...swrConfig,
      onError: handleSWRError,
      refreshInterval: 120000, // 2 minutes
    }
  );

  return {
    notifications: data || [],
    isLoading: !data && !error,
    error,
    mutate,
    isValidating,
  };
}