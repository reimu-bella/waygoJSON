import type { LorebookDocument, LorebookEntry } from '../types';
import { parseLorebook, validateLorebookStructure } from './json';

/**
 * Narrative entry type - simplified version with only uid, comment, and content
 */
export interface NarrativeEntry {
  uid: number;
  comment: string;
  content: string;
}

/**
 * Narrative document structure
 */
export interface NarrativeDocument {
  entries: Record<string, NarrativeEntry>;
}

/**
 * Extracts a narrative-only version of the lorebook containing only uid, comment, and content fields
 * Maintains the same {entries: {...}} structure as the original
 */
export function extractNarrative(jsonString: string): string {
  try {
    const data = JSON.parse(jsonString);
    
    if (!validateLorebookStructure(data)) {
      throw new Error('Invalid lorebook structure');
    }
    
    const lorebook = data as LorebookDocument;
    const narrativeEntries: Record<string, NarrativeEntry> = {};
    
    // Extract only uid, comment, and content from each entry
    for (const [uid, entry] of Object.entries(lorebook.entries)) {
      narrativeEntries[uid] = {
        uid: entry.uid,
        comment: entry.comment,
        content: entry.content,
      };
    }
    
    const narrativeDocument: NarrativeDocument = {
      entries: narrativeEntries,
    };
    
    return JSON.stringify(narrativeDocument, null, 2);
  } catch (error) {
    // If parsing fails, return empty narrative structure
    console.error('Failed to extract narrative:', error);
    return JSON.stringify({ entries: {} }, null, 2);
  }
}

/**
 * Converts a narrative document to markdown format
 * Returns a Map with uid as key and markdown string as value
 * Format: # Entry <uid> - <comment>\n\n<content>
 */
export function exportNarrativeAsMarkdown(narrativeJson: string): Map<number, string> {
  const markdownFiles = new Map<number, string>();
  
  try {
    const data = JSON.parse(narrativeJson);
    
    if (!data.entries || typeof data.entries !== 'object') {
      throw new Error('Invalid narrative structure');
    }
    
    const narrativeDoc = data as NarrativeDocument;
    
    // Convert each entry to markdown
    for (const [uidStr, entry] of Object.entries(narrativeDoc.entries)) {
      const uid = entry.uid;
      const comment = entry.comment || '';
      const content = entry.content || '';
      
      // Format: # Entry <uid> - <comment>\n\n<content>
      const markdown = `# Entry ${uid} - ${comment}\n\n${content}`;
      
      markdownFiles.set(uid, markdown);
    }
  } catch (error) {
    console.error('Failed to export narrative as markdown:', error);
    throw new Error('Failed to convert narrative to markdown format');
  }
  
  return markdownFiles;
}
