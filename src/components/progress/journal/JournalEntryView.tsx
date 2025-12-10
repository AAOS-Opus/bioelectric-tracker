import React, { useState, useEffect } from 'react';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { JournalEntry, JournalEntryFormData, Emotion } from '@/types/journal';
import { User } from '@/types/user';
import { useUser } from '@/hooks/useUser';

interface JournalEntryViewProps {
  entry: JournalEntry;
  practitioners: User[];
  availableTags: string[];
  onSave: (data: JournalEntryFormData) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}

const JournalEntryView: React.FC<JournalEntryViewProps> = ({
  entry,
  practitioners,
  availableTags,
  onSave,
  onDelete,
  onClose
}) => {
  const { user } = useUser();
  const [editorState, setEditorState] = useState(() => {
    try {
      const content = JSON.parse(decryptEntry(entry.content));
      return EditorState.createWithContent(convertFromRaw(content));
    } catch {
      return EditorState.createEmpty();
    }
  });

  const [formData, setFormData] = useState<JournalEntryFormData>({
    title: entry.title,
    content: entry.content,
    emotion: entry.emotion,
    tags: entry.tags,
    isDraft: entry.isDraft,
    isShared: entry.isShared,
    sharedWith: entry.sharedWith || []
  });

  const [showShareModal, setShowShareModal] = useState(false);
  const [isEditing, setIsEditing] = useState(entry.isDraft);
  const [validationError, setValidationError] = useState('');

  // Autosave draft every 15 seconds
  useEffect(() => {
    if (!entry.isDraft) return;

    const autosave = setInterval(async () => {
      await handleSave();
    }, 15000);

    return () => clearInterval(autosave);
  }, [formData]);

  const handleEditorChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    const content = JSON.stringify(convertToRaw(newEditorState.getCurrentContent()));
    setFormData(prev => ({
      ...prev,
      content: encryptEntry(content)
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setValidationError('Title and content are required');
      return;
    }

    try {
      await onSave({
        ...formData,
        content: encryptEntry(formData.content) // Double encryption for security
      });
      setIsEditing(false);
      setValidationError('');
    } catch (error) {
      setValidationError('Failed to save entry. Please try again.');
    }
  };

  const handleShareToggle = async (practitionerId: string) => {
    const newSharedWith = formData.sharedWith?.includes(practitionerId)
      ? formData.sharedWith.filter(id => id !== practitionerId)
      : [...(formData.sharedWith || []), practitionerId];

    setFormData(prev => ({
      ...prev,
      sharedWith: newSharedWith
    }));

    // Auto-save when changing sharing
    if (!entry.isDraft) {
      await handleSave();
    }
  };

  // Emotion options
  const emotionOptions: Emotion[] = [
    'joyful', 'optimistic', 'content', 
    'neutral', 'fatigued', 'anxious', 
    'frustrated', 'discouraged'
  ];

  return (
    <div className="journal-entry-view" data-testid="journal-entry-view">
      <div className="entry-header">
        <button className="close-btn" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <h2>{isEditing ? 'Edit Entry' : 'View Entry'}</h2>
        {entry.isDraft && <span className="draft-badge">Draft</span>}
      </div>

      {validationError && (
        <div className="validation-error">{validationError}</div>
      )}

      <div className="entry-content">
        {isEditing ? (
          <>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                value={formData.title}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
              />
            </div>

            <div className="editor-container">
              <Editor
                editorState={editorState}
                onEditorStateChange={handleEditorChange}
                toolbar={{
                  options: ['inline', 'blockType', 'list', 'link', 'image'],
                  image: {
                    uploadEnabled: true,
                    uploadCallback: uploadImageCallback,
                    previewImage: true
                  }
                }}
              />
            </div>

            <div className="emotion-selection">
              <label>Current Emotion:</label>
              <div className="emotion-options">
                {emotionOptions.map(emotion => (
                  <button
                    key={emotion}
                    className={`emotion-btn ${formData.emotion === emotion ? 'selected' : ''} emotion-${emotion.toLowerCase()}`}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      emotion
                    }))}
                    aria-label={`Select ${emotion} emotion`}
                  />
                ))}
              </div>
            </div>

            <div className="tags-section">
              <label>Tags:</label>
              <div className="tags-input">
                {formData.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        tags: prev.tags.filter(t => t !== tag)
                      }))}
                      aria-label={`Remove tag ${tag}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add tag..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newTag = e.currentTarget.value.trim();
                      if (!formData.tags.includes(newTag)) {
                        setFormData(prev => ({
                          ...prev,
                          tags: [...prev.tags, newTag]
                        }));
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                  list="available-tags"
                />
                <datalist id="available-tags">
                  {availableTags.map(tag => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="entry-title">{entry.title}</h3>
            <div 
              className="entry-content-display"
              dangerouslySetInnerHTML={{
                __html: decryptEntry(entry.content)
              }}
            />
            <div className="entry-meta">
              <span className="emotion-display">
                <div 
                  className={`emotion-dot emotion-${entry.emotion.toLowerCase()}`}
                />
                {entry.emotion}
              </span>
              <div className="tags-display">
                {entry.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="entry-actions">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              className="save-btn"
              aria-label="Save entry"
            >
              {entry.isDraft ? 'Save Draft' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  title: entry.title,
                  content: entry.content,
                  emotion: entry.emotion,
                  tags: entry.tags,
                  isDraft: entry.isDraft,
                  isShared: entry.isShared,
                  sharedWith: entry.sharedWith || []
                });
              }}
              className="cancel-btn"
              aria-label="Cancel editing"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="edit-btn"
              aria-label="Edit entry"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="share-btn"
              aria-label="Share entry"
            >
              Share
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="delete-btn"
          aria-label="Delete entry"
        >
          Delete
        </button>
      </div>

      {showShareModal && (
        <div className="share-modal">
          <h3>Share with Practitioners</h3>
          <div className="practitioner-list">
            {practitioners.map(practitioner => (
              <label key={practitioner.id} className="practitioner-item">
                <input
                  type="checkbox"
                  checked={formData.sharedWith?.includes(practitioner.id)}
                  onChange={() => handleShareToggle(practitioner.id)}
                />
                {practitioner.name}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowShareModal(false)}
            className="close-modal-btn"
            aria-label="Close sharing modal"
          >
            Done
          </button>
        </div>
      )}

      <style jsx>{`
        .journal-entry-view {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 800px;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .draft-badge {
          background: #ffd700;
          color: #000;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .editor-container {
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 1rem;
          min-height: 300px;
          margin-bottom: 1rem;
        }

        .emotion-selection {
          margin: 1rem 0;
        }

        .emotion-options {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .emotion-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .emotion-btn.selected {
          border-color: #000;
          transform: scale(1.1);
        }

        .emotion-joyful {
          background-color: #fbbf24;
        }

        .emotion-optimistic {
          background-color: #a3e635;
        }

        .emotion-content {
          background-color: #34d399;
        }

        .emotion-neutral {
          background-color: #60a5fa;
        }

        .emotion-fatigued {
          background-color: #818cf8;
        }

        .emotion-anxious {
          background-color: #a78bfa;
        }

        .emotion-frustrated {
          background-color: #f472b6;
        }

        .emotion-discouraged {
          background-color: #fb7185;
        }

        .tags-section {
          margin: 1rem 0;
        }

        .tags-input {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .tag {
          background: #e5e7eb;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .entry-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
          justify-content: flex-end;
        }

        .share-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1001;
        }

        .emotion-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 0.5rem;
        }

        .emotion-joyful.emotion-dot {
          background-color: #fbbf24;
        }

        .emotion-optimistic.emotion-dot {
          background-color: #a3e635;
        }

        .emotion-content.emotion-dot {
          background-color: #34d399;
        }

        .emotion-neutral.emotion-dot {
          background-color: #60a5fa;
        }

        .emotion-fatigued.emotion-dot {
          background-color: #818cf8;
        }

        .emotion-anxious.emotion-dot {
          background-color: #a78bfa;
        }

        .emotion-frustrated.emotion-dot {
          background-color: #f472b6;
        }

        .emotion-discouraged.emotion-dot {
          background-color: #fb7185;
        }

        @media (max-width: 768px) {
          .journal-entry-view {
            width: 95%;
            padding: 1rem;
          }
          
          .editor-container {
            min-height: 200px;
          }
        }
      `}</style>
    </div>
  );
};

// Example image upload handler
const uploadImageCallback = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    const data = await response.json();
    return { data: { link: data.url } };
  } catch (error) {
    console.error('Image upload failed:', error);
    return { data: { link: null } };
  }
};

// Placeholder for encryption/decryption functions
// These would be implemented in a separate utility file
const encryptEntry = (content: string): string => {
  // This would use a proper encryption algorithm in production
  return content;
};

const decryptEntry = (content: string): string => {
  // This would use a proper decryption algorithm in production
  return content;
};

export default JournalEntryView;
