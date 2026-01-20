import React from 'react';
import { DiffResult, LineDiff } from '../types';
import './MergeControls.css';

interface MergeControlsProps {
  diffResult: DiffResult | null;
  onAccept: (segmentId: string, side: 'left' | 'right') => void;
  getDecision: (segmentId: string) => { side: 'left' | 'right'; accepted: boolean } | undefined;
  onApplyToLeft?: () => void;
  onApplyToRight?: () => void;
  hasMergedContent?: boolean;
  onCopyDraftToLeft?: () => void;
  onCopyDraftToRight?: () => void;
  onSaveLeftToDraft?: () => void;
  onSaveRightToDraft?: () => void;
  hasDraft?: boolean;
}

export const MergeControls: React.FC<MergeControlsProps> = ({
  diffResult,
  onAccept,
  getDecision,
  onApplyToLeft,
  onApplyToRight,
  hasMergedContent = false,
  onCopyDraftToLeft,
  onCopyDraftToRight,
  onSaveLeftToDraft,
  onSaveRightToDraft,
  hasDraft = false,
}) => {
  if (!diffResult || diffResult.lines.length === 0) {
    return null;
  }

  const getSegmentId = (lineDiff: LineDiff): string => {
    return `${lineDiff.lineNumber}-${lineDiff.diffType}`;
  };

  return (
    <div className="merge-controls">
      <div className="merge-controls-header">
        <h3>Merge Changes</h3>
        <div className="merge-stats">
          <span className="stat-added">+{diffResult.additions}</span>
          <span className="stat-removed">-{diffResult.deletions}</span>
          {diffResult.modifications > 0 && (
            <span className="stat-modified">~{diffResult.modifications}</span>
          )}
        </div>
      </div>
      {(onApplyToLeft || onApplyToRight) && (
        <div className="merge-controls-apply-buttons">
          {onApplyToLeft && (
            <button
              className="btn-apply btn-apply-left"
              onClick={onApplyToLeft}
              disabled={!hasMergedContent}
              title="Apply accepted changes to the left document"
            >
              Apply to Left
            </button>
          )}
          {onApplyToRight && (
            <button
              className="btn-apply btn-apply-right"
              onClick={onApplyToRight}
              disabled={!hasMergedContent}
              title="Apply accepted changes to the right document"
            >
              Apply to Right
            </button>
          )}
        </div>
      )}
      {(onCopyDraftToLeft || onCopyDraftToRight || onSaveLeftToDraft || onSaveRightToDraft) && (
        <div className="merge-controls-draft-buttons">
          <div className="draft-buttons-section">
            <span className="draft-section-label">Copy Draft To:</span>
            <div className="draft-buttons-group">
              {onCopyDraftToLeft && (
                <button
                  className="btn-draft btn-draft-copy-left"
                  onClick={onCopyDraftToLeft}
                  disabled={!hasDraft}
                  title="Copy current draft to the left document"
                >
                  Copy to Left
                </button>
              )}
              {onCopyDraftToRight && (
                <button
                  className="btn-draft btn-draft-copy-right"
                  onClick={onCopyDraftToRight}
                  disabled={!hasDraft}
                  title="Copy current draft to the right document"
                >
                  Copy to Right
                </button>
              )}
            </div>
          </div>
          <div className="draft-buttons-section">
            <span className="draft-section-label">Save To Draft:</span>
            <div className="draft-buttons-group">
              {onSaveLeftToDraft && (
                <button
                  className="btn-draft btn-draft-save-left"
                  onClick={onSaveLeftToDraft}
                  title="Save left document to draft"
                >
                  Save Left
                </button>
              )}
              {onSaveRightToDraft && (
                <button
                  className="btn-draft btn-draft-save-right"
                  onClick={onSaveRightToDraft}
                  title="Save right document to draft"
                >
                  Save Right
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="merge-controls-list">
        {diffResult.lines
          .filter((line) => line.diffType !== 'unchanged')
          .map((lineDiff, index) => {
            const segmentId = getSegmentId(lineDiff);
            const decision = getDecision(segmentId);

            return (
              <div key={`${segmentId}-${index}`} className="merge-control-item">
                <div className="merge-control-info">
                  <span className="line-number">Line {lineDiff.lineNumber}</span>
                  <span className={`diff-type diff-type-${lineDiff.diffType}`}>
                    {lineDiff.diffType}
                  </span>
                </div>
                <div className="merge-control-content">
                  {lineDiff.diffType === 'added' && (
                    <div className="content-preview">
                      <span className="content-label">Added:</span>
                      <code>{lineDiff.rightContent.substring(0, 60)}</code>
                    </div>
                  )}
                  {lineDiff.diffType === 'removed' && (
                    <div className="content-preview">
                      <span className="content-label">Removed:</span>
                      <code>{lineDiff.leftContent.substring(0, 60)}</code>
                    </div>
                  )}
                  {lineDiff.diffType === 'modified' && (
                    <div className="content-preview">
                      <div>
                        <span className="content-label">Left:</span>
                        <code>{lineDiff.leftContent.substring(0, 40)}</code>
                      </div>
                      <div>
                        <span className="content-label">Right:</span>
                        <code>{lineDiff.rightContent.substring(0, 40)}</code>
                      </div>
                    </div>
                  )}
                </div>
                <div className="merge-control-actions">
                  <button
                    className={`btn-accept ${decision?.side === 'left' ? 'active' : ''}`}
                    onClick={() => onAccept(segmentId, 'left')}
                  >
                    Accept Left
                  </button>
                  <button
                    className={`btn-accept ${decision?.side === 'right' ? 'active' : ''}`}
                    onClick={() => onAccept(segmentId, 'right')}
                  >
                    Accept Right
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

