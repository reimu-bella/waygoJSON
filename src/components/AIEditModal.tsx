import React, { useState, useEffect } from 'react';
import type { LorebookEntry } from '../types';
import { editWithAI, editMultipleEntriesWithAI } from '../utils/aiService';
import './AIEditModal.css';

interface AIEditModalProps {
  entries: LorebookEntry[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (updates: Map<string, string>) => void;
}

export const AIEditModal: React.FC<AIEditModalProps> = ({
  entries,
  isOpen,
  onClose,
  onApply,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setPrompt('');
      setError(null);
      setPreviews(new Map());
      setCurrentEntryIndex(0);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreviews(new Map());

    try {
      if (entries.length === 1) {
        // Single entry editing
        const editedContent = await editWithAI(entries[0], prompt);
        const newPreviews = new Map<string, string>();
        newPreviews.set(String(entries[0].uid), editedContent);
        setPreviews(newPreviews);
      } else {
        // Batch editing
        const results = await editMultipleEntriesWithAI(entries, prompt);
        setPreviews(results);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI edits';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (previews.size > 0) {
      onApply(previews);
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentEntry = entries[currentEntryIndex];
  const previewContent = currentEntry ? previews.get(String(currentEntry.uid)) : null;

  return (
    <div className="ai-edit-modal-overlay" onClick={onClose}>
      <div className="ai-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-edit-modal-header">
          <h2>AI Edit {entries.length > 1 ? `${entries.length} Entries` : 'Entry'}</h2>
          <button className="ai-edit-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="ai-edit-modal-content">
          {entries.length > 1 && (
            <div className="ai-edit-entry-selector">
              <label>Editing Entry:</label>
              <select
                value={currentEntryIndex}
                onChange={(e) => setCurrentEntryIndex(Number(e.target.value))}
              >
                {entries.map((entry, index) => (
                  <option key={entry.uid} value={index}>
                    {entry.comment || `Entry ${entry.uid}`} (UID: {entry.uid})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="ai-edit-prompt-section">
            <label htmlFor="ai-prompt">Edit Prompt:</label>
            <textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you want to edit this entry. For example: 'Make the description more detailed' or 'Add more vivid imagery'"
              rows={3}
              disabled={isLoading}
            />
            <button
              className="ai-edit-generate-btn"
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? 'Generating...' : 'Generate Preview'}
            </button>
          </div>

          {error && (
            <div className="ai-edit-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {currentEntry && (
            <div className="ai-edit-preview-section">
              <div className="ai-edit-preview-panel">
                <h3>Original</h3>
                <div className="ai-edit-content-display">
                  <div className="ai-edit-entry-meta">
                    <strong>Comment:</strong> {currentEntry.comment}
                  </div>
                  <div className="ai-edit-entry-meta">
                    <strong>Keys:</strong> {currentEntry.key.join(', ')}
                  </div>
                  <div className="ai-edit-content-text">
                    {currentEntry.content}
                  </div>
                </div>
              </div>

              <div className="ai-edit-preview-panel">
                <h3>AI Preview {isLoading && <span className="loading-spinner">⟳</span>}</h3>
                <div className="ai-edit-content-display">
                  {isLoading ? (
                    <div className="ai-edit-loading">
                      <div className="loading-spinner">⟳</div>
                      <p>Generating edit...</p>
                    </div>
                  ) : previewContent ? (
                    <>
                      <div className="ai-edit-entry-meta">
                        <strong>Comment:</strong> {currentEntry.comment}
                      </div>
                      <div className="ai-edit-entry-meta">
                        <strong>Keys:</strong> {currentEntry.key.join(', ')}
                      </div>
                      <div className="ai-edit-content-text">{previewContent}</div>
                    </>
                  ) : (
                    <div className="ai-edit-placeholder">
                      Generated content will appear here after clicking "Generate Preview"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {entries.length > 1 && previews.size > 0 && (
            <div className="ai-edit-progress">
              Generated previews for {previews.size} of {entries.length} entries
            </div>
          )}
        </div>

        <div className="ai-edit-modal-footer">
          <button className="ai-edit-btn ai-edit-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {previews.size > 0 && (
            <button
              className="ai-edit-btn ai-edit-btn-primary"
              onClick={handleApply}
              disabled={isLoading}
            >
              Apply {previews.size > 1 ? `to ${previews.size} Entries` : 'Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};