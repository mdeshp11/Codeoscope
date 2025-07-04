import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Search, Filter, GitBranch, MoreHorizontal, Eye, Download, Copy } from 'lucide-react';
import { CodeFile } from '../types';
import ScrollableContainer from './ScrollableContainer';

interface TreeViewProps {
  files: CodeFile[];
  selectedFile: string | null;
  onFileSelect: (file: CodeFile) => void;
  className?: string;
}

interface TreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  file?: CodeFile;
  isExpanded?: boolean;
  level: number;
  size?: number;
  language?: string;
}

const TreeView: React.FC<TreeViewProps> = ({ files, selectedFile, onFileSelect, className = '' }) => {
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNodes, setFilteredNodes] = useState<TreeNode[]>([]);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [showOnlyFiles, setShowOnlyFiles] = useState(false);
  const [showTreeDiagram, setShowTreeDiagram] = useState(false);
  const [expandAll, setExpandAll] = useState(false);

  // Build tree structure from hierarchical file list
  const buildTreeStructure = useCallback((files: CodeFile[]): TreeNode[] => {
    const convertToTreeNode = (file: CodeFile, level: number = 0): TreeNode => {
      const node: TreeNode = {
        id: file.id,
        name: file.name,
        path: file.path,
        type: file.type,
        file: file,
        level,
        size: file.size,
        language: file.language
      };

      if (file.children && file.children.length > 0) {
        node.children = file.children.map(child => convertToTreeNode(child, level + 1));
      }

      return node;
    };

    return files.map(file => convertToTreeNode(file));
  }, []);

  // Generate ASCII tree diagram
  const generateTreeDiagram = useCallback((nodes: TreeNode[], prefix: string = '', isLast: boolean = true): string => {
    let result = '';
    
    nodes.forEach((node, index) => {
      const isLastNode = index === nodes.length - 1;
      const connector = isLastNode ? '└── ' : '├── ';
      const extension = node.type === 'file' && node.name.includes('.') ? '' : (node.type === 'folder' ? '/' : '');
      
      result += prefix + connector + node.name + extension;
      
      // Add file size for files
      if (node.type === 'file' && node.size) {
        result += ` (${formatFileSize(node.size)})`;
      }
      
      // Add file count for folders
      if (node.type === 'folder' && node.children) {
        const fileCount = countFilesRecursively(node);
        result += ` (${fileCount} files)`;
      }
      
      result += '\n';
      
      if (node.children && node.children.length > 0) {
        const newPrefix = prefix + (isLastNode ? '    ' : '│   ');
        result += generateTreeDiagram(node.children, newPrefix, isLastNode);
      }
    });
    
    return result;
  }, []);

  // Count files recursively in a folder
  const countFilesRecursively = (node: TreeNode): number => {
    if (node.type === 'file') return 1;
    if (!node.children) return 0;
    
    return node.children.reduce((count, child) => count + countFilesRecursively(child), 0);
  };

  // Filter nodes based on search term and file filter
  const filterNodes = useCallback((nodes: TreeNode[], searchTerm: string, showOnlyFiles: boolean): TreeNode[] => {
    if (!searchTerm && !showOnlyFiles) return nodes;

    const filterRecursively = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce((filtered: TreeNode[], node) => {
        const matchesSearch = !searchTerm || 
          node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (node.language && node.language.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // If showing only files, skip folders entirely
        if (showOnlyFiles && node.type === 'folder') {
          // Only include files from this folder that match the search
          if (node.children) {
            const filteredChildren = filterRecursively(node.children);
            if (filteredChildren.length > 0) {
              // Add filtered children directly to the result, skipping the folder
              filtered.push(...filteredChildren);
            }
          }
          return filtered;
        }
        
        // For files, or when not filtering by file type
        if (matchesSearch) {
          if (node.children) {
            const filteredChildren = filterRecursively(node.children);
            filtered.push({
              ...node,
              children: filteredChildren
            });
          } else {
            filtered.push(node);
          }
        } else if (node.children) {
          // Check if any children match
          const filteredChildren = filterRecursively(node.children);
          if (filteredChildren.length > 0) {
            filtered.push({
              ...node,
              children: filteredChildren
            });
          }
        }
        
        return filtered;
      }, []);
    };

    return filterRecursively(nodes);
  }, []);

  // Update tree when files change
  useEffect(() => {
    const newTreeNodes = buildTreeStructure(files);
    setTreeNodes(newTreeNodes);
    
    // Auto-expand first two levels for better visibility
    const expandedPaths = new Set<string>();
    const expandFirstLevels = (nodes: TreeNode[], level: number = 0) => {
      if (level < 2) {
        nodes.forEach(node => {
          if (node.type === 'folder') {
            expandedPaths.add(node.path);
            if (node.children) {
              expandFirstLevels(node.children, level + 1);
            }
          }
        });
      }
    };
    expandFirstLevels(newTreeNodes);
    setExpandedNodes(expandedPaths);
  }, [files, buildTreeStructure]);

  // Update filtered nodes when search or filter changes
  useEffect(() => {
    const filtered = filterNodes(treeNodes, searchTerm, showOnlyFiles);
    setFilteredNodes(filtered);
    
    // Auto-expand nodes when searching
    if (searchTerm) {
      const expandAll = new Set<string>();
      const collectPaths = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'folder') {
            expandAll.add(node.path);
          }
          if (node.children) {
            collectPaths(node.children);
          }
        });
      };
      collectPaths(filtered);
      setExpandedNodes(expandAll);
    }
  }, [treeNodes, searchTerm, showOnlyFiles, filterNodes]);

  // Handle expand all/collapse all
  useEffect(() => {
    if (expandAll) {
      const allPaths = new Set<string>();
      const collectAllPaths = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'folder') {
            allPaths.add(node.path);
          }
          if (node.children) {
            collectAllPaths(node.children);
          }
        });
      };
      collectAllPaths(filteredNodes);
      setExpandedNodes(allPaths);
    } else {
      setExpandedNodes(new Set());
    }
  }, [expandAll, filteredNodes]);

  const toggleNodeExpansion = (nodePath: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodePath)) {
      newExpanded.delete(nodePath);
    } else {
      newExpanded.add(nodePath);
    }
    setExpandedNodes(newExpanded);
  };

  const handleNodeClick = (node: TreeNode) => {
    if (node.type === 'folder') {
      toggleNodeExpansion(node.path);
    } else if (node.file) {
      onFileSelect(node.file);
      setFocusedNodeId(node.id);
    }
  };

  const handleNodeDoubleClick = (node: TreeNode) => {
    if (node.type === 'folder') {
      // Toggle expansion on double-click for folders
      toggleNodeExpansion(node.path);
    }
  };

  const getFileIcon = (node: TreeNode) => {
    if (node.type === 'folder') {
      const isExpanded = expandedNodes.has(node.path);
      return isExpanded ? 
        <FolderOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" /> : 
        <Folder className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
    }
    
    return <File className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
  };

  const getLanguageColor = (language?: string) => {
    const colors: { [key: string]: string } = {
      javascript: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
      typescript: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
      python: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
      java: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
      css: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',
      html: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
      json: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
      markdown: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700',
      c: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
      cpp: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',
      cmake: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
      shell: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
      yaml: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700',
      xml: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
    };
    return colors[language || ''] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
  };

  const formatFileSize = (size: number): string => {
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
  };

  const renderTreeNode = (node: TreeNode): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.path);
    const isSelected = selectedFile === node.file?.id;
    const isFocused = focusedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const indentLevel = node.level;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-1 px-2 mx-1 rounded-md cursor-pointer transition-all duration-150 group ${
            isSelected 
              ? 'bg-blue-100 text-blue-900 border border-blue-200 shadow-sm dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700' 
              : isFocused
              ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
              : 'hover:bg-gray-50 text-gray-700 dark:hover:bg-gray-700 dark:text-gray-300'
          }`}
          style={{ paddingLeft: `${8 + indentLevel * 16}px` }}
          onClick={() => handleNodeClick(node)}
          onDoubleClick={() => handleNodeDoubleClick(node)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNodeClick(node);
            }
          }}
          tabIndex={0}
          role="treeitem"
          aria-expanded={node.type === 'folder' ? isExpanded : undefined}
          aria-selected={isSelected}
          title={`${node.path}${node.size ? ` (${formatFileSize(node.size)})` : ''}`}
        >
          {/* Expansion toggle for folders */}
          {node.type === 'folder' && (
            <button
              className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 mr-1 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(node.path);
              }}
              aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            >
              {isExpanded ? 
                <ChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400" /> : 
                <ChevronRight className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              }
            </button>
          )}
          
          {/* Spacer for files */}
          {node.type === 'file' && <div className="w-4 mr-1" />}
          
          {/* Icon */}
          <div className="mr-2 flex-shrink-0">
            {getFileIcon(node)}
          </div>
          
          {/* Name */}
          <span className="text-sm font-medium truncate flex-1 min-w-0">
            {node.name}
          </span>
          
          {/* File size for files */}
          {node.type === 'file' && node.size && (
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
              {formatFileSize(node.size)}
            </span>
          )}
          
          {/* Language badge for files */}
          {node.type === 'file' && node.language && (
            <span className={`px-2 py-0.5 text-xs rounded-full border ml-2 flex-shrink-0 ${getLanguageColor(node.language)}`}>
              {node.language}
            </span>
          )}
          
          {/* File count for folders */}
          {node.type === 'folder' && hasChildren && (
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
              {countFilesRecursively(node)}
            </span>
          )}

          {/* Context menu button */}
          <button
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ml-1 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              copyPath(node.path);
            }}
            title="Copy path"
          >
            <Copy className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          </button>
        </div>
        
        {/* Children */}
        {node.type === 'folder' && isExpanded && hasChildren && (
          <div role="group">
            {node.children!.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  const totalFiles = files.reduce((count, file) => {
    const countRecursive = (f: CodeFile): number => {
      if (f.type === 'file') return 1;
      if (f.children) return f.children.reduce((sum, child) => sum + countRecursive(child), 0);
      return 0;
    };
    return count + countRecursive(file);
  }, 0);

  const totalFolders = files.reduce((count, file) => {
    const countRecursive = (f: CodeFile): number => {
      if (f.type === 'folder') {
        const childCount = f.children ? f.children.reduce((sum, child) => sum + countRecursive(child), 0) : 0;
        return 1 + childCount;
      }
      return 0;
    };
    return count + countRecursive(file);
  }, 0);

  const treeDiagram = generateTreeDiagram(filteredNodes);

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-colors duration-300 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Project Explorer</h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {totalFolders > 0 && `${totalFolders} folders, `}{totalFiles} files
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
          />
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowOnlyFiles(!showOnlyFiles)}
              className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-md transition-colors ${
                showOnlyFiles 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>Files only</span>
            </button>
            
            <button
              onClick={() => setExpandAll(!expandAll)}
              className="flex items-center space-x-1 px-2 py-1 text-xs rounded-md transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <MoreHorizontal className="w-3 h-3" />
              <span>{expandAll ? 'Collapse' : 'Expand'} all</span>
            </button>
          </div>
          
          <button
            onClick={() => setShowTreeDiagram(!showTreeDiagram)}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-md transition-colors ${
              showTreeDiagram 
                ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <GitBranch className="w-3 h-3" />
            <span>ASCII</span>
          </button>
        </div>
      </div>

      {/* Tree content */}
      <ScrollableContainer 
        className="flex-1"
        ariaLabel="File explorer"
        tabIndex={0}
      >
        <div role="tree">
          {showTreeDiagram ? (
            <div className="bg-gray-900 dark:bg-gray-950 text-green-400 dark:text-green-300 p-4 rounded-lg font-mono text-xs overflow-x-auto">
              <div className="whitespace-pre-wrap">
                <div className="text-green-300 dark:text-green-200 mb-2 font-bold">Project Structure:</div>
                {treeDiagram}
              </div>
            </div>
          ) : filteredNodes.length > 0 ? (
            <div className="space-y-0.5">
              {filteredNodes.map(node => renderTreeNode(node))}
            </div>
          ) : files.length > 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No files match your search</p>
              <p className="text-xs mt-1">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No files uploaded</p>
              <p className="text-xs mt-1">Upload a folder or files to get started</p>
            </div>
          )}
        </div>
      </ScrollableContainer>
    </div>
  );
};

export default TreeView;