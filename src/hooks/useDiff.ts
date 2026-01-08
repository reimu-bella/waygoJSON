import { useMemo } from 'react';
import { DiffResult } from '../types';
import { computeLineDiff } from '../utils/diff';

export function useDiff(leftContent: string, rightContent: string): DiffResult | null {
  return useMemo(() => {
    if (!leftContent && !rightContent) return null;
    return computeLineDiff(leftContent, rightContent);
  }, [leftContent, rightContent]);
}

