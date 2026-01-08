import React from 'react';
import type { LorebookEntry } from '../types';
import './EntryPreview.css';

interface EntryPreviewProps {
  entry: LorebookEntry;
  title?: string;
}

export const EntryPreview: React.FC<EntryPreviewProps> = ({ entry, title }) => {
  return (
    <div className="entry-preview">
      {title && <h4 className="entry-preview-title">{title}</h4>}
      <div className="entry-preview-content">
        <div className="entry-preview-header">
          <div className="entry-preview-title-row">
            <span className="entry-preview-comment">{entry.comment}</span>
            <span className="entry-preview-uid">UID: {entry.uid}</span>
          </div>
          {entry.key.length > 0 && (
            <div className="entry-preview-keys">
              <strong>Keys:</strong>{' '}
              {entry.key.join(', ')}
            </div>
          )}
        </div>
        
        <div className="entry-preview-body">
          <div className="entry-preview-content-section">
            <strong>Content:</strong>
            <pre className="entry-preview-content-text">{entry.content || '(empty)'}</pre>
          </div>
          
          <div className="entry-preview-meta">
            <span>
              <strong>Selective:</strong> {entry.selective ? 'Yes' : 'No'}
            </span>
            <span>
              <strong>Probability:</strong> {entry.probability}%
            </span>
            <span>
              <strong>Depth:</strong> {entry.depth}
            </span>
            {entry.group && (
              <span>
                <strong>Group:</strong> {entry.group}
              </span>
            )}
            {entry.keysecondary && entry.keysecondary.length > 0 && (
              <span>
                <strong>Secondary Keys:</strong> {entry.keysecondary.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
