import React from 'react';
import { ViewMode } from '../types';
import './Toolbar.css';

interface ToolbarProps {
  onExport: () => void;
  onCopy: () => void;
  onFormat: () => void;
  canExport: boolean;
  viewMode?: ViewMode;
  hasSelectedEntries?: boolean;
  onAIEditRequest?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onExport,
  onCopy,
  onFormat,
  canExport,
  viewMode = 'diff',
  hasSelectedEntries = false,
  onAIEditRequest,
}) => {
  const showAIButton = viewMode === 'outline' && hasSelectedEntries && onAIEditRequest;
  const showDiffActions = viewMode === 'diff';

  return (
    <div className="toolbar">
      <div className="toolbar-title">
        <h1>waygoJSON Lorebook Editor</h1>
      </div>
      <div className="toolbar-actions">
        <button onClick={onFormat} className="toolbar-btn">
          Format JSON
        </button>
        {showAIButton && (
          <button onClick={onAIEditRequest} className="toolbar-btn toolbar-btn-ai">
            AI Edit Selected
          </button>
        )}
        {showDiffActions && (
          <>
            <button onClick={onCopy} className="toolbar-btn" disabled={!canExport}>
              Copy Merged
            </button>
            <button onClick={onExport} className="toolbar-btn toolbar-btn-primary" disabled={!canExport}>
              Export Merged
            </button>
          </>
        )}
      </div>
    </div>
  );
};

