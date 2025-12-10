"use client";

/**
 * HooksTest Component
 *
 * Test component to verify all custom SWR hooks work correctly.
 * This component should be temporarily added to a page for testing.
 */

import { useCurrentPhase } from '@/hooks/useCurrentPhase';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useProducts } from '@/hooks/useProducts';
import { useNotifications } from '@/hooks/useNotifications';

export function HooksTest() {
  // Test all hooks
  const currentPhase = useCurrentPhase();
  const userProgress = useUserProgress();
  const products = useProducts();
  const notifications = useNotifications({ limit: 10 });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">SWR Hooks Test Dashboard</h1>

      {/* Current Phase Test */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Current Phase Hook</h2>
        {currentPhase.isLoading && (
          <div className="text-blue-500">Loading current phase...</div>
        )}
        {currentPhase.error && (
          <div className="text-red-500">
            Error: {currentPhase.error.message}
            {currentPhase.error.status && ` (${currentPhase.error.status})`}
          </div>
        )}
        {currentPhase.data && (
          <div className="space-y-2">
            <p><strong>Phase:</strong> {currentPhase.data.phase.name}</p>
            <p><strong>Progress:</strong> {currentPhase.data.completionPercentage}%</p>
            <p><strong>Products:</strong> {currentPhase.data.assignedProducts.length}</p>
            <p><strong>Remaining Days:</strong> {currentPhase.data.remainingDays}</p>
          </div>
        )}
        <button
          onClick={() => currentPhase.mutate()}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          disabled={currentPhase.isValidating}
        >
          {currentPhase.isValidating ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* User Progress Test */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">User Progress Hook</h2>
        {userProgress.isLoading && (
          <div className="text-blue-500">Loading user progress...</div>
        )}
        {userProgress.error && (
          <div className="text-red-500">
            Error: {userProgress.error.message}
            {userProgress.error.status && ` (${userProgress.error.status})`}
          </div>
        )}
        {userProgress.data && (
          <div className="space-y-2">
            <p><strong>User:</strong> {userProgress.data.user.name}</p>
            <p><strong>Current Phase:</strong> {userProgress.data.currentPhase.name}</p>
            <p><strong>Compliance Streak:</strong> {userProgress.data.user.complianceStreak} days</p>
            <p><strong>Today's Compliance:</strong> {userProgress.data.productCompliance.today.percentage}%</p>
          </div>
        )}
        <button
          onClick={() => userProgress.refresh()}
          className="mt-2 px-3 py-1 bg-green-500 text-white rounded text-sm"
          disabled={userProgress.isValidating}
        >
          {userProgress.isValidating ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Products Test */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Products Hook</h2>
        {products.isLoading && (
          <div className="text-blue-500">Loading products...</div>
        )}
        {products.error && (
          <div className="text-red-500">
            Error: {products.error.message}
            {products.error.status && ` (${products.error.status})`}
          </div>
        )}
        {products.products && (
          <div className="space-y-2">
            <p><strong>Product Count:</strong> {products.products.length}</p>
            {products.products.slice(0, 3).map(product => (
              <div key={product._id} className="border-l-4 border-blue-400 pl-3">
                <p><strong>{product.name}</strong></p>
                <p>Today: {product.usage.todayCompleted ? '✅ Completed' : '⏳ Pending'}</p>
                <p>Streak: {product.usage.streakDays} days</p>
                {!product.usage.todayCompleted && (
                  <button
                    onClick={() => products.logUsage({ productId: product._id })}
                    className="mt-1 px-2 py-1 bg-purple-500 text-white rounded text-xs"
                    disabled={products.isLoggingUsage}
                  >
                    {products.isLoggingUsage ? 'Logging...' : 'Log Usage'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => products.mutate()}
          className="mt-2 px-3 py-1 bg-purple-500 text-white rounded text-sm"
          disabled={products.isValidating}
        >
          {products.isValidating ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Notifications Test */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Notifications Hook</h2>
        {notifications.isLoading && (
          <div className="text-blue-500">Loading notifications...</div>
        )}
        {notifications.error && (
          <div className="text-red-500">
            Error: {notifications.error.message}
            {notifications.error.status && ` (${notifications.error.status})`}
          </div>
        )}
        {notifications.data && (
          <div className="space-y-2">
            <p><strong>Total:</strong> {notifications.data.totalCount}</p>
            <p><strong>Unread:</strong> {notifications.unreadCount}</p>
            {notifications.notifications.slice(0, 3).map(notification => (
              <div key={notification._id} className="border-l-4 border-yellow-400 pl-3">
                <p><strong>{notification.title}</strong></p>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs">
                  {notification.isRead ? '✅ Read' : '📬 Unread'} • {notification.priority}
                </p>
                {!notification.isRead && (
                  <button
                    onClick={() => notifications.markAsRead(notification._id)}
                    className="mt-1 px-2 py-1 bg-yellow-500 text-white rounded text-xs"
                    disabled={notifications.isMarkingAsRead}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 space-x-2">
          <button
            onClick={() => notifications.mutate()}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
            disabled={notifications.isValidating}
          >
            {notifications.isValidating ? 'Refreshing...' : 'Refresh'}
          </button>
          {notifications.unreadCount > 0 && (
            <button
              onClick={() => notifications.markAllAsRead()}
              className="px-3 py-1 bg-orange-500 text-white rounded text-sm"
              disabled={notifications.isMarkingAsRead}
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Test Status Summary */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Test Status Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded ${currentPhase.data ? 'bg-green-100' : currentPhase.error ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <p className="font-medium">Current Phase</p>
            <p className="text-sm">
              {currentPhase.data ? '✅ Success' : currentPhase.error ? '❌ Error' : '⏳ Loading'}
            </p>
          </div>
          <div className={`p-3 rounded ${userProgress.data ? 'bg-green-100' : userProgress.error ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <p className="font-medium">User Progress</p>
            <p className="text-sm">
              {userProgress.data ? '✅ Success' : userProgress.error ? '❌ Error' : '⏳ Loading'}
            </p>
          </div>
          <div className={`p-3 rounded ${products.products ? 'bg-green-100' : products.error ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <p className="font-medium">Products</p>
            <p className="text-sm">
              {products.products ? '✅ Success' : products.error ? '❌ Error' : '⏳ Loading'}
            </p>
          </div>
          <div className={`p-3 rounded ${notifications.data ? 'bg-green-100' : notifications.error ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <p className="font-medium">Notifications</p>
            <p className="text-sm">
              {notifications.data ? '✅ Success' : notifications.error ? '❌ Error' : '⏳ Loading'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}