import { useMemo } from 'react';
import type { LorebookDocument, LorebookEntry } from '../types';
import { parseLorebook, extractEntries, validateLorebookStructure } from '../utils/json';

interface UseLorebookOptions {
  jsonContent: string;
}

interface UseLorebookReturn {
  lorebook: LorebookDocument | null;
  entries: Record<string, LorebookEntry> | null;
  isValid: boolean;
  entryCount: number;
  getEntry: (uid: string | number) => LorebookEntry | undefined;
}

export function useLorebook({ jsonContent }: UseLorebookOptions): UseLorebookReturn {
  const lorebook = useMemo(() => {
    return parseLorebook(jsonContent);
  }, [jsonContent]);

  const entries = useMemo(() => {
    return extractEntries(jsonContent);
  }, [jsonContent]);

  const isValid = useMemo(() => {
    try {
      const data = JSON.parse(jsonContent);
      return validateLorebookStructure(data);
    } catch {
      return false;
    }
  }, [jsonContent]);

  const entryCount = useMemo(() => {
    return entries ? Object.keys(entries).length : 0;
  }, [entries]);

  const getEntry = (uid: string | number): LorebookEntry | undefined => {
    if (!entries) return undefined;
    const uidString = String(uid);
    return entries[uidString];
  };

  return {
    lorebook,
    entries,
    isValid,
    entryCount,
    getEntry,
  };
}