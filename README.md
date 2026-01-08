# waygoJSON - Lorebook JSON Editor

A specialized web-based editor for lorebook/world_info JSON documents with diff highlighting, manual merge capabilities, and AI-powered editing. Compare two JSON documents side-by-side, edit individual entries in an outline view, and use AI to enhance your lorebook content.

## Features

### Diff Merge Editor
- **Dual Editor Panels**: Side-by-side layout with synchronized scrolling
- **Diff Highlighting**: Visual indicators for additions (green), deletions (red), and modifications (yellow)
- **Manual Merge**: Click to accept changes from left or right panel
- **JSON Support**: Syntax highlighting and validation
- **File Operations**: Load JSON files via drag-and-drop or file picker
- **Export**: Save merged result as JSON file or copy to clipboard

### Outline View
- **Collapsible Entry Tree**: Navigate lorebook entries with an expandable/collapsible hierarchy
- **Entry Search**: Filter entries by comment, keys, or content
- **Entry Selection**: Multi-select entries using checkboxes for batch operations
- **Entry Management**: Delete individual entries or edit them with AI assistance
- **Entry Display**: View entry metadata including keys, comments, probability, depth, and groups

### AI-Powered Editing
- **AI Edit Entries**: Use Pollinations AI (gemini-fast model) to edit individual or multiple entries
- **Prompt-Based Editing**: Provide natural language instructions to modify entry content
- **Preview Before Apply**: Review AI-generated changes in a side-by-side modal before applying
- **Batch Editing**: Apply AI edits to multiple selected entries at once

### Smart Integration
- **Edit Tracking**: Edits made in outline view automatically appear in the diff merge view for review
- **Original Preservation**: Original content is preserved in the left panel while edits appear in the right panel

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Get your Pollinations AI API key from [https://enter.pollinations.ai](https://enter.pollinations.ai)
   - Add your API key to `.env.local`:
     ```
     VITE_POLLINATIONS_API_KEY=your_api_key_here
     ```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Diff Merge View

1. **Load Files**: Use the file loaders at the top of each panel to load JSON files. You can click to browse or drag and drop files.

2. **View Diffs**: Differences between the two documents are automatically highlighted:
   - Green: Added content
   - Red: Removed content
   - Yellow: Modified content

3. **Merge Changes**: Use the merge controls panel on the right to accept or reject changes:
   - For modified lines: Choose "Accept Left" or "Accept Right"
   - For added lines: Click "Accept" to include them
   - For removed lines: Click "Reject" to keep them

4. **Export Result**: Once you've made your merge decisions, click "Export Merged" to download the result or "Copy Merged" to copy it to your clipboard.

### Outline View

1. **Switch to Outline View**: Click the "Outline View" tab at the top of the application.

2. **Browse Entries**: 
   - Expand/collapse entries by clicking the collapse button (▶/▼)
   - Use the search box to filter entries by comment, keys, or content
   - View entry details including keys, content, and metadata when expanded

3. **Select Entries**: 
   - Use checkboxes to select individual entries
   - Use "Select All" to select all filtered entries
   - Selected entries can be edited together with AI

4. **Delete Entries**: Click the delete button (🗑️) on any entry to remove it (with confirmation prompt)

5. **AI Edit Entries**:
   - Select one or more entries using checkboxes
   - Click "AI Edit Selected" button in the toolbar (or use the ✨ button on individual entries)
   - Enter your editing instructions in the prompt field (e.g., "Make the description more vivid" or "Add more detail about the character")
   - Click "Generate Preview" to see the AI-generated changes
   - Review the changes in the side-by-side preview (original vs. AI-generated)
   - Click "Apply Changes" to apply the edits

6. **Review Edits in Diff View**: After making edits in the outline view, switch to the "Diff Merge" tab to see all changes highlighted:
   - Left panel shows the original content
   - Right panel shows the edited content with all changes
   - Use the merge controls to accept or reject specific changes if needed

## Technology Stack

- **React** with TypeScript
- **Monaco Editor** (VS Code's editor) for code editing
- **diff** library for computing differences
- **Vite** for build tooling
- **Pollinations AI API** for AI-powered text editing (gemini-fast model)

## Project Structure

```
waygoJSON/
├── src/
│   ├── components/      # React components
│   │   ├── AIEditModal.tsx     # AI editing modal with preview
│   │   ├── DiffHighlighter.tsx # Diff highlighting overlay
│   │   ├── EditorPanel.tsx     # Monaco editor wrapper
│   │   ├── FileLoader.tsx      # File upload component
│   │   ├── LorebookOutline.tsx # Outline view with entries
│   │   ├── MergeControls.tsx   # Merge decision controls
│   │   ├── TabNavigation.tsx   # Tab switcher component
│   │   └── Toolbar.tsx         # Main toolbar
│   ├── hooks/           # Custom React hooks
│   │   ├── useDiff.ts          # Diff computation hook
│   │   ├── useEditor.ts        # Monaco editor hook
│   │   ├── useLorebook.ts      # Lorebook parsing hook
│   │   └── useMerge.ts         # Merge state management hook
│   ├── utils/           # Utility functions
│   │   ├── aiService.ts        # Pollinations AI integration
│   │   ├── diff.ts             # Diff algorithms
│   │   ├── json.ts             # JSON utilities and lorebook helpers
│   │   └── merge.ts            # Merge logic
│   ├── types/           # TypeScript type definitions
│   └── styles/          # CSS styles
├── Examples/            # Example lorebook files
├── .env.example         # Environment variable template
├── .env.local           # Local environment variables (gitignored)
├── package.json
└── README.md
```

## License

MIT

