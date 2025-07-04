import React, { useState, useEffect } from 'react';
import { Copy, Download, Eye, Loader2, AlertCircle, Check } from 'lucide-react';
import { CodeFile } from '../types';
import ScrollableContainer from './ScrollableContainer';

interface CodeViewerProps {
  file: CodeFile | null;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ file }) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch file content when file changes
  useEffect(() => {
    if (!file || file.type === 'folder') {
      setFileContent('');
      setError('');
      return;
    }

    // If file already has content, use it
    if (file.content) {
      setFileContent(file.content);
      setError('');
      return;
    }

    // If it's a GitHub file, fetch the content
    if (file.id.startsWith('github-')) {
      fetchGitHubFileContent(file);
    }
  }, [file]);

  const fetchGitHubFileContent = async (file: CodeFile) => {
    setIsLoading(true);
    setError('');
    
    try {
      if (!file.repoInfo) {
        throw new Error('Repository information is missing');
      }
      
      const { owner, repo, branch } = file.repoInfo;
      
      // Use a CORS proxy for GitHub API requests from the deployed site
      const apiBaseUrl = window.location.hostname === 'localhost' 
        ? 'https://api.github.com' 
        : 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.github.com');
      
      const contentUrl = `${apiBaseUrl}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`;
      console.log('Fetching file content from:', contentUrl);
      
      const response = await fetch(contentUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found in repository');
        } else if (response.status === 403) {
          throw new Error('API rate limit exceeded. Please try again later or use a GitHub token.');
        } else {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      // GitHub API returns base64 encoded content for files
      if (data.content) {
        const decodedContent = atob(data.content.replace(/\n/g, ''));
        setFileContent(decodedContent);
      } else {
        throw new Error('No content available for this file');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch file content';
      setError(errorMessage);
      console.error('Error fetching file content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!fileContent) return;
    
    try {
      await navigator.clipboard.writeText(fileContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fileContent;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const downloadFile = () => {
    if (!file || !fileContent) return;
    
    try {
      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  const highlightSyntax = (code: string, language?: string) => {
    // Enhanced syntax highlighting for multiple languages
    let highlighted = code;
    
    // Escape HTML first
    highlighted = highlighted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    if (language === 'javascript' || language === 'typescript') {
      // Keywords
      const keywords = [
        'class', 'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 
        'return', 'async', 'await', 'import', 'export', 'from', 'default', 'new',
        'this', 'super', 'extends', 'implements', 'interface', 'type', 'enum',
        'public', 'private', 'protected', 'static', 'readonly', 'abstract'
      ];
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        highlighted = highlighted.replace(regex, `<span class="text-purple-600 dark:text-purple-400 font-medium">${keyword}</span>`);
      });
      
      // Strings
      highlighted = highlighted.replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="text-green-600 dark:text-green-400">$1$2$1</span>');
      
      // Comments
      highlighted = highlighted.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="text-gray-500 dark:text-gray-400 italic">$1</span>');
      
      // Numbers
      highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-blue-600 dark:text-blue-400">$1</span>');
      
    } else if (language === 'python') {
      // Python keywords
      const keywords = [
        'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally',
        'import', 'from', 'as', 'return', 'yield', 'lambda', 'with', 'async', 'await',
        'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'pass', 'break', 'continue'
      ];
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        highlighted = highlighted.replace(regex, `<span class="text-purple-600 dark:text-purple-400 font-medium">${keyword}</span>`);
      });
      
      // Strings
      highlighted = highlighted.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="text-green-600 dark:text-green-400">$1$2$1</span>');
      highlighted = highlighted.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, '<span class="text-green-600 dark:text-green-400">$1</span>');
      
      // Comments
      highlighted = highlighted.replace(/(#.*$)/gm, '<span class="text-gray-500 dark:text-gray-400 italic">$1</span>');
      
    } else if (language === 'c' || language === 'cpp') {
      // C/C++ keywords
      const keywords = [
        'int', 'char', 'float', 'double', 'void', 'bool', 'long', 'short', 'unsigned', 'signed',
        'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
        'return', 'struct', 'union', 'enum', 'typedef', 'const', 'static', 'extern', 'inline',
        'class', 'public', 'private', 'protected', 'virtual', 'namespace', 'using', 'template'
      ];
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        highlighted = highlighted.replace(regex, `<span class="text-purple-600 dark:text-purple-400 font-medium">${keyword}</span>`);
      });
      
      // Preprocessor directives
      highlighted = highlighted.replace(/(#\w+.*$)/gm, '<span class="text-orange-600 dark:text-orange-400 font-medium">$1</span>');
      
      // Strings
      highlighted = highlighted.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="text-green-600 dark:text-green-400">$1$2$1</span>');
      
      // Comments
      highlighted = highlighted.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="text-gray-500 dark:text-gray-400 italic">$1</span>');
    }
    
    return highlighted;
  };

  const formatFileSize = (size?: number) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!file || file.type === 'folder') {
    return (
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Select a file to view</h3>
          <p className="text-sm">Choose a file from the explorer to see its contents</p>
        </div>
      </div>
    );
  }

  const lines = fileContent.split('\n');
  const lineCount = lines.length;
  const charCount = fileContent.length;

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 flex flex-col transition-colors duration-300">
      {/* Toolbar Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        {/* File Info Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{file.name}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{file.path}</span>
            {file.language && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium border border-blue-200 dark:border-blue-700">
                {file.language}
              </span>
            )}
          </div>
          
          {/* File Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            {file.size && (
              <span className="flex items-center space-x-1">
                <span>Size:</span>
                <span className="font-mono">{formatFileSize(file.size)}</span>
              </span>
            )}
            {fileContent && (
              <>
                <span className="flex items-center space-x-1">
                  <span>Lines:</span>
                  <span className="font-mono">{lineCount.toLocaleString()}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>Characters:</span>
                  <span className="font-mono">{charCount.toLocaleString()}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Copy Button */}
            <button
              onClick={copyToClipboard}
              disabled={!fileContent || isLoading}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${copySuccess 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700' 
                  : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title="Copy entire file content to clipboard"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy All</span>
                </>
              )}
            </button>

            {/* Download Button */}
            <button
              onClick={downloadFile}
              disabled={!fileContent || isLoading}
              className="
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 
                border border-green-200 dark:border-green-700
                hover:bg-green-200 dark:hover:bg-green-800
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              title="Download file to your computer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>

          {/* Loading/Error Status */}
          {isLoading && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading file content...</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* File Content */}
      <div className="flex-1 flex overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Loading file content...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Unable to load file</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => file && fetchGitHubFileContent(file)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : fileContent ? (
          <>
            {/* Line Numbers */}
            <div className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 py-4 px-3 text-right transition-colors duration-300 min-w-[60px]">
              <div className="scrollable-container" style={{ maxHeight: '100%', overflowY: 'hidden' }}>
                {lines.map((_, index) => (
                  <div
                    key={index}
                    className="text-gray-400 dark:text-gray-500 text-sm font-mono leading-6 h-6 select-none"
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Code Content */}
            <ScrollableContainer className="flex-1">
              <pre className="text-gray-800 dark:text-gray-200 font-mono text-sm leading-6">
                {lines.map((line, index) => (
                  <div
                    key={index}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20 py-0.5 px-2 -mx-2 rounded min-h-[24px] transition-colors group"
                  >
                    <span
                      className="select-text"
                      dangerouslySetInnerHTML={{
                        __html: highlightSyntax(line || ' ', file.language)
                      }}
                    />
                  </div>
                ))}
              </pre>
            </ScrollableContainer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No content available for this file</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeViewer;