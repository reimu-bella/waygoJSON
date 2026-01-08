import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { EditorConfig } from '../types';

export function useEditor(
  containerRef: React.RefObject<HTMLDivElement>,
  initialValue: string = '',
  config?: Partial<EditorConfig>
) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    // Initialize Monaco Editor
    const editor = monaco.editor.create(containerRef.current, {
      value: initialValue,
      language: config?.language || 'json',
      theme: config?.theme || 'vs',
      fontSize: config?.fontSize || 14,
      wordWrap: config?.wordWrap || 'on',
      minimap: {
        enabled: config?.minimap?.enabled ?? false,
      },
      automaticLayout: true,
      scrollBeyondLastLine: false,
    });

    editorRef.current = editor;

    // Update value when editor content changes
    const disposable = editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue();
      setValue(newValue);
    });

    return () => {
      disposable.dispose();
      editor.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== initialValue) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== initialValue) {
        editorRef.current.setValue(initialValue);
        setValue(initialValue);
      }
    }
  }, [initialValue]);

  const getEditor = () => editorRef.current;

  return {
    editor: editorRef.current,
    value,
    getEditor,
  };
}

