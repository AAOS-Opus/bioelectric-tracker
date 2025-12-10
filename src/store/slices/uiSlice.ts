import { v4 as uuidv4 } from 'uuid';
import { produce } from 'immer';
import { UISlice, ThemeMode, Notification } from '../types';

export const createUISlice: UISlice = (set, get) => ({
  theme: 'system',
  isSidebarOpen: true,
  notifications: [],
  unreadNotifications: 0,
  isCommandPaletteOpen: false,

  setTheme: (theme) => {
    set({ theme });
    
    // Apply theme to document if running in browser
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else if (theme === 'system') {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      }
    }
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (isOpen) => {
    set({ isSidebarOpen: isOpen });
  },

  addNotification: (notification) => {
    set(
      produce((state) => {
        const newNotification = {
          ...notification,
          id: notification.id || uuidv4(),
          createdAt: notification.createdAt || new Date(),
          read: notification.read || false
        };
        
        state.notifications.unshift(newNotification);
        
        // Keep only the latest 50 notifications
        if (state.notifications.length > 50) {
          state.notifications = state.notifications.slice(0, 50);
        }
        
        // Update unread count
        state.unreadNotifications = state.notifications.filter((n: Notification) => !n.read).length;
      })
    );
  },

  markNotificationAsRead: (id) => {
    set(
      produce((state) => {
        const notification = state.notifications.find((n: Notification) => n.id === id);
        if (notification) {
          notification.read = true;
          state.unreadNotifications = state.notifications.filter((n: Notification) => !n.read).length;
        }
      })
    );
  },

  clearNotifications: () => {
    set({ notifications: [], unreadNotifications: 0 });
  },

  toggleCommandPalette: () => {
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen }));
  }
});