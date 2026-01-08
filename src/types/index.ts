export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffSegment {
  type: DiffType;
  value: string;
  lineNumber: number;
  startColumn: number;
  endColumn: number;
}

export interface LineDiff {
  lineNumber: number;
  leftContent: string;
  rightContent: string;
  diffType: DiffType;
  segments: DiffSegment[];
}

export interface MergeDecision {
  segmentId: string;
  side: 'left' | 'right';
  accepted: boolean;
}

export interface MergeState {
  decisions: Map<string, MergeDecision>;
  mergedContent: string;
}

export interface EditorConfig {
  language: string;
  theme: string;
  fontSize: number;
  wordWrap: 'on' | 'off';
  minimap: {
    enabled: boolean;
  };
}

export interface FileContent {
  content: string;
  name: string;
  lastModified?: number;
}

export interface DiffResult {
  lines: LineDiff[];
  totalChanges: number;
  additions: number;
  deletions: number;
  modifications: number;
}

export type ViewMode = 'diff' | 'outline';

export interface LorebookEntry {
  uid: number;
  key: string[];
  keysecondary: string[];
  comment: string;
  content: string;
  constant: boolean;
  vectorized: boolean;
  selective: boolean;
  selectiveLogic: number;
  addMemo: boolean;
  order: number;
  position: number;
  disable: boolean;
  ignoreBudget: boolean;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  matchPersonaDescription: boolean;
  matchCharacterDescription: boolean;
  matchCharacterPersonality: boolean;
  matchCharacterDepthPrompt: boolean;
  matchScenario: boolean;
  matchCreatorNotes: boolean;
  delayUntilRecursion: number | boolean;
  probability: number;
  useProbability: boolean;
  depth: number;
  group: string;
  groupOverride: boolean;
  groupWeight: number;
  scanDepth: number | null;
  caseSensitive: boolean | null;
  matchWholeWords: boolean | null;
  useGroupScoring: boolean | null;
  automationId: string;
  role: string | null;
  sticky: number | null;
  cooldown: number | null;
  delay: number | null;
  triggers: any[];
  depth_role: string | null;
  displayIndex: number;
  characterFilter?: {
    isExclude: boolean;
    names: string[];
    tags: string[];
  };
  roleAtDepth?: string | null;
}

export interface LorebookDocument {
  entries: Record<string, LorebookEntry>;
}

export interface AIEditRequest {
  entryUids: string[];
  prompt: string;
  originalEntries: LorebookEntry[];
}
