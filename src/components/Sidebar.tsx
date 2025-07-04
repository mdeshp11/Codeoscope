import React, { useState } from 'react';
import { ChevronDown, ChevronRight, File, Folder, Code, FunctionSquare as Function, Settings } from 'lucide-react';
import { CodeFile } from '../types';

interface SidebarProps {
  files: CodeFile[];
  selectedFile: string | null;
  onFileSelect: (fileId: string) => void;
  onUploadClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ files, selectedFile, onFileSelect, onUploadClick }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['root']));
  const [activeTab, setActiveTab] = useState<'files' | 'architecture'>('files');

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'file': return <File className="w-4 h-4" />;
      case 'class': return <Code className="w-4 h-4" />;
      case 'function': return <Function className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'file': return 'text-blue-400';
      case 'class': return 'text-green-400';
      case 'function': return 'text-yellow-400';
      case 'method': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const renderFileTree = (fileId: string, level: number = 0) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return null;

    const isExpanded = expandedItems.has(fileId);
    const hasChildren = file.children && file.children.length > 0;
    const isSelected = selectedFile === fileId;

    return (
      <div key={fileId} className="select-none">
        <div
          className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-700 rounded-md transition-colors ${
            isSelected ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => {
            onFileSelect(fileId);
            if (hasChildren) toggleExpanded(fileId);
          }}
        >
          {hasChildren && (
            <button
              className="mr-1 p-0.5 hover:bg-gray-600 rounded"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(fileId);
              }}
            >
              {isExpanded ? 
                <ChevronDown className="w-3 h-3" /> : 
                <ChevronRight className="w-3 h-3" />
              }
            </button>
          )}
          {!hasChildren && <div className="w-4 mr-1" />}
          <span className={`mr-2 ${getTypeColor(file.type)}`}>
            {getIcon(file.type)}
          </span>
          <span className="text-sm truncate">{file.name}</span>
          <span className="ml-auto text-xs text-gray-500 uppercase">
            {file.type}
          </span>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {file.children.map(childId => renderFileTree(childId, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootFiles = files.filter(f => !f.parent);

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-white font-semibold text-lg mb-3">Codeoscope</h2>
        <button
          onClick={onUploadClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
        >
          New Project
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'files'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Files
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'architecture'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Architecture
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'files' ? (
          <div className="space-y-1">
            {rootFiles.length > 0 ? (
              rootFiles.map(file => renderFileTree(file.id))
            ) : (
              <div className="text-center text-gray-400 mt-8">
                <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No files loaded</p>
                <p className="text-xs mt-1">Upload code to get started</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-8">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Architecture View</p>
            <p className="text-xs mt-1">Coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;