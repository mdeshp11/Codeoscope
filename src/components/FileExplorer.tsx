import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { CodeFile } from '../types';

interface FileExplorerProps {
  files: CodeFile[];
  selectedFile: string | null;
  onFileSelect: (file: CodeFile) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, selectedFile, onFileSelect }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: CodeFile) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.id) ? 
        <FolderOpen className="w-4 h-4 text-blue-500" /> : 
        <Folder className="w-4 h-4 text-blue-500" />;
    }
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const getLanguageColor = (language?: string) => {
    const colors: { [key: string]: string } = {
      javascript: 'bg-yellow-100 text-yellow-800',
      typescript: 'bg-blue-100 text-blue-800',
      python: 'bg-green-100 text-green-800',
      java: 'bg-red-100 text-red-800',
      css: 'bg-purple-100 text-purple-800',
      html: 'bg-orange-100 text-orange-800',
    };
    return colors[language || ''] || 'bg-gray-100 text-gray-800';
  };

  const renderFile = (file: CodeFile, level: number = 0) => {
    const isExpanded = expandedFolders.has(file.id);
    const isSelected = selectedFile === file.id;

    return (
      <div key={file.id}>
        <div
          className={`flex items-center space-x-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => {
            if (file.type === 'folder') {
              toggleFolder(file.id);
            } else {
              onFileSelect(file);
            }
          }}
        >
          {file.type === 'folder' && (
            <button className="p-0.5">
              {isExpanded ? 
                <ChevronDown className="w-3 h-3 text-gray-400" /> : 
                <ChevronRight className="w-3 h-3 text-gray-400" />
              }
            </button>
          )}
          {file.type === 'file' && <div className="w-4" />}
          
          {getFileIcon(file)}
          
          <span className="text-sm font-medium text-gray-700 truncate flex-1">
            {file.name}
          </span>
          
          {file.type === 'file' && file.language && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${getLanguageColor(file.language)}`}>
              {file.language}
            </span>
          )}
        </div>
        
        {file.type === 'folder' && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFile(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border-r border-gray-200 w-80 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">File Explorer</h3>
      </div>
      <div className="p-2 space-y-1">
        {files.map(file => renderFile(file))}
      </div>
    </div>
  );
};

export default FileExplorer;