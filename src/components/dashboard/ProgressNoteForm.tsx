"use client";

/**
 * ProgressNoteForm Component
 *
 * Comprehensive daily reflection tool combining narrative journaling
 * with quantified biomarker self-assessment and trend tracking.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useToast } from '@/components/ui/use-toast';
import { postFetcher } from '@/lib/fetcher';

// Standard biomarkers with emojis and descriptions
const STANDARD_BIOMARKERS = [
  { key: 'energy', label: 'Energy', emoji: '⚡', description: 'Overall vitality and alertness' },
  { key: 'sleep', label: 'Sleep Quality', emoji: '😴', description: 'Restfulness and sleep satisfaction' },
  { key: 'digestion', label: 'Digestion', emoji: '🍽️', description: 'Digestive comfort and function' },
  { key: 'mood', label: 'Mood', emoji: '🙂', description: 'Emotional state and outlook' },
];

// Emoji reactions for sentiment
const EMOJI_REACTIONS = ['😊', '😌', '🤔', '😔', '😴', '💪', '🌟', '❤️'];

interface BiomarkerData {
  [key: string]: number;
}

interface CustomBiomarker {
  key: string;
  label: string;
  emoji: string;
}

interface ProgressNoteData {
  narrative: string;
  biomarkers: BiomarkerData;
  timestamp: Date;
}

interface ProgressNoteFormProps {
  className?: string;
  onNoteSaved?: (note: ProgressNoteData) => void;
}

export default function ProgressNoteForm({ className = '', onNoteSaved }: ProgressNoteFormProps) {
  const { data: session } = useSession();
  const { mutate: refreshProgress } = useUserProgress();
  const { toast } = useToast();

  // Content state
  const [narrative, setNarrative] = useState('');
  const [biomarkers, setBiomarkers] = useState<BiomarkerData>({});
  const [customBiomarkers, setCustomBiomarkers] = useState<CustomBiomarker[]>([]);
  const [showCustomBiomarkerForm, setShowCustomBiomarkerForm] = useState(false);
  const [newBiomarkerName, setNewBiomarkerName] = useState('');
  const [newBiomarkerEmoji, setNewBiomarkerEmoji] = useState('📊');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previousBiomarkers, setPreviousBiomarkers] = useState<BiomarkerData>({});
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const userId = session?.user?.id || 'anonymous';
  const draftKey = `progress-note-draft-${userId}`;
  const customBiomarkersKey = `custom-biomarkers-${userId}`;
  const lastValuesKey = `last-biomarker-values-${userId}`;

  // Load saved data on mount
  useEffect(() => {
    try {
      // Load draft
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setNarrative(draft.narrative || '');
        setBiomarkers(draft.biomarkers || {});
        if (editorRef.current && draft.narrative) {
          editorRef.current.innerHTML = draft.narrative;
          updateWordCount(draft.narrative);
        }
      }

      // Load custom biomarkers
      const savedCustom = localStorage.getItem(customBiomarkersKey);
      if (savedCustom) {
        setCustomBiomarkers(JSON.parse(savedCustom));
      }

      // Load previous biomarker values for comparison
      const savedLast = localStorage.getItem(lastValuesKey);
      if (savedLast) {
        setPreviousBiomarkers(JSON.parse(savedLast));
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }, [draftKey, customBiomarkersKey, lastValuesKey]);

  // Auto-save functionality
  const saveToLocalStorage = useCallback(() => {
    try {
      const draft = {
        narrative: editorRef.current?.innerHTML || '',
        biomarkers,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to auto-save:', error);
    }
  }, [biomarkers, draftKey]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current);
    }

    autoSaveRef.current = setInterval(() => {
      if (narrative.trim() || Object.keys(biomarkers).length > 0) {
        saveToLocalStorage();
      }
    }, 30000);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [narrative, biomarkers, saveToLocalStorage]);

  // Save custom biomarkers to localStorage
  useEffect(() => {
    if (customBiomarkers.length > 0) {
      localStorage.setItem(customBiomarkersKey, JSON.stringify(customBiomarkers));
    }
  }, [customBiomarkers, customBiomarkersKey]);

  const updateWordCount = (text: string) => {
    const plainText = text.replace(/<[^>]*>/g, '').trim();
    const words = plainText ? plainText.split(/\s+/).length : 0;
    setWordCount(words);
  };

  const handleEditorInput = () => {
    const content = editorRef.current?.innerHTML || '';
    setNarrative(content);
    updateWordCount(content);
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const insertEmoji = (emoji: string) => {
    document.execCommand('insertText', false, emoji);
    setShowEmojiPanel(false);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const getBiomarkerColor = (value: number) => {
    if (value >= 8) return 'text-green-600 dark:text-green-400';
    if (value >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBiomarkerBgColor = (value: number) => {
    if (value >= 8) return 'bg-green-500';
    if (value >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return '↑';
    if (current < previous) return '↓';
    return '↔';
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600 dark:text-green-400';
    if (current < previous) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const handleBiomarkerChange = (key: string, value: number) => {
    setBiomarkers(prev => ({ ...prev, [key]: value }));
  };

  const addCustomBiomarker = () => {
    if (!newBiomarkerName.trim()) return;

    const key = newBiomarkerName.toLowerCase().replace(/\s+/g, '_');
    const newBiomarker: CustomBiomarker = {
      key,
      label: newBiomarkerName.trim(),
      emoji: newBiomarkerEmoji,
    };

    setCustomBiomarkers(prev => [...prev, newBiomarker]);
    setNewBiomarkerName('');
    setNewBiomarkerEmoji('📊');
    setShowCustomBiomarkerForm(false);

    toast({
      title: "Custom biomarker added!",
      description: `${newBiomarkerEmoji} ${newBiomarker.label} is now available for tracking.`,
      variant: 'success',
      duration: 3000,
    });
  };

  const removeCustomBiomarker = (key: string) => {
    setCustomBiomarkers(prev => prev.filter(b => b.key !== key));
    setBiomarkers(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleSubmit = async () => {
    const plainTextNarrative = editorRef.current?.innerText?.trim() || '';

    if (!plainTextNarrative && Object.keys(biomarkers).length === 0) {
      toast({
        title: "Nothing to save",
        description: "Please add either a narrative or biomarker values.",
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const noteData: ProgressNoteData = {
        narrative: editorRef.current?.innerHTML || '',
        biomarkers,
        timestamp: new Date(),
      };

      // Submit to API
      await postFetcher('/api/progress/notes', {
        userId,
        ...noteData,
      });

      // Success feedback
      toast({
        title: "✅ Your progress has been recorded",
        description: "Your reflection and biomarkers have been saved successfully.",
        variant: 'success',
        duration: 4000,
      });

      // Save current biomarkers as previous values for next session
      localStorage.setItem(lastValuesKey, JSON.stringify(biomarkers));

      // Clear draft from localStorage
      localStorage.removeItem(draftKey);

      // Reset form
      setNarrative('');
      setBiomarkers({});
      setWordCount(0);
      setLastSaved(null);
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }

      // Refresh user progress data
      refreshProgress();

      // Callback for parent component
      onNoteSaved?.(noteData);

    } catch (error) {
      console.error('Failed to save progress note:', error);
      toast({
        title: "Failed to save progress",
        description: "Please try again. Check your connection.",
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allBiomarkers = [...STANDARD_BIOMARKERS, ...customBiomarkers];

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (seconds < 60) return `Saved ${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `Saved ${minutes}m ago`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
          <span className="text-2xl">✒️</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Daily Progress Note
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Reflect on your day and track your biomarkers
          </p>
        </div>
      </div>

      {/* Section 1: Narrative Rich Text Editor */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
            📝 Daily Reflection
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {lastSaved && <span>{formatLastSaved()}</span>}
            <span>{wordCount} words</span>
          </div>
        </div>

        {/* Rich Text Toolbar */}
        <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-t-lg border border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={() => formatText('bold')}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => formatText('italic')}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => formatText('insertUnorderedList')}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Bullet List"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => formatText('insertOrderedList')}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Numbered List"
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => formatText('undo')}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Undo"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={() => formatText('redo')}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Redo"
          >
            ↷
          </button>

          {/* Emoji Panel */}
          <div className="relative ml-2">
            <button
              type="button"
              onClick={() => setShowEmojiPanel(!showEmojiPanel)}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Add Emoji"
            >
              😊
            </button>
            {showEmojiPanel && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                <div className="grid grid-cols-4 gap-1">
                  {EMOJI_REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rich Text Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          className="min-h-32 p-4 border border-t-0 border-gray-200 dark:border-gray-600 rounded-b-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ whiteSpace: 'pre-wrap' }}
          data-placeholder="Today I noticed..."
        />
      </div>

      {/* Section 2: Biomarker Sliders */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
            📊 Biomarker Check-in
          </h4>
          <button
            type="button"
            onClick={() => setShowCustomBiomarkerForm(!showCustomBiomarkerForm)}
            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            ➕ Add Biomarker
          </button>
        </div>

        {/* Custom Biomarker Form */}
        {showCustomBiomarkerForm && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex gap-3">
              <input
                type="text"
                value={newBiomarkerEmoji}
                onChange={(e) => setNewBiomarkerEmoji(e.target.value)}
                className="w-12 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="📊"
              />
              <input
                type="text"
                value={newBiomarkerName}
                onChange={(e) => setNewBiomarkerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomBiomarker()}
                placeholder="Enter biomarker name (e.g., Hydration, Focus)"
                className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addCustomBiomarker}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Biomarker Sliders */}
        <div className="space-y-4">
          {allBiomarkers.map(biomarker => {
            const value = biomarkers[biomarker.key] || 5;
            const previousValue = previousBiomarkers[biomarker.key];
            const hasComparison = previousValue !== undefined;

            return (
              <div key={biomarker.key} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{biomarker.emoji}</span>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {biomarker.label}
                      </h5>
                      {'description' in biomarker && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {biomarker.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${getBiomarkerColor(value)}`}>
                      {value}
                    </span>
                    {hasComparison && (
                      <div
                        className={`text-sm ${getTrendColor(value, previousValue)}`}
                        title={`Last value: ${previousValue} → Today: ${value} (${value - previousValue > 0 ? '+' : ''}${value - previousValue})`}
                      >
                        {getTrendIcon(value, previousValue)}
                        {Math.abs(value - previousValue)}
                      </div>
                    )}
                    {!STANDARD_BIOMARKERS.some(b => b.key === biomarker.key) && (
                      <button
                        type="button"
                        onClick={() => removeCustomBiomarker(biomarker.key)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                        title="Remove custom biomarker"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-8">1</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={value}
                    onChange={(e) => handleBiomarkerChange(biomarker.key, Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer biomarker-slider"
                    style={{
                      background: `linear-gradient(to right, ${getBiomarkerBgColor(value)} 0%, ${getBiomarkerBgColor(value)} ${(value - 1) * 11.11}%, #e5e7eb ${(value - 1) * 11.11}%, #e5e7eb 100%)`
                    }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-8">10</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Saving Entry...
          </span>
        ) : (
          "💾 Save Entry"
        )}
      </button>

      {/* Auto-save Notice */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Your progress is auto-saved every 30 seconds
        </p>
      </div>

      {/* Custom Styles for Range Sliders */}
      <style jsx>{`
        .biomarker-slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #4f46e5;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .biomarker-slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #4f46e5;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}