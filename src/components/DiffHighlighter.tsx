import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { DiffResult, LineDiff } from '../types';

interface DiffHighlighterProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  diffResult: DiffResult | null;
  side: 'left' | 'right';
}

export const DiffHighlighter: React.FC<DiffHighlighterProps> = ({ editor, diffResult, side }) => {
  const decorationsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!editor || !diffResult) {
      return;
    }

    const decorations: monaco.editor.IModelDeltaDecoration[] = [];

    for (const lineDiff of diffResult.lines) {
      const lineNumber = lineDiff.lineNumber;
      const content = side === 'left' ? lineDiff.leftContent : lineDiff.rightContent;

      if (!content && lineDiff.diffType !== 'removed') continue;
      if (lineDiff.diffType === 'unchanged') continue;

      let className = '';
      let glyphMarginClassName = '';
      let inlineClassName = '';

      if (lineDiff.diffType === 'added' && side === 'right') {
        className = 'diff-added-line';
        glyphMarginClassName = 'diff-added-glyph';
        inlineClassName = 'diff-added-inline';
      } else if (lineDiff.diffType === 'removed' && side === 'left') {
        className = 'diff-removed-line';
        glyphMarginClassName = 'diff-removed-glyph';
        inlineClassName = 'diff-removed-inline';
      } else if (lineDiff.diffType === 'modified') {
        className = side === 'left' ? 'diff-removed-line' : 'diff-added-line';
        glyphMarginClassName = side === 'left' ? 'diff-removed-glyph' : 'diff-added-glyph';
        inlineClassName = side === 'left' ? 'diff-removed-inline' : 'diff-added-inline';
      }

      if (className) {
        decorations.push({
          range: new monaco.Range(lineNumber, 1, lineNumber, content.length + 1),
          options: {
            className,
            glyphMarginClassName,
            inlineClassName,
            isWholeLine: true,
            minimap: {
              color: side === 'left' ? '#ffcccc' : '#ccffcc',
              position: monaco.editor.MinimapPosition.Inline,
            },
          },
        });

        // Add decorations for segments if available
        if (lineDiff.segments && lineDiff.segments.length > 0) {
          for (const segment of lineDiff.segments) {
            if (segment.lineNumber === lineNumber) {
              decorations.push({
                range: new monaco.Range(
                  lineNumber,
                  segment.startColumn,
                  lineNumber,
                  segment.endColumn
                ),
                options: {
                  inlineClassName:
                    segment.type === 'added'
                      ? 'diff-added-inline'
                      : segment.type === 'removed'
                      ? 'diff-removed-inline'
                      : 'diff-modified-inline',
                },
              });
            }
          }
        }
      }
    }

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);

    return () => {
      if (editor) {
        editor.deltaDecorations(decorationsRef.current, []);
        decorationsRef.current = [];
      }
    };
  }, [editor, diffResult, side]);

  return null;
};

