'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logMessage, setLogMessage] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Function to handle logging product usage
  const handleLogUsage = async (productName: string) => {
    try {
      setIsLogging(productName);
      
      // Make API call to log product usage
      const response = await fetch('/api/products/log-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          productName,
          timestamp: new Date().toISOString(),
          userId: session?.user?.email
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log product usage');
      }

      const data = await response.json();
      setLogMessage(data.message || `Usage of ${productName} logged successfully!`);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setLogMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error logging product usage:', error);
      setLogMessage('Error: Failed to log product usage. Please try again.');
      
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-8 px-6 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-gray-600">
            Track your supplementation and healing products
          </p>
        </div>
        
        {logMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
            {logMessage}
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 border-b pb-2">Available Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Product cards with proper spacing */}
            <div className="border rounded-lg p-5 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-lg mb-3">Detox Formula</h3>
              <div className="text-sm text-gray-600 mb-6 h-20">
                Supports your natural detoxification pathways and helps remove environmental toxins.
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm font-medium text-blue-600">Daily Usage</span>
                <button 
                  onClick={() => handleLogUsage('Detox Formula')}
                  disabled={isLogging !== null}
                  className={`${
                    isLogging === 'Detox Formula' 
                      ? 'bg-blue-400 cursor-wait' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white px-4 py-2 rounded-lg text-sm transition-colors`}
                >
                  {isLogging === 'Detox Formula' ? 'Logging...' : 'Log Usage'}
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-5 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-lg mb-3">Mitochondrial Support</h3>
              <div className="text-sm text-gray-600 mb-6 h-20">
                Enhances cellular energy production and supports mitochondrial function.
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm font-medium text-blue-600">Daily Usage</span>
                <button 
                  onClick={() => handleLogUsage('Mitochondrial Support')}
                  disabled={isLogging !== null}
                  className={`${
                    isLogging === 'Mitochondrial Support' 
                      ? 'bg-blue-400 cursor-wait' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white px-4 py-2 rounded-lg text-sm transition-colors`}
                >
                  {isLogging === 'Mitochondrial Support' ? 'Logging...' : 'Log Usage'}
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-5 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-lg mb-3">Binder Complex</h3>
              <div className="text-sm text-gray-600 mb-6 h-20">
                Helps bind and eliminate toxins from the digestive tract for comprehensive detoxification.
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm font-medium text-blue-600">Daily Usage</span>
                <button 
                  onClick={() => handleLogUsage('Binder Complex')}
                  disabled={isLogging !== null}
                  className={`${
                    isLogging === 'Binder Complex' 
                      ? 'bg-blue-400 cursor-wait' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white px-4 py-2 rounded-lg text-sm transition-colors`}
                >
                  {isLogging === 'Binder Complex' ? 'Logging...' : 'Log Usage'}
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-5 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-lg mb-3">Cellular Regenerator</h3>
              <div className="text-sm text-gray-600 mb-6 h-20">
                Supports your bioelectric regeneration process and cellular renewal.
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm font-medium text-blue-600">Daily Usage</span>
                <button 
                  onClick={() => handleLogUsage('Cellular Regenerator')}
                  disabled={isLogging !== null}
                  className={`${
                    isLogging === 'Cellular Regenerator' 
                      ? 'bg-blue-400 cursor-wait' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white px-4 py-2 rounded-lg text-sm transition-colors`}
                >
                  {isLogging === 'Cellular Regenerator' ? 'Logging...' : 'Log Usage'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
