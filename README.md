# JSON Diff Merge Editor

A lightweight web-based 2-panel plaintext editor focused on JSON with diff highlighting and manual merge capabilities. Compare two JSON documents side-by-side, see highlighted differences, and manually accept or reject changes to create a merged result.

## Features

- **Dual Editor Panels**: Side-by-side layout with synchronized scrolling
- **Diff Highlighting**: Visual indicators for additions (green), deletions (red), and modifications (yellow)
- **Manual Merge**: Click to accept changes from left or right panel
- **JSON Support**: Syntax highlighting and validation
- **File Operations**: Load JSON files via drag-and-drop or file picker
- **Export**: Save merged result as JSON file or copy to clipboard

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

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

## Technology Stack

- **React** with TypeScript
- **Monaco Editor** (VS Code's editor)
- **diff** library for computing differences
- **Vite** for build tooling

## Project Structure

```
waygoJSON/
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── styles/          # CSS styles
├── package.json
└── README.md
```

## License

MIT

