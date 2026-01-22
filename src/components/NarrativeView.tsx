import React, { useState, useRef, useEffect } from 'react';
import { EditorPanel } from './EditorPanel';
import { extractNarrative, exportNarrativeAsMarkdown } from '../utils/narrative';
import { transformNarrative } from '../utils/aiService';
import { formatJSON } from '../utils/json';
import * as monaco from 'monaco-editor';
import './NarrativeView.css';

interface NarrativeViewProps {
  draftContent: string;
}

export const NarrativeView: React.FC<NarrativeViewProps> = ({ draftContent }) => {
  const [narrativeContent, setNarrativeContent] = useState<string>('');
  const [beforePrompt, setBeforePrompt] = useState<string>(`You are editing a lorebook in JSON format. The entry is part of a world_info/lorebook system and follows a specific structure.

The entry structure includes:
- uid: A unique identifier (number) - MUST be preserved exactly as provided
- key: An array of strings used for matching/triggering this entry
- comment: A short description/name for the entry
- content: The main text content of the entry


Original entry JSON:`);
  const [afterPrompt, setAfterPrompt] = useState<string>(`User Instruction: 

IMPORTANT: 
- Respond with ONLY the edited JSON lorebook in full, including the "entries" wrapper
- Do NOT include any commentary, explanation, or markdown formatting
- Do NOT wrap the JSON in code blocks or quotes
- The response must be valid JSON that can be parsed directly
- Maintain all required fields from the original entry structure
- Only modify fields as instructed by the user`);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  const handleExtractNarrative = () => {
    if (!draftContent) {
      setError('No draft content available. Please load a file first.');
      return;
    }
    
    try {
      const narrative = extractNarrative(draftContent);
      setNarrativeContent(narrative);
      setError(null);
      
      // Update editor if it's ready
      if (editorRef.current) {
        editorRef.current.setValue(narrative);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract narrative';
      setError(errorMessage);
    }
  };

  const handleEditorReady = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    setEditorReady(true);
    
    // Set initial content if narrative is already extracted
    if (narrativeContent) {
      editor.setValue(narrativeContent);
    }
  };

  const handleEditorChange = (value: string) => {
    setNarrativeContent(value);
    setError(null);
  };

  const handleCopy = async () => {
    if (!narrativeContent) {
      setError('No narrative content to copy.');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(narrativeContent);
      // Could add a toast notification here, but for now just clear error
      setError(null);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Failed to copy to clipboard');
    }
  };

  const handleExport = () => {
    if (!narrativeContent) {
      setError('No narrative content to export.');
      return;
    }
    
    try {
      const blob = new Blob([narrativeContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'narrative.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setError(null);
    } catch (err) {
      console.error('Failed to export:', err);
      setError('Failed to export narrative');
    }
  };

  const handleFormat = () => {
    if (!narrativeContent) return;
    
    try {
      const formatted = formatJSON(narrativeContent);
      setNarrativeContent(formatted);
      if (editorRef.current) {
        editorRef.current.setValue(formatted);
      }
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to format JSON';
      setError(errorMessage);
    }
  };

  const handleExportAsMarkdown = async () => {
    if (!narrativeContent) {
      setError('No narrative content to export.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert narrative to markdown files
      const markdownFiles = exportNarrativeAsMarkdown(narrativeContent);
      
      if (markdownFiles.size === 0) {
        setError('No entries found to export.');
        setIsLoading(false);
        return;
      }
      
      // Check if File System Access API is supported
      if ('showDirectoryPicker' in window) {
        try {
          // Use File System Access API
          const directoryHandle = await window.showDirectoryPicker();
          
          // Save each markdown file
          for (const [uid, markdown] of markdownFiles.entries()) {
            const fileName = `${uid}.md`;
            const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(markdown);
            await writable.close();
          }
          
          setError(null);
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            // User cancelled the dialog
            setError(null);
          } else {
            throw err;
          }
        }
      } else {
        // Fallback: Create zip file and download
        // Note: This requires JSZip library to be installed
        // For now, we'll download files individually as a fallback
        let downloadedCount = 0;
        for (const [uid, markdown] of markdownFiles.entries()) {
          const fileName = `${uid}.md`;
          const blob = new Blob([markdown], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          downloadedCount++;
          
          // Small delay to avoid overwhelming the browser
          if (downloadedCount < markdownFiles.size) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export as markdown';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!narrativeContent) {
      setError('Please extract narrative first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const transformed = await transformNarrative(narrativeContent, beforePrompt, afterPrompt);
      setNarrativeContent(transformed);
      
      // Update editor
      if (editorRef.current) {
        editorRef.current.setValue(transformed);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transform narrative';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync editor with narrativeContent when it changes externally
  useEffect(() => {
    if (editorRef.current && narrativeContent) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== narrativeContent) {
        editorRef.current.setValue(narrativeContent);
      }
    }
  }, [narrativeContent]);

  return (
    <div className="narrative-view">
      <div className="narrative-left-panel">
        <div className="narrative-controls">
          <button 
            className="narrative-btn narrative-btn-primary" 
            onClick={handleExtractNarrative}
            disabled={!draftContent}
          >
            Extract Draft Narrative
          </button>
          <button 
            className="narrative-btn" 
            onClick={handleFormat}
            disabled={!narrativeContent}
          >
            Format JSON
          </button>
          <button 
            className="narrative-btn" 
            onClick={handleCopy}
            disabled={!narrativeContent}
          >
            Copy
          </button>
          <button 
            className="narrative-btn" 
            onClick={handleExport}
            disabled={!narrativeContent}
          >
            Export
          </button>
          <button 
            className="narrative-btn" 
            onClick={handleExportAsMarkdown}
            disabled={!narrativeContent || isLoading}
          >
            Export as Markdown
          </button>
        </div>
        {error && (
          <div className="narrative-error">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div className="narrative-editor-container">
          <EditorPanel
            value={narrativeContent}
            onChange={handleEditorChange}
            onEditorReady={handleEditorReady}
            side="left"
          />
        </div>
      </div>
      
      <div className="narrative-right-panel">
        <div className="narrative-prompts">
          <div className="narrative-prompt-section">
            <label htmlFor="before-prompt">Before Prompt:</label>
            <textarea
              id="before-prompt"
              className="narrative-textarea"
              value={beforePrompt}
              onChange={(e) => setBeforePrompt(e.target.value)}
              placeholder="Enter instructions that should come before the narrative document..."
              rows={8}
              disabled={isLoading}
            />
          </div>
          
          <div className="narrative-prompt-section">
            <label htmlFor="after-prompt">After Prompt:</label>
            <textarea
              id="after-prompt"
              className="narrative-textarea"
              value={afterPrompt}
              onChange={(e) => setAfterPrompt(e.target.value)}
              placeholder="Enter instructions that should come after the narrative document..."
              rows={8}
              disabled={isLoading}
            />
          </div>
          
          <button
            className="narrative-btn narrative-btn-send"
            onClick={handleSendRequest}
            disabled={isLoading || !narrativeContent}
          >
            {isLoading ? 'Sending Request...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
};
