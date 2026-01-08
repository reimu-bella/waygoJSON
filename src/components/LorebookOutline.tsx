import React, { useState, useMemo } from 'react';
import type { LorebookEntry } from '../types';
import { extractEntries } from '../utils/json';
import './LorebookOutline.css';

interface LorebookOutlineProps {
  jsonContent: string;
  selectedEntries: Set<string>;
  onEntrySelect: (uid: string, selected: boolean) => void;
  onEntryDelete: (uid: string) => void;
  onEntryEdit: (uid: string) => void;
  onAIEditRequest: (entryUids: string[]) => void;
}

export const LorebookOutline: React.FC<LorebookOutlineProps> = ({
  jsonContent,
  selectedEntries,
  onEntrySelect,
  onEntryDelete,
  onEntryEdit,
  onAIEditRequest,
}) => {
  const [collapsedEntries, setCollapsedEntries] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const entries = useMemo(() => {
    return extractEntries(jsonContent) || {};
  }, [jsonContent]);

  const sortedEntries = useMemo(() => {
    const entriesList = Object.entries(entries);
    return entriesList.sort((a, b) => {
      const entryA = a[1];
      const entryB = b[1];
      // Sort by displayIndex if available, otherwise by uid
      if (entryA.displayIndex !== undefined && entryB.displayIndex !== undefined) {
        return entryA.displayIndex - entryB.displayIndex;
      }
      return entryA.uid - entryB.uid;
    });
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedEntries;
    }

    const query = searchQuery.toLowerCase();
    return sortedEntries.filter(([uid, entry]) => {
      const searchableText = `
        ${entry.comment}
        ${entry.key.join(' ')}
        ${entry.content}
      `.toLowerCase();

      return searchableText.includes(query);
    });
  }, [sortedEntries, searchQuery]);

  const toggleCollapse = (uid: string) => {
    setCollapsedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    filteredEntries.forEach(([uid]) => {
      onEntrySelect(uid, checked);
    });
  };

  const hasSelectedEntries = selectedEntries.size > 0;
  const allFilteredSelected = filteredEntries.length > 0 && filteredEntries.every(([uid]) => selectedEntries.has(uid));

  const truncateContent = (content: string, maxLength: number = 150): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (Object.keys(entries).length === 0) {
    return (
      <div className="lorebook-outline-empty">
        <p>No lorebook entries found. Load a valid lorebook JSON file to view entries.</p>
      </div>
    );
  }

  return (
    <div className="lorebook-outline">
      <div className="lorebook-outline-header">
        <div className="lorebook-outline-search">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="lorebook-outline-search-input"
          />
        </div>
        <div className="lorebook-outline-actions">
          <label className="lorebook-outline-select-all">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            Select All
          </label>
          {hasSelectedEntries && (
            <button
              className="lorebook-outline-ai-btn"
              onClick={() => onAIEditRequest(Array.from(selectedEntries))}
            >
              AI Edit Selected ({selectedEntries.size})
            </button>
          )}
        </div>
      </div>

      <div className="lorebook-outline-stats">
        Showing {filteredEntries.length} of {sortedEntries.length} entries
        {hasSelectedEntries && ` • ${selectedEntries.size} selected`}
      </div>

      <div className="lorebook-outline-list">
        {filteredEntries.map(([uid, entry]) => {
          const isCollapsed = collapsedEntries.has(uid);
          const isSelected = selectedEntries.has(uid);

          return (
            <div
              key={uid}
              className={`lorebook-outline-entry ${isSelected ? 'selected' : ''}`}
            >
              <div className="lorebook-outline-entry-header">
                <div className="lorebook-outline-entry-controls">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onEntrySelect(uid, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    className="lorebook-outline-collapse-btn"
                    onClick={() => toggleCollapse(uid)}
                  >
                    {isCollapsed ? '▶' : '▼'}
                  </button>
                </div>
                <div
                  className="lorebook-outline-entry-summary"
                  onClick={() => toggleCollapse(uid)}
                >
                  <div className="lorebook-outline-entry-title">
                    <span className="lorebook-outline-entry-comment">{entry.comment}</span>
                    <span className="lorebook-outline-entry-uid">UID: {entry.uid}</span>
                  </div>
                  {entry.key.length > 0 && (
                    <div className="lorebook-outline-entry-keys">
                      {entry.key.slice(0, 3).map((key, idx) => (
                        <span key={idx} className="lorebook-outline-key-tag">
                          {key}
                        </span>
                      ))}
                      {entry.key.length > 3 && (
                        <span className="lorebook-outline-key-more">
                          +{entry.key.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="lorebook-outline-entry-actions">
                  <button
                    className="lorebook-outline-action-btn"
                    onClick={() => onAIEditRequest([uid])}
                    title="AI Edit"
                  >
                    ✨
                  </button>
                  <button
                    className="lorebook-outline-action-btn"
                    onClick={() => onEntryEdit(uid)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="lorebook-outline-action-btn lorebook-outline-delete-btn"
                    onClick={() => {
                      if (window.confirm(`Delete entry "${entry.comment}" (UID: ${entry.uid})?`)) {
                        onEntryDelete(uid);
                      }
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="lorebook-outline-entry-content">
                  <div className="lorebook-outline-entry-full-keys">
                    <strong>Keys:</strong>{' '}
                    {entry.key.length > 0 ? entry.key.join(', ') : '(none)'}
                  </div>
                  <div className="lorebook-outline-entry-text">
                    <strong>Content:</strong>
                    <pre>{entry.content || '(empty)'}</pre>
                  </div>
                  <div className="lorebook-outline-entry-meta">
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
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredEntries.length === 0 && (
        <div className="lorebook-outline-empty">
          <p>No entries match your search query.</p>
        </div>
      )}
    </div>
  );
};