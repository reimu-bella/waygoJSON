import { diffLines, diffWords, Change } from 'diff';
import { DiffResult, LineDiff, DiffSegment, DiffType } from '../types';

/**
 * Computes line-by-line differences between two strings
 */
export function computeLineDiff(left: string, right: string): DiffResult {
  const changes = diffLines(left, right);
  const lines: LineDiff[] = [];
  let leftLineNum = 1;
  let rightLineNum = 1;
  let totalChanges = 0;
  let additions = 0;
  let deletions = 0;
  let modifications = 0;

  for (const change of changes) {
    const changeLines = change.value.split('\n');
    // Remove empty line at end if present
    if (changeLines[changeLines.length - 1] === '') {
      changeLines.pop();
    }

    if (change.added) {
      // Lines added in right
      for (let i = 0; i < changeLines.length; i++) {
        lines.push({
          lineNumber: rightLineNum,
          leftContent: '',
          rightContent: changeLines[i],
          diffType: 'added',
          segments: computeWordSegments('', changeLines[i], rightLineNum),
        });
        rightLineNum++;
        additions++;
        totalChanges++;
      }
    } else if (change.removed) {
      // Lines removed from left
      for (let i = 0; i < changeLines.length; i++) {
        lines.push({
          lineNumber: leftLineNum,
          leftContent: changeLines[i],
          rightContent: '',
          diffType: 'removed',
          segments: computeWordSegments(changeLines[i], '', leftLineNum),
        });
        leftLineNum++;
        deletions++;
        totalChanges++;
      }
    } else {
      // Unchanged lines
      for (let i = 0; i < changeLines.length; i++) {
        if (changeLines[i] !== '') {
          lines.push({
            lineNumber: leftLineNum,
            leftContent: changeLines[i],
            rightContent: changeLines[i],
            diffType: 'unchanged',
            segments: [],
          });
        }
        leftLineNum++;
        rightLineNum++;
      }
    }
  }

  // Check for modifications (lines that exist in both but differ)
  const modifiedLines: LineDiff[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.diffType === 'unchanged' && line.leftContent !== line.rightContent) {
      // This shouldn't happen with our logic, but handle it
      line.diffType = 'modified';
      line.segments = computeWordSegments(line.leftContent, line.rightContent, line.lineNumber);
      modifications++;
    } else if (line.diffType === 'added' || line.diffType === 'removed') {
      // Check if adjacent lines form a modification
      if (i > 0 && lines[i - 1].diffType === 'removed' && line.diffType === 'added') {
        // This is a modification
        const prevLine = lines[i - 1];
        prevLine.diffType = 'modified';
        prevLine.rightContent = line.rightContent;
        prevLine.segments = computeWordSegments(prevLine.leftContent, line.rightContent, prevLine.lineNumber);
        modifications++;
        additions--;
        deletions--;
        modifiedLines.push(i);
      }
    }
  }

  // Remove lines that were merged into modifications
  const filteredLines = lines.filter((_, idx) => !modifiedLines.includes(idx));

  return {
    lines: filteredLines,
    totalChanges,
    additions,
    deletions,
    modifications,
  };
}

/**
 * Computes word-level segments for a line
 */
function computeWordSegments(left: string, right: string, lineNumber: number): DiffSegment[] {
  const segments: DiffSegment[] = [];
  
  if (!left && right) {
    // Entire line is added
    segments.push({
      type: 'added',
      value: right,
      lineNumber,
      startColumn: 1,
      endColumn: right.length + 1,
    });
  } else if (left && !right) {
    // Entire line is removed
    segments.push({
      type: 'removed',
      value: left,
      lineNumber,
      startColumn: 1,
      endColumn: left.length + 1,
    });
  } else if (left !== right) {
    // Compute word-level diff
    const wordChanges = diffWords(left, right);
    let column = 1;
    
    for (const change of wordChanges) {
      if (change.added) {
        segments.push({
          type: 'added',
          value: change.value,
          lineNumber,
          startColumn: column,
          endColumn: column + change.value.length,
        });
        column += change.value.length;
      } else if (change.removed) {
        segments.push({
          type: 'removed',
          value: change.value,
          lineNumber,
          startColumn: column,
          endColumn: column + change.value.length,
        });
        column += change.value.length;
      } else {
        // Unchanged
        column += change.value.length;
      }
    }
  }
  
  return segments;
}

/**
 * Generates a unique ID for a diff segment
 */
export function getSegmentId(lineNumber: number, startColumn: number, type: DiffType): string {
  return `${lineNumber}-${startColumn}-${type}`;
}

