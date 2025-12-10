'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '@/styles/ProgressPage.module.css';

// Define the interface for journal entries
interface JournalEntry {
  id: number;
  date: string;
  content: string;
}

export default function ProgressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [journalEntry, setJournalEntry] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([
    { id: 1, date: '2025-03-20', content: 'Noticed increased energy levels today. Morning protocol went well, and I felt more focused during the day.' },
    { id: 2, date: '2025-03-19', content: 'Digestive system feels much better after 3 weeks on the program. Less inflammation and better overall well-being.' },
    { id: 3, date: '2025-03-18', content: 'Completed all protocols as scheduled. Spooky scalar session was particularly effective today.' }
  ]);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Function to handle journal entry submission
  const handleSaveEntry = () => {
    if (!journalEntry.trim()) {
      setSaveMessage('Please enter some text for your journal entry');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    // In a real app, this would save to the database
    const newEntry: JournalEntry = {
      id: Date.now(), // Simple unique ID
      date: formattedDate,
      content: journalEntry
    };
    
    setEntries([newEntry, ...entries]);
    setJournalEntry('');
    setSaveMessage('Journal entry saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleDeleteEntry = (id: number) => {
    setEntries(entries.filter(entry => entry.id !== id));
    setSaveMessage('Entry deleted');
    setTimeout(() => setSaveMessage(''), 3000);
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

  // Sample progress data
  const weeklyData = [
    { week: 'Week 1', liver: 20, colon: 15 },
    { week: 'Week 2', liver: 35, colon: 28 },
    { week: 'Week 3', liver: 48, colon: 40 },
    { week: 'Week 4', liver: 65, colon: 55 },
    { week: 'Week 5', liver: 80, colon: 75 },
    { week: 'Current', liver: 92, colon: 88 },
  ];

  return (
    <DashboardLayout>
      <div className="py-8 px-6 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Progress Tracking</h1>
          <p className="mt-2 text-gray-600">
            Monitor your bioelectric regeneration journey
          </p>
        </div>
        
        {saveMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
            {saveMessage}
          </div>
        )}
        
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
          <div className="md:col-span-8 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 border-b pb-2">Regeneration Progress</h2>
            <div className="h-64 flex items-center justify-center">
              <div className="w-full px-4">
                <div className="space-y-10 w-full">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Liver Regeneration</span>
                      <span className="text-sm font-medium">92%</span>
                    </div>
                    <div className={styles.liverProgressBar}>
                      <div className={`${styles.liverFill} ${styles.width92}`}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Colon Regeneration</span>
                      <span className="text-sm font-medium">88%</span>
                    </div>
                    <div className={styles.colonProgressBar}>
                      <div className={`${styles.colonFill} ${styles.width88}`}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Overall Health Index</span>
                      <span className="text-sm font-medium">90%</span>
                    </div>
                    <div className={styles.overallProgressBar}>
                      <div className={`${styles.overallFill} ${styles.width90}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-4 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 border-b pb-2">Weekly Snapshots</h2>
            <div className="overflow-y-auto max-h-64">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liver</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colon</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {weeklyData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.week}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.liver}%</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.colon}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Journal Entries */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 border-b pb-2">Progress Journal</h2>
          <div className="mb-6">
            <label htmlFor="journal-entry" className="block text-sm font-medium text-gray-700 mb-2">
              Add Today's Entry
            </label>
            <textarea
              id="journal-entry"
              rows={4}
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              placeholder="How are you feeling today? Note any changes or improvements..."
            ></textarea>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleSaveEntry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm transition-colors font-medium"
              >
                Save Entry
              </button>
            </div>
          </div>
          
          <div className="space-y-6 mt-8">
            <h3 className="text-lg font-medium">Recent Entries</h3>
            {entries.map((entry) => (
              <div key={entry.id} className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-700">{entry.date}</span>
                  <div className="flex space-x-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                    <button 
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{entry.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
