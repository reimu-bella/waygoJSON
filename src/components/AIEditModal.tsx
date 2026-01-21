import React, { useState, useEffect } from 'react';
import type { LorebookEntry } from '../types';
import { editWithAI, editMultipleEntriesWithAI, type BatchEditProgressCallback } from '../utils/aiService';
import { EntryPreview } from './EntryPreview';
import './AIEditModal.css';

interface AIEditModalProps {
  entries: LorebookEntry[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (updates: Map<string, LorebookEntry>) => void;
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
  const [previews, setPreviews] = useState<Map<string, LorebookEntry>>(new Map());
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  
  // Queue state management
  const [processingQueue, setProcessingQueue] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(-1);
  const [processedCount, setProcessedCount] = useState(0);
  const [queueErrors, setQueueErrors] = useState<Map<string, Error>>(new Map());

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setPrompt('');
      setError(null);
      setPreviews(new Map());
      setCurrentEntryIndex(0);
      setProcessingQueue(false);
      setCurrentProcessingIndex(-1);
      setProcessedCount(0);
      setQueueErrors(new Map());
    }
  }, [isOpen]);

  // Progress callback handler for queue-based processing
  const handleProgress: BatchEditProgressCallback = (
    currentIndex,
    total,
    entry,
    result,
    error
  ) => {
    setCurrentProcessingIndex(currentIndex - 1); // Convert to 0-based index
    setProcessedCount(currentIndex);
    
    if (error) {
      // Store error for this entry
      setQueueErrors((prev) => {
        const next = new Map(prev);
        next.set(String(entry.uid), error);
        return next;
      });
      // Use original entry on error
      setPreviews((prev) => {
        const next = new Map(prev);
        next.set(String(entry.uid), entry);
        return next;
      });
    } else if (result) {
      // Store successful result
      setPreviews((prev) => {
        const next = new Map(prev);
        next.set(String(entry.uid), result);
        return next;
      });
      // Clear any previous error for this entry
      setQueueErrors((prev) => {
        const next = new Map(prev);
        next.delete(String(entry.uid));
        return next;
      });
    }
    
    // Auto-switch to the currently processing entry for better UX
    if (currentIndex <= total) {
      setCurrentEntryIndex(currentIndex - 1);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreviews(new Map());
    setQueueErrors(new Map());
    setProcessedCount(0);
    setCurrentProcessingIndex(-1);

    try {
      if (entries.length === 1) {
        // Single entry editing
        setProcessingQueue(false);
        const editedEntry = await editWithAI(entries[0], prompt);
        const newPreviews = new Map<string, LorebookEntry>();
        newPreviews.set(String(entries[0].uid), editedEntry);
        setPreviews(newPreviews);
      } else {
        // Batch editing with queue
        setProcessingQueue(true);
        setCurrentProcessingIndex(0);
        const results = await editMultipleEntriesWithAI(entries, prompt, undefined, handleProgress);
        setPreviews(results);
        setProcessingQueue(false);
        setCurrentProcessingIndex(-1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI edits';
      setError(errorMessage);
      setProcessingQueue(false);
      setCurrentProcessingIndex(-1);
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
  const previewEntry = currentEntry ? previews.get(String(currentEntry.uid)) : null;

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
            <>
              <div className="ai-edit-entry-selector">
                <label>Viewing Entry:</label>
                <select
                  value={currentEntryIndex}
                  onChange={(e) => setCurrentEntryIndex(Number(e.target.value))}
                  disabled={processingQueue}
                >
                  {entries.map((entry, index) => {
                    const entryUid = String(entry.uid);
                    const hasError = queueErrors.has(entryUid);
                    const isProcessing = processingQueue && currentProcessingIndex === index;
                    const isCompleted = previews.has(entryUid);
                    
                    let status = '';
                    if (isProcessing) {
                      status = ' ⟳ Processing...';
                    } else if (hasError) {
                      status = ' ✗ Error';
                    } else if (isCompleted) {
                      status = ' ✓ Done';
                    }
                    
                    return (
                      <option key={entry.uid} value={index}>
                        {entry.comment || `Entry ${entry.uid}`} (UID: {entry.uid}){status}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              {processingQueue && (
                <div className="ai-edit-queue-progress">
                  <div className="ai-edit-progress-bar-container">
                    <div 
                      className="ai-edit-progress-bar"
                      style={{ width: `${(processedCount / entries.length) * 100}%` }}
                    />
                  </div>
                  <div className="ai-edit-progress-text">
                    Processing entry {processedCount} of {entries.length}
                    {currentProcessingIndex >= 0 && currentProcessingIndex < entries.length && (
                      <span className="ai-edit-current-entry">
                        {' '}• Current: {entries[currentProcessingIndex]?.comment || `Entry ${entries[currentProcessingIndex]?.uid}`}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="ai-edit-prompt-section">
            <label htmlFor="ai-prompt">Edit Prompt:</label>
            <textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you want to edit this entry. For example: 'Remove all keys except Isabella', 'Make the description more detailed', or 'Update the comment to be more concise'"
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
                  <EntryPreview entry={currentEntry} />
                </div>
              </div>

              <div className="ai-edit-preview-panel">
                <h3>
                  AI Preview{' '}
                  {(isLoading || (processingQueue && currentProcessingIndex === currentEntryIndex)) && (
                    <span className="loading-spinner">⟳</span>
                  )}
                  {previewEntry && queueErrors.has(String(currentEntry?.uid)) && (
                    <span className="ai-edit-error-badge">Error</span>
                  )}
                  {previewEntry && !queueErrors.has(String(currentEntry?.uid)) && (
                    <span className="ai-edit-success-badge">✓</span>
                  )}
                </h3>
                <div className="ai-edit-content-display">
                  {(isLoading || (processingQueue && currentProcessingIndex === currentEntryIndex)) ? (
                    <div className="ai-edit-loading">
                      <div className="loading-spinner">⟳</div>
                      <p>
                        {processingQueue 
                          ? `Generating edit for entry ${processedCount + 1} of ${entries.length}...`
                          : 'Generating edit...'}
                      </p>
                    </div>
                  ) : previewEntry ? (
                    <>
                      {queueErrors.has(String(currentEntry?.uid)) && (
                        <div className="ai-edit-entry-error">
                          <strong>Error:</strong> {queueErrors.get(String(currentEntry?.uid))?.message}
                          <p>Original entry is shown below.</p>
                        </div>
                      )}
                      <EntryPreview entry={previewEntry} />
                    </>
                  ) : (
                    <div className="ai-edit-placeholder">
                      {processingQueue 
                        ? 'Waiting for this entry to be processed...'
                        : 'Generated entry will appear here after clicking "Generate Preview"'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {entries.length > 1 && (
            <div className="ai-edit-progress-summary">
              {processingQueue ? (
                <div className="ai-edit-progress-info">
                  Processing: {processedCount} of {entries.length} entries completed
                  {queueErrors.size > 0 && (
                    <span className="ai-edit-error-count"> ({queueErrors.size} error{queueErrors.size !== 1 ? 's' : ''})</span>
                  )}
                </div>
              ) : previews.size > 0 ? (
                <div className="ai-edit-progress-info">
                  Generated previews for {previews.size} of {entries.length} entries
                  {queueErrors.size > 0 && (
                    <span className="ai-edit-error-count"> ({queueErrors.size} error{queueErrors.size !== 1 ? 's' : ''})</span>
                  )}
                </div>
              ) : null}
              
              {queueErrors.size > 0 && (
                <div className="ai-edit-queue-errors">
                  <strong>Errors occurred:</strong>
                  <ul>
                    {Array.from(queueErrors.entries()).map(([uid, err]) => {
                      const entry = entries.find(e => String(e.uid) === uid);
                      return (
                        <li key={uid}>
                          <strong>{entry?.comment || `Entry ${uid}`}:</strong> {err.message}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
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