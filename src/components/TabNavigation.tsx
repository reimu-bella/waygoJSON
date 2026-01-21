import React from 'react';
import { ViewMode } from '../types';
import './TabNavigation.css';

interface TabNavigationProps {
  currentView: ViewMode;
  onTabChange: (view: ViewMode) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ currentView, onTabChange }) => {
  return (
    <div className="tab-navigation">
      <button
        className={`tab-btn ${currentView === 'diff' ? 'active' : ''}`}
        onClick={() => onTabChange('diff')}
      >
        Diff Merge
      </button>
      <button
        className={`tab-btn ${currentView === 'outline' ? 'active' : ''}`}
        onClick={() => onTabChange('outline')}
      >
        Outline View
      </button>
      <button
        className={`tab-btn ${currentView === 'narrative' ? 'active' : ''}`}
        onClick={() => onTabChange('narrative')}
      >
        Narrative
      </button>
    </div>
  );
};