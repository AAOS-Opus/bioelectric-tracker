import React, { useEffect, useState, useRef } from 'react';
import { EditorState, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';

interface JournalEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ 
  content, 
  onChange, 
  readOnly = false 
}) => {
  const [editorState, setEditorState] = useState(() => {
    try {
      if (content) {
        // Try to parse as JSON (raw draft-js format)
        const contentObj = JSON.parse(content);
        return EditorState.createWithContent(convertFromRaw(contentObj));
      }
    } catch (error) {
      // If not valid JSON, try as HTML
      if (content) {
        const blocksFromHtml = htmlToDraft(content);
        const { contentBlocks, entityMap } = blocksFromHtml;
        const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
        return EditorState.createWithContent(contentState);
      }
    }
    
    // Default: empty editor
    return EditorState.createEmpty();
  });
  
  const editorRef = useRef<Editor>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition if available
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
          
        // Insert transcript at cursor position
        if (editorRef.current) {
          // This is a simplified approach - in a real implementation, 
          // you'd need to handle cursor position and insertion more carefully
          const currentContent = editorState.getCurrentContent();
          const plainText = currentContent.getPlainText() + ' ' + transcript;
          const newContentState = ContentState.createFromText(plainText);
          const newEditorState = EditorState.push(
            editorState,
            newContentState,
            'insert-characters'
          );
          
          handleEditorChange(newEditorState);
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping speech recognition:', e);
        }
      }
    };
  }, []);

  // Handle editor state changes
  const handleEditorChange = (state: EditorState) => {
    setEditorState(state);
    
    if (!readOnly) {
      const rawContent = convertToRaw(state.getCurrentContent());
      onChange(JSON.stringify(rawContent));
    }
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    
    setIsRecording(!isRecording);
  };

  // Upload handler for images
  const uploadImageCallback = (file: File): Promise<{ data: { link: string } }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({ data: { link: result } });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="journal-editor" data-testid="journal-editor">
      <Editor
        ref={editorRef}
        editorState={editorState}
        wrapperClassName="editor-wrapper"
        editorClassName="editor-content"
        toolbarClassName={readOnly ? "hidden" : "editor-toolbar"}
        onEditorStateChange={handleEditorChange}
        readOnly={readOnly}
        toolbar={{
          options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'image', 'emoji'],
          inline: {
            options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace'],
            bold: { className: 'editor-btn' },
            italic: { className: 'editor-btn' },
            underline: { className: 'editor-btn' },
            strikethrough: { className: 'editor-btn' },
            monospace: { className: 'editor-btn' },
          },
          blockType: {
            className: 'editor-btn',
            dropdownClassName: 'editor-dropdown',
          },
          fontSize: {
            className: 'editor-btn',
            dropdownClassName: 'editor-dropdown',
          },
          list: {
            unordered: { className: 'editor-btn' },
            ordered: { className: 'editor-btn' },
            indent: { className: 'editor-btn' },
            outdent: { className: 'editor-btn' },
          },
          textAlign: {
            left: { className: 'editor-btn' },
            center: { className: 'editor-btn' },
            right: { className: 'editor-btn' },
            justify: { className: 'editor-btn' },
          },
          colorPicker: {
            className: 'editor-btn',
            popupClassName: 'editor-popup',
          },
          link: {
            className: 'editor-btn',
            popupClassName: 'editor-popup',
          },
          image: {
            className: 'editor-btn',
            popupClassName: 'editor-popup',
            urlEnabled: true,
            uploadEnabled: true,
            uploadCallback: uploadImageCallback,
            alignmentEnabled: true,
            defaultSize: {
              height: 'auto',
              width: '100%',
            },
          },
          emoji: {
            className: 'editor-btn',
            popupClassName: 'editor-popup',
          },
        }}
      />
      
      {!readOnly && recognitionRef.current && (
        <button 
          className={`voice-input-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleVoiceInput}
          aria-label={isRecording ? "Stop voice input" : "Start voice input"}
          aria-pressed={isRecording ? 'true' : 'false'}
        >
          <span className="sr-only">{isRecording ? "Stop voice input" : "Start voice input"}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 16c2.206 0 4-1.794 4-4V6c0-2.217-1.785-4.021-3.979-4.021a.933.933 0 0 0-.209.025A4.006 4.006 0 0 0 8 6v6c0 2.206 1.794 4 4 4zm-2-10c0-1.103.897-2 2-2s2 .897 2 2v6c0 1.103-.897 2-2 2s-2-.897-2-2V6z"/>
            <path d="M19 12v-2a1 1 0 0 0-2 0v2c0 2.757-2.243 5-5 5s-5-2.243-5-5v-2a1 1 0 0 0-2 0v2c0 3.52 2.613 6.432 6 6.92V20H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-1.08c3.387-.488 6-3.4 6-6.92z"/>
          </svg>
        </button>
      )}

      <style jsx>{`
        .journal-editor {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 300px;
        }
        
        .editor-wrapper {
          height: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .editor-content {
          height: calc(100% - 40px);
          padding: 1rem;
          overflow-y: auto;
          font-size: 1rem;
          line-height: 1.6;
        }
        
        .editor-toolbar {
          border-bottom: 1px solid #e5e7eb;
          padding: 0.5rem;
        }
        
        .editor-btn {
          background-color: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          color: #4b5563;
          margin: 0 0.25rem;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .editor-btn:hover {
          background-color: #f3f4f6;
        }
        
        .editor-dropdown {
          background-color: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .editor-popup {
          background-color: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          padding: 0.5rem;
        }
        
        .hidden {
          display: none;
        }
        
        .voice-input-btn {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #fff;
          border: 1px solid #e5e7eb;
          color: #4b5563;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          z-index: 10;
          transition: background-color 0.2s;
        }
        
        .voice-input-btn:hover {
          background-color: #f3f4f6;
        }
        
        .voice-input-btn.recording {
          background-color: #ef4444;
          color: #fff;
          border-color: #ef4444;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>
    </div>
  );
};

export default JournalEditor;
