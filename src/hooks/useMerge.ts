import { useState, useCallback, useMemo } from 'react';
import { MergeDecision, MergeState, DiffResult } from '../types';
import { buildMergedContent, createMergeDecision } from '../utils/merge';

export function useMerge(leftContent: string, rightContent: string, diffResult: DiffResult | null) {
  const [decisions, setDecisions] = useState<Map<string, MergeDecision>>(new Map());

  const acceptChange = useCallback((segmentId: string, side: 'left' | 'right') => {
    setDecisions((prev) => {
      const newDecisions = new Map(prev);
      newDecisions.set(segmentId, createMergeDecision(segmentId, side, true));
      return newDecisions;
    });
  }, []);

  const rejectChange = useCallback((segmentId: string) => {
    setDecisions((prev) => {
      const newDecisions = new Map(prev);
      newDecisions.set(segmentId, createMergeDecision(segmentId, 'left', false));
      return newDecisions;
    });
  }, []);

  const resetDecisions = useCallback(() => {
    setDecisions(new Map());
  }, []);

  const mergedContent = useMemo(() => {
    if (!diffResult) return '';
    return buildMergedContent(leftContent, rightContent, diffResult, decisions);
  }, [leftContent, rightContent, diffResult, decisions]);

  const getDecision = useCallback(
    (segmentId: string): MergeDecision | undefined => {
      return decisions.get(segmentId);
    },
    [decisions]
  );

  return {
    decisions,
    mergedContent,
    acceptChange,
    rejectChange,
    resetDecisions,
    getDecision,
  };
}

