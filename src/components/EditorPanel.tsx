import React, { useRef, useEffect } from 'react';
import { useEditor } from '../hooks/useEditor';
import './EditorPanel.css';

interface EditorPanelProps {
  value: string;
  onChange?: (value: string) => void;
  onEditorReady?: (editor: any) => void;
  side: 'left' | 'right';
  readOnly?: boolean;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  value,
  onChange,
  onEditorReady,
  side,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { editor, getEditor } = useEditor(containerRef, value, {
    language: 'json',
    theme: 'vs',
    fontSize: 14,
    wordWrap: 'on',
    minimap: { enabled: false },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && readOnly !== undefined) {
      editor.updateOptions({ readOnly });
    }
  }, [editor, readOnly]);

  useEffect(() => {
    if (editor && onChange) {
      const disposable = editor.onDidChangeModelContent(() => {
        onChange(editor.getValue());
      });
      return () => disposable.dispose();
    }
  }, [editor, onChange]);

  return (
    <div className={`editor-panel editor-panel-${side}`}>
      <div ref={containerRef} className="editor-container" />
    </div>
  );
};

