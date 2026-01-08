import { DiffResult, MergeDecision, MergeState, LineDiff } from '../types';

/**
 * Creates initial merge state from diff result
 */
export function createMergeState(diffResult: DiffResult): MergeState {
  return {
    decisions: new Map(),
    mergedContent: '',
  };
}

/**
 * Applies merge decisions to build merged content
 */
export function buildMergedContent(
  leftContent: string,
  rightContent: string,
  diffResult: DiffResult,
  decisions: Map<string, MergeDecision>
): string {
  const mergedLines: string[] = [];
  
  for (const lineDiff of diffResult.lines) {
    const segmentId = `${lineDiff.lineNumber}-${lineDiff.diffType}`;
    const decision = decisions.get(segmentId);
    
    if (lineDiff.diffType === 'unchanged') {
      // Both sides are the same, use either
      mergedLines.push(lineDiff.leftContent);
    } else if (lineDiff.diffType === 'added') {
      // Line exists only in right
      if (!decision || (decision.accepted && decision.side === 'right')) {
        mergedLines.push(lineDiff.rightContent);
      }
      // If rejected, don't add the line
    } else if (lineDiff.diffType === 'removed') {
      // Line exists only in left
      if (!decision || (decision.accepted && decision.side === 'left')) {
        mergedLines.push(lineDiff.leftContent);
      }
      // If rejected, don't add the line
    } else if (lineDiff.diffType === 'modified') {
      // Line differs between left and right
      if (!decision) {
        // No decision made yet, use left by default
        mergedLines.push(lineDiff.leftContent);
      } else if (decision.side === 'left' && decision.accepted) {
        mergedLines.push(lineDiff.leftContent);
      } else if (decision.side === 'right' && decision.accepted) {
        mergedLines.push(lineDiff.rightContent);
      } else {
        // Rejected, use left as fallback
        mergedLines.push(lineDiff.leftContent);
      }
    }
  }
  
  return mergedLines.join('\n');
}

/**
 * Creates a merge decision
 */
export function createMergeDecision(
  segmentId: string,
  side: 'left' | 'right',
  accepted: boolean
): MergeDecision {
  return {
    segmentId,
    side,
    accepted,
  };
}

