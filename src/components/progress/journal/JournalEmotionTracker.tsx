import React from 'react';
import { Emotion } from '@/types/journal';

interface JournalEmotionTrackerProps {
  selectedEmotion: Emotion;
  onEmotionChange: (emotion: Emotion) => void;
  readOnly?: boolean;
}

const JournalEmotionTracker: React.FC<JournalEmotionTrackerProps> = ({
  selectedEmotion,
  onEmotionChange,
  readOnly = false
}) => {
  const emotions: { value: Emotion; label: string; icon: string; color: string }[] = [
    { 
      value: 'joyful', 
      label: 'Joyful', 
      icon: '😄', 
      color: '#fbbf24' 
    },
    { 
      value: 'optimistic', 
      label: 'Optimistic', 
      icon: '😊', 
      color: '#a3e635' 
    },
    { 
      value: 'content', 
      label: 'Content', 
      icon: '🙂', 
      color: '#34d399' 
    },
    { 
      value: 'neutral', 
      label: 'Neutral', 
      icon: '😐', 
      color: '#60a5fa' 
    },
    { 
      value: 'fatigued', 
      label: 'Fatigued', 
      icon: '😩', 
      color: '#818cf8' 
    },
    { 
      value: 'anxious', 
      label: 'Anxious', 
      icon: '😰', 
      color: '#a78bfa' 
    },
    { 
      value: 'frustrated', 
      label: 'Frustrated', 
      icon: '😤', 
      color: '#f472b6' 
    },
    { 
      value: 'discouraged', 
      label: 'Discouraged', 
      icon: '😔', 
      color: '#fb7185' 
    }
  ];

  return (
    <div className="emotion-tracker" data-testid="emotion-tracker">
      <h3 className="emotion-tracker-title">How are you feeling today?</h3>
      
      <div 
        className="emotion-scale" 
        role="radiogroup" 
        aria-label="Select your emotion"
      >
        {emotions.map((emotion) => (
          <button
            key={emotion.value}
            className={`emotion-button ${selectedEmotion === emotion.value ? 'selected' : ''} emotion-${emotion.value}`}
            type="button"
            onClick={() => !readOnly && onEmotionChange(emotion.value)}
            disabled={readOnly}
            aria-checked={selectedEmotion === emotion.value ? 'true' : 'false'}
            role="radio"
          >
            <span className="emotion-icon">{emotion.icon}</span>
            <span className="emotion-label">{emotion.label}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .emotion-tracker {
          background-color: #f9fafb;
          padding: 1rem;
          border-radius: 8px;
        }

        .emotion-tracker-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #4b5563;
          margin-top: 0;
          margin-bottom: 0.75rem;
        }

        .emotion-scale {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }

        .emotion-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          border: 2px solid transparent;
          border-radius: 8px;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .emotion-button:hover:not(:disabled) {
          background-color: #f3f4f6;
        }

        .emotion-button.selected {
          border-color: var(--emotion-color);
          background-color: rgba(var(--emotion-color), 0.1);
        }

        .emotion-button:disabled {
          cursor: default;
        }

        .emotion-icon {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }

        .emotion-label {
          font-size: 0.75rem;
          color: #4b5563;
        }

        .emotion-joyful {
          --emotion-color: #fbbf24;
        }

        .emotion-optimistic {
          --emotion-color: #a3e635;
        }

        .emotion-content {
          --emotion-color: #34d399;
        }

        .emotion-neutral {
          --emotion-color: #60a5fa;
        }

        .emotion-fatigued {
          --emotion-color: #818cf8;
        }

        .emotion-anxious {
          --emotion-color: #a78bfa;
        }

        .emotion-frustrated {
          --emotion-color: #f472b6;
        }

        .emotion-discouraged {
          --emotion-color: #fb7185;
        }

        @media (max-width: 640px) {
          .emotion-scale {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default JournalEmotionTracker;
