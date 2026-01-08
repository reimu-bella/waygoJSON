import React from 'react';
import { DiffResult, LineDiff } from '../types';
import './MergeControls.css';

interface MergeControlsProps {
  diffResult: DiffResult | null;
  onAccept: (segmentId: string, side: 'left' | 'right') => void;
  onReject: (segmentId: string) => void;
  getDecision: (segmentId: string) => { side: 'left' | 'right'; accepted: boolean } | undefined;
}

export const MergeControls: React.FC<MergeControlsProps> = ({
  diffResult,
  onAccept,
  onReject,
  getDecision,
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
                  {lineDiff.diffType === 'modified' ? (
                    <>
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
                    </>
                  ) : lineDiff.diffType === 'added' ? (
                    <button
                      className={`btn-accept ${decision?.side === 'right' ? 'active' : ''}`}
                      onClick={() => onAccept(segmentId, 'right')}
                    >
                      Accept
                    </button>
                  ) : (
                    <button
                      className={`btn-reject ${decision?.accepted === false ? 'active' : ''}`}
                      onClick={() => onReject(segmentId)}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

