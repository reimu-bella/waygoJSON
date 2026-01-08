import React, { useRef, useState } from 'react';
import { validateJSON } from '../utils/json';
import { FileContent } from '../types';
import './FileLoader.css';

interface FileLoaderProps {
  onFileLoad: (file: FileContent) => void;
  label: string;
  side: 'left' | 'right';
}

export const FileLoader: React.FC<FileLoaderProps> = ({ onFileLoad, label, side }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    
    if (!file.name.endsWith('.json') && !file.type.includes('json')) {
      setError('Please select a JSON file');
      return;
    }

    try {
      const text = await file.text();
      const validation = validateJSON(text);
      
      if (!validation.valid) {
        setError(`Invalid JSON: ${validation.error}`);
        return;
      }

      onFileLoad({
        content: text,
        name: file.name,
        lastModified: file.lastModified,
      });
    } catch (err) {
      setError('Failed to read file');
      console.error(err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-loader">
      <label className="file-loader-label">{label}</label>
      <div
        className={`file-loader-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <div className="file-loader-content">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Click or drag JSON file here</span>
        </div>
      </div>
      {error && <div className="file-loader-error">{error}</div>}
    </div>
  );
};

