/**
 * Validates JSON string and returns parsed object or error
 */
export function validateJSON(jsonString: string): { valid: boolean; error?: string; data?: any } {
  try {
    const data = JSON.parse(jsonString);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Unknown error parsing JSON' };
  }
}

/**
 * Formats JSON string with indentation
 */
export function formatJSON(jsonString: string, indent: number = 2): string {
  try {
    const data = JSON.parse(jsonString);
    return JSON.stringify(data, null, indent);
  } catch {
    return jsonString;
  }
}

/**
 * Minifies JSON string
 */
export function minifyJSON(jsonString: string): string {
  try {
    const data = JSON.parse(jsonString);
    return JSON.stringify(data);
  } catch {
    return jsonString;
  }
}

import type { LorebookDocument, LorebookEntry } from '../types';

/**
 * Validates if data matches lorebook structure
 */
export function validateLorebookStructure(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    data.entries &&
    typeof data.entries === 'object'
  );
}

/**
 * Parses JSON string and validates as lorebook document
 */
export function parseLorebook(jsonString: string): LorebookDocument | null {
  try {
    const data = JSON.parse(jsonString);
    if (validateLorebookStructure(data)) {
      return data as LorebookDocument;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extracts entries from JSON string
 */
export function extractEntries(jsonString: string): Record<string, LorebookEntry> | null {
  const lorebook = parseLorebook(jsonString);
  return lorebook?.entries || null;
}

/**
 * Removes an entry from lorebook JSON by UID
 */
export function removeEntry(jsonString: string, entryUid: string | number): string {
  try {
    const data = JSON.parse(jsonString);
    if (validateLorebookStructure(data)) {
      const uidString = String(entryUid);
      if (data.entries[uidString]) {
        delete data.entries[uidString];
        return JSON.stringify(data, null, 2);
      }
    }
    return jsonString;
  } catch {
    return jsonString;
  }
}

/**
 * Updates an entry in lorebook JSON by UID
 */
export function updateEntry(
  jsonString: string,
  entryUid: string | number,
  updates: Partial<LorebookEntry>
): string {
  try {
    const data = JSON.parse(jsonString);
    if (validateLorebookStructure(data)) {
      const uidString = String(entryUid);
      if (data.entries[uidString]) {
        data.entries[uidString] = {
          ...data.entries[uidString],
          ...updates,
        };
        return JSON.stringify(data, null, 2);
      }
    }
    return jsonString;
  } catch {
    return jsonString;
  }
}
