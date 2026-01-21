import React, { useState, useRef, useEffect } from 'react';
import { EditorPanel } from './components/EditorPanel';
import { DiffHighlighter } from './components/DiffHighlighter';
import { MergeControls } from './components/MergeControls';
import { FileLoader } from './components/FileLoader';
import { Toolbar } from './components/Toolbar';
import { TabNavigation } from './components/TabNavigation';
import { LorebookOutline } from './components/LorebookOutline';
import { AIEditModal } from './components/AIEditModal';
import { NarrativeView } from './components/NarrativeView';
import { useDiff } from './hooks/useDiff';
import { useMerge } from './hooks/useMerge';
import { formatJSON, removeEntry, updateEntry, extractEntries } from './utils/json';
import { FileContent, ViewMode, LorebookEntry } from './types';
import * as monaco from 'monaco-editor';
import './styles/App.css';

function App() {
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [leftFile, setLeftFile] = useState<FileContent | null>(null);
  const [rightFile, setRightFile] = useState<FileContent | null>(null);
  const [leftEditorReady, setLeftEditorReady] = useState(false);
  const [rightEditorReady, setRightEditorReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('diff');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalEntries, setAiModalEntries] = useState<LorebookEntry[]>([]);
  // Track the original base content for diff comparison when editing in outline view
  const [originalBaseContent, setOriginalBaseContent] = useState<string>('');
  const [hasOutlineEdits, setHasOutlineEdits] = useState(false);
  // Centralized draft document that serves as the source of truth across all tabs
  const [currentDraft, setCurrentDraft] = useState<string>('');
  const leftEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const rightEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // For diff view, use originalBaseContent on left if we have outline edits, otherwise use leftContent
  const diffLeftContent = (hasOutlineEdits && originalBaseContent) ? originalBaseContent : leftContent;
  const diffResult = useDiff(diffLeftContent, rightContent);
  const { mergedContent, acceptChange, rejectChange, getDecision } = useMerge(
    diffLeftContent,
    rightContent,
    diffResult
  );

  const handleLeftFileLoad = (file: FileContent) => {
    setLeftFile(file);
    setLeftContent(file.content);
    // When loading a new file, reset outline edit tracking and set original base
    setOriginalBaseContent(file.content);
    setHasOutlineEdits(false);
    // Initialize the centralized draft with the loaded file content
    setCurrentDraft(file.content);
    // If right panel is empty or was showing outline edits, reset it to match
    if (!rightContent || hasOutlineEdits) {
      setRightContent(file.content);
      if (rightEditorRef.current) {
        rightEditorRef.current.setValue(file.content);
      }
    }
  };

  const handleRightFileLoad = (file: FileContent) => {
    setRightFile(file);
    setRightContent(file.content);
    // Manual right file load clears outline edit tracking
    setHasOutlineEdits(false);
  };

  const handleLeftChange = (value: string) => {
    setLeftContent(value);
    // Manual editing in left panel clears outline edit tracking
    if (hasOutlineEdits && value !== originalBaseContent) {
      setHasOutlineEdits(false);
    }
  };

  const handleRightChange = (value: string) => {
    setRightContent(value);
    // Manual editing in right panel clears outline edit tracking
    setHasOutlineEdits(false);
  };

  const handleLeftEditorReady = (editor: monaco.editor.IStandaloneCodeEditor) => {
    leftEditorRef.current = editor;
    setLeftEditorReady(true);
  };

  const handleRightEditorReady = (editor: monaco.editor.IStandaloneCodeEditor) => {
    rightEditorRef.current = editor;
    setRightEditorReady(true);
  };

  useEffect(() => {
    if (!leftEditorReady || !rightEditorReady || !leftEditorRef.current || !rightEditorRef.current) return;

    let isScrolling = false;

    const leftDisposable = leftEditorRef.current.onDidScrollChange(() => {
      if (isScrolling) return;
      isScrolling = true;
      const scrollTop = leftEditorRef.current?.getScrollTop() || 0;
      const scrollLeft = leftEditorRef.current?.getScrollLeft() || 0;
      rightEditorRef.current?.setScrollTop(scrollTop);
      rightEditorRef.current?.setScrollLeft(scrollLeft);
      setTimeout(() => {
        isScrolling = false;
      }, 50);
    });

    const rightDisposable = rightEditorRef.current.onDidScrollChange(() => {
      if (isScrolling) return;
      isScrolling = true;
      const scrollTop = rightEditorRef.current?.getScrollTop() || 0;
      const scrollLeft = rightEditorRef.current?.getScrollLeft() || 0;
      leftEditorRef.current?.setScrollTop(scrollTop);
      leftEditorRef.current?.setScrollLeft(scrollLeft);
      setTimeout(() => {
        isScrolling = false;
      }, 50);
    });

    return () => {
      leftDisposable.dispose();
      rightDisposable.dispose();
    };
  }, [leftEditorReady, rightEditorReady]);

  const handleFormat = () => {
    if (leftEditorRef.current) {
      const formatted = formatJSON(leftContent);
      leftEditorRef.current.setValue(formatted);
      setLeftContent(formatted);
    }
    if (rightEditorRef.current) {
      const formatted = formatJSON(rightContent);
      rightEditorRef.current.setValue(formatted);
      setRightContent(formatted);
    }
  };

  const handleExport = () => {
    if (!mergedContent) return;

    const blob = new Blob([mergedContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!mergedContent) return;
    try {
      await navigator.clipboard.writeText(mergedContent);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const handleAccept = (segmentId: string, side: 'left' | 'right') => {
    acceptChange(segmentId, side);
  };

  const handleApplyToLeft = () => {
    if (!mergedContent) return;
    setLeftContent(mergedContent);
    if (leftEditorRef.current) {
      leftEditorRef.current.setValue(mergedContent);
    }
    // Clear outline edit tracking when applying to left
    setHasOutlineEdits(false);
  };

  const handleApplyToRight = () => {
    if (!mergedContent) return;
    setRightContent(mergedContent);
    if (rightEditorRef.current) {
      rightEditorRef.current.setValue(mergedContent);
    }
    // Clear outline edit tracking when applying to right
    setHasOutlineEdits(false);
  };

  const handleCopyDraftToLeft = () => {
    if (!currentDraft) return;
    setLeftContent(currentDraft);
    if (leftEditorRef.current) {
      leftEditorRef.current.setValue(currentDraft);
    }
  };

  const handleCopyDraftToRight = () => {
    if (!currentDraft) return;
    setRightContent(currentDraft);
    if (rightEditorRef.current) {
      rightEditorRef.current.setValue(currentDraft);
    }
  };

  const handleSaveLeftToDraft = () => {
    setCurrentDraft(leftContent);
  };

  const handleSaveRightToDraft = () => {
    setCurrentDraft(rightContent);
  };

  const handleTabChange = (view: ViewMode) => {
    setViewMode(view);
    // Clear selections when switching views
    if (view === 'diff') {
      setSelectedEntries(new Set());
    }
  };

  const handleEntrySelect = (uid: string, selected: boolean) => {
    setSelectedEntries((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(uid);
      } else {
        next.delete(uid);
      }
      return next;
    });
  };

  const handleEntryDelete = (uid: string) => {
    // Initialize base if not set
    if (!originalBaseContent) {
      setOriginalBaseContent(leftContent);
    }
    
    // Ensure leftContent matches original base for proper diff display
    if (originalBaseContent && leftContent !== originalBaseContent) {
      setLeftContent(originalBaseContent);
      if (leftEditorRef.current) {
        leftEditorRef.current.setValue(originalBaseContent);
      }
    }
    
    // Start from rightContent if we have previous edits, otherwise from base
    const sourceContent = hasOutlineEdits ? rightContent : (originalBaseContent || leftContent);
    
    // Apply the deletion
    const updated = removeEntry(sourceContent, uid);
    
    // Update right panel with the edited version
    setRightContent(updated);
    if (rightEditorRef.current) {
      rightEditorRef.current.setValue(updated);
    }
    setHasOutlineEdits(true);
    
    // Remove from selected entries if it was selected
    setSelectedEntries((prev) => {
      const next = new Set(prev);
      next.delete(uid);
      return next;
    });
  };

  const handleEntryEdit = (uid: string) => {
    // For now, we'll just open the AI editor
    // In the future, this could open a manual edit modal
    // Use originalBaseContent if available, otherwise use leftContent (which should be current)
    const sourceContent = originalBaseContent || leftContent;
    const entries = extractEntries(sourceContent);
    if (entries && entries[uid]) {
      setAiModalEntries([entries[uid]]);
      setAiModalOpen(true);
    }
  };

  const handleAIEditRequest = (entryUids: string[]) => {
    // Use originalBaseContent if available, otherwise use leftContent
    const sourceContent = originalBaseContent || leftContent;
    const entries = extractEntries(sourceContent);
    if (entries) {
      const selectedEntriesList = entryUids
        .map((uid) => entries[uid])
        .filter((entry): entry is LorebookEntry => entry !== undefined);
      if (selectedEntriesList.length > 0) {
        setAiModalEntries(selectedEntriesList);
        setAiModalOpen(true);
      }
    }
  };

  const handleAIApply = (updates: Map<string, LorebookEntry>) => {
    // Initialize base if not set
    if (!originalBaseContent) {
      setOriginalBaseContent(leftContent);
    }
    
    // Ensure leftContent matches original base for proper diff display
    if (originalBaseContent && leftContent !== originalBaseContent) {
      setLeftContent(originalBaseContent);
      if (leftEditorRef.current) {
        leftEditorRef.current.setValue(originalBaseContent);
      }
    }
    
    // Start from rightContent if we have previous edits, otherwise from base
    const sourceContent = hasOutlineEdits ? rightContent : (originalBaseContent || leftContent);
    
    // Apply all updates - replace entire entry objects
    let updatedContent = sourceContent;
    updates.forEach((editedEntry, uid) => {
      // Replace the entire entry with the edited version
      updatedContent = updateEntry(updatedContent, uid, editedEntry);
    });
    
    // Update right panel with the edited version
    setRightContent(updatedContent);
    // Editor will update via value prop, but ensure it's synced
    if (rightEditorRef.current) {
      const currentValue = rightEditorRef.current.getValue();
      if (currentValue !== updatedContent) {
        rightEditorRef.current.setValue(updatedContent);
      }
    }
    setHasOutlineEdits(true);
    setAiModalOpen(false);
  };

  const shouldShowOutline = viewMode === 'outline' && currentDraft;

  return (
    <div className="app">
      <Toolbar
        onExport={handleExport}
        onCopy={handleCopy}
        onFormat={handleFormat}
        canExport={!!mergedContent && viewMode === 'diff'}
        viewMode={viewMode}
        hasSelectedEntries={selectedEntries.size > 0}
        onAIEditRequest={() => handleAIEditRequest(Array.from(selectedEntries))}
      />
      <TabNavigation currentView={viewMode} onTabChange={handleTabChange} />
      <div className="app-content">
        {viewMode === 'diff' ? (
          <>
            <div className="editors-container">
              <div className="editor-section">
                <FileLoader onFileLoad={handleLeftFileLoad} label="Left Document" side="left" />
                <EditorPanel
                  value={leftContent}
                  onChange={handleLeftChange}
                  onEditorReady={handleLeftEditorReady}
                  side="left"
                />
                <DiffHighlighter editor={leftEditorRef.current} diffResult={diffResult} side="left" />
              </div>
              <div className="editor-section">
                <FileLoader onFileLoad={handleRightFileLoad} label="Right Document" side="right" />
                <EditorPanel
                  value={rightContent}
                  onChange={handleRightChange}
                  onEditorReady={handleRightEditorReady}
                  side="right"
                />
                <DiffHighlighter
                  editor={rightEditorRef.current}
                  diffResult={diffResult}
                  side="right"
                />
              </div>
            </div>
            <MergeControls
              diffResult={diffResult}
              onAccept={handleAccept}
              getDecision={getDecision}
              onApplyToLeft={handleApplyToLeft}
              onApplyToRight={handleApplyToRight}
              hasMergedContent={!!mergedContent}
              onCopyDraftToLeft={handleCopyDraftToLeft}
              onCopyDraftToRight={handleCopyDraftToRight}
              onSaveLeftToDraft={handleSaveLeftToDraft}
              onSaveRightToDraft={handleSaveRightToDraft}
              hasDraft={!!currentDraft}
            />
          </>
        ) : viewMode === 'narrative' ? (
          <NarrativeView draftContent={currentDraft} />
        ) : (
          <div className="outline-view-container">
            {shouldShowOutline ? (
              <LorebookOutline
                jsonContent={currentDraft}
                selectedEntries={selectedEntries}
                onEntrySelect={handleEntrySelect}
                onEntryDelete={handleEntryDelete}
                onEntryEdit={handleEntryEdit}
                onAIEditRequest={handleAIEditRequest}
              />
            ) : (
              <div className="outline-view-empty">
                <p>Please load a lorebook JSON file to view entries.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <AIEditModal
        entries={aiModalEntries}
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onApply={handleAIApply}
      />
    </div>
  );
}

export default App;

