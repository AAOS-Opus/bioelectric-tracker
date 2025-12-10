/**
 * Toast Notification Utility
 *
 * Simple toast notification system for user feedback.
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
}

function createToast(message: string, type: ToastType, options: ToastOptions = {}) {
  const { duration = 3000 } = options;

  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `
    px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-out
    translate-x-full opacity-0 max-w-sm
    ${type === 'success' ? 'bg-green-500 text-white' : ''}
    ${type === 'error' ? 'bg-red-500 text-white' : ''}
    ${type === 'info' ? 'bg-blue-500 text-white' : ''}
    ${type === 'warning' ? 'bg-yellow-500 text-white' : ''}
  `.replace(/\s+/g, ' ').trim();

  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium">${message}</span>
    </div>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('translate-x-0', 'opacity-100');
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      toast.remove();
      // Clean up container if empty
      if (container && container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, duration);
}

export const showToast = {
  success: (message: string, options?: ToastOptions) => createToast(message, 'success', options),
  error: (message: string, options?: ToastOptions) => createToast(message, 'error', options),
  info: (message: string, options?: ToastOptions) => createToast(message, 'info', options),
  warning: (message: string, options?: ToastOptions) => createToast(message, 'warning', options),
};

export default showToast;
