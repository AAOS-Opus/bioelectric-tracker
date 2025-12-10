import React, { useState, useEffect } from 'react';
import { User, Practitioner } from '@/types/user';
import { JournalEntry } from '@/types/journal';
import { useUser } from '@/hooks/useUser';

interface JournalSharingControlsProps {
  entry: JournalEntry | null;
  onShareUpdate: (entryId: string, practitionerIds: string[]) => Promise<void>;
}

const JournalSharingControls: React.FC<JournalSharingControlsProps> = ({
  entry,
  onShareUpdate
}) => {
  const { user } = useUser();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedPractitioners, setSelectedPractitioners] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch practitioners
  useEffect(() => {
    const fetchPractitioners = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/practitioners');
        
        if (!response.ok) {
          throw new Error('Failed to fetch practitioners');
        }
        
        const data = await response.json();
        setPractitioners(data.practitioners);
        
        // Set initial selection based on entry
        if (entry && entry.sharedWith) {
          setSelectedPractitioners(entry.sharedWith);
        } else {
          setSelectedPractitioners([]);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching practitioners:', err);
        setError('Failed to load practitioners. Please try again.');
        setIsLoading(false);
      }
    };

    fetchPractitioners();
  }, [entry]);

  // Handle practitioner selection toggle
  const handlePractitionerToggle = (practitionerId: string) => {
    setSelectedPractitioners(prev => {
      if (prev.includes(practitionerId)) {
        return prev.filter(id => id !== practitionerId);
      } else {
        return [...prev, practitionerId];
      }
    });
  };

  // Handle saving sharing preferences
  const handleSaveSharing = async () => {
    if (!entry) return;
    
    try {
      setIsLoading(true);
      await onShareUpdate(entry.id, selectedPractitioners);
      
      setSuccessMessage('Sharing preferences updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating sharing preferences:', err);
      setError('Failed to update sharing preferences. Please try again.');
      setIsLoading(false);
    }
  };

  if (!entry) {
    return (
      <div className="journal-sharing-controls" data-testid="journal-sharing-controls">
        <p className="no-entry-message">Select an entry to manage sharing settings.</p>
      </div>
    );
  }

  return (
    <div className="journal-sharing-controls" data-testid="journal-sharing-controls">
      <div className="sharing-header">
        <h3>Share This Journal Entry</h3>
        {entry.isShared && (
          <div className="sharing-status">
            <span className="status-dot"></span>
            <span>Currently shared with {entry.sharedWith?.length || 0} practitioner(s)</span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      <div className="sharing-explanation">
        <p>
          Sharing your journal entries with practitioners helps them understand your progress
          and provide better guidance during your regeneration journey.
        </p>
        <p className="security-note">
          <strong>Note:</strong> Your entries are securely encrypted and can only be viewed
          by practitioners you explicitly select below.
        </p>
      </div>

      <div className="practitioner-list">
        <h4>Select Practitioners</h4>
        {isLoading ? (
          <div className="loading-indicator">Loading practitioners...</div>
        ) : practitioners.length === 0 ? (
          <div className="no-practitioners">
            No practitioners found. Please contact support if you need to connect with a practitioner.
          </div>
        ) : (
          <div className="practitioners">
            {practitioners.map(practitioner => (
              <label key={practitioner.id} className="practitioner-item">
                <input
                  type="checkbox"
                  checked={selectedPractitioners.includes(practitioner.id)}
                  onChange={() => handlePractitionerToggle(practitioner.id)}
                  disabled={isLoading}
                />
                <div className="practitioner-info">
                  <span className="practitioner-name">{practitioner.name}</span>
                  {practitioner.specialty && (
                    <span className="practitioner-specialty">{practitioner.specialty}</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="privacy-reminder">
        <p>
          You can change these sharing settings at any time. Revoking access will immediately
          prevent practitioners from seeing your entry.
        </p>
      </div>

      <div className="sharing-actions">
        <button
          className="save-sharing-btn"
          onClick={handleSaveSharing}
          disabled={isLoading || !entry}
        >
          {isLoading ? 'Saving...' : 'Save Sharing Settings'}
        </button>
      </div>

      <style jsx>{`
        .journal-sharing-controls {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .sharing-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #111827;
        }

        .sharing-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #10b981;
        }

        .error-message {
          background-color: #fee2e2;
          color: #b91c1c;
          padding: 0.75rem;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .success-message {
          background-color: #d1fae5;
          color: #047857;
          padding: 0.75rem;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .sharing-explanation {
          margin-bottom: 1.5rem;
        }

        .sharing-explanation p {
          margin: 0.5rem 0;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .security-note {
          font-size: 0.75rem;
          color: #6b7280;
          padding: 0.5rem;
          background-color: #f3f4f6;
          border-radius: 0.25rem;
        }

        .practitioner-list {
          margin-bottom: 1.5rem;
        }

        h4 {
          margin: 0 0 0.75rem;
          font-size: 1rem;
          color: #374151;
        }

        .loading-indicator,
        .no-practitioners,
        .no-entry-message {
          padding: 1rem;
          color: #6b7280;
          text-align: center;
          font-size: 0.875rem;
        }

        .practitioners {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 15rem;
          overflow-y: auto;
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
        }

        .practitioner-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          cursor: pointer;
          border-radius: 0.25rem;
          transition: background-color 0.2s;
        }

        .practitioner-item:hover {
          background-color: #f9fafb;
        }

        .practitioner-info {
          display: flex;
          flex-direction: column;
        }

        .practitioner-name {
          font-weight: 500;
          color: #111827;
        }

        .practitioner-specialty {
          font-size: 0.75rem;
          color: #6b7280;
        }

        input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
        }

        .privacy-reminder {
          margin-bottom: 1.5rem;
        }

        .privacy-reminder p {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }

        .sharing-actions {
          display: flex;
          justify-content: flex-end;
        }

        .save-sharing-btn {
          padding: 0.5rem 1rem;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .save-sharing-btn:hover:not(:disabled) {
          background-color: #4338ca;
        }

        .save-sharing-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default JournalSharingControls;
