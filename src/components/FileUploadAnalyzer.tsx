import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Lightbulb, Eye, EyeOff, Copy, Download, CheckCircle, AlertCircle } from 'lucide-react';
import CodeSnippetExplainer from './CodeSnippetExplainer';

interface FileUploadAnalyzerProps {
  onFileAnalyzed?: (fileName: string, content: string, language: string) => void;
}

interface AnalyzedFile {
  id: string;
  name: string;
  content: string;
  language: string;
  size: number;
  showAnalysis: boolean;
}

const FileUploadAnalyzer: React.FC<FileUploadAnalyzerProps> = ({ onFileAnalyzed }) => {
  const [analyzedFiles, setAnalyzedFiles] = useState<AnalyzedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', 
    '.php', '.rb', '.go', '.rs', '.html', '.css', '.json', '.md', '.vue', 
    '.svelte', '.scala', '.kt', '.swift', '.dart', '.lua', '.pl', '.r'
  ];

  const getLanguageFromExtension = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
      vue: 'vue',
      svelte: 'svelte',
      scala: 'scala',
      kt: 'kotlin',
      swift: 'swift',
      dart: 'dart',
      lua: 'lua',
      pl: 'perl',
      r: 'r'
    };
    return languageMap[extension || ''] || 'text';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    setIsUploading(true);
    const fileArray = Array.from(files);
    const newAnalyzedFiles: AnalyzedFile[] = [];

    try {
      for (const file of fileArray) {
        // Check if file type is supported
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!supportedExtensions.includes(extension)) {
          console.warn(`Unsupported file type: ${file.name}`);
          continue;
        }

        // Check file size (limit to 1MB for performance)
        if (file.size > 1024 * 1024) {
          console.warn(`File too large: ${file.name}`);
          continue;
        }

        try {
          const content = await readFileContent(file);
          const language = getLanguageFromExtension(file.name);
          
          const analyzedFile: AnalyzedFile = {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            content,
            language,
            size: file.size,
            showAnalysis: true
          };

          newAnalyzedFiles.push(analyzedFile);

          // Notify parent component if callback provided
          if (onFileAnalyzed) {
            onFileAnalyzed(file.name, content, language);
          }
        } catch (error) {
          console.error(`Failed to process file ${file.name}:`, error);
        }
      }

      setAnalyzedFiles(prev => [...prev, ...newAnalyzedFiles]);
    } catch (error) {
      console.error('Failed to process files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input value to allow uploading the same file again
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const toggleAnalysis = (fileId: string) => {
    setAnalyzedFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, showAnalysis: !file.showAnalysis }
          : file
      )
    );
  };

  const removeFile = (fileId: string) => {
    setAnalyzedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const copyFileContent = async (content: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const downloadFile = (file: AnalyzedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const highlightSyntax = (code: string, language: string) => {
    // Basic syntax highlighting - in production, you'd use a proper syntax highlighter
    let highlighted = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (language === 'javascript' || language === 'typescript') {
      // Keywords
      const keywords = [
        'class', 'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 
        'return', 'async', 'await', 'import', 'export', 'from', 'default', 'new',
        'this', 'super', 'extends', 'implements', 'interface', 'type', 'enum'
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
    }

    return highlighted;
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={supportedExtensions.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Upload Code Files for Analysis
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Drop files here or click to browse. Get instant AI-powered explanations.
            </p>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Choose Files</span>
              </>
            )}
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p className="font-medium mb-1">Supported formats:</p>
            <p>JavaScript, TypeScript, Python, Java, C++, HTML, CSS, JSON, and more</p>
            <p className="mt-1">Maximum file size: 1MB per file</p>
          </div>
        </div>
      </div>

      {/* Analyzed Files */}
      {analyzedFiles.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analyzed Files ({analyzedFiles.length})
            </h3>
            <button
              onClick={() => setAnalyzedFiles([])}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear All
            </button>
          </div>

          {analyzedFiles.map((file) => (
            <div key={file.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* File Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{file.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{file.language}</span>
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.content.split('\n').length} lines</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyFileContent(file.content, file.name)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Copy file content"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => downloadFile(file)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleAnalysis(file.id)}
                    className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                      file.showAnalysis 
                        ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Lightbulb className="w-3 h-3" />
                    <span>{file.showAnalysis ? 'Hide' : 'Show'} Analysis</span>
                  </button>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* File Content and Analysis */}
              <div className="flex">
                {/* Code Display */}
                <div className="flex-1 max-h-96 overflow-auto">
                  <div className="flex">
                    {/* Line Numbers */}
                    <div className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 py-4 px-3 text-right min-w-[60px]">
                      {file.content.split('\n').map((_, index) => (
                        <div
                          key={index}
                          className="text-gray-400 dark:text-gray-500 text-sm font-mono leading-6 h-6 select-none"
                        >
                          {index + 1}
                        </div>
                      ))}
                    </div>

                    {/* Code Content */}
                    <div className="flex-1 overflow-auto">
                      <pre className="p-4 text-gray-800 dark:text-gray-200 font-mono text-sm leading-6">
                        {file.content.split('\n').map((line, index) => (
                          <div
                            key={index}
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 py-0.5 px-2 -mx-2 rounded min-h-[24px] transition-colors"
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
                    </div>
                  </div>
                </div>

                {/* Analysis Panel */}
                {file.showAnalysis && (
                  <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto max-h-96">
                    <CodeSnippetExplainer
                      code={file.content}
                      language={file.language}
                      isVisible={file.showAnalysis}
                      onToggle={() => toggleAnalysis(file.id)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadAnalyzer;