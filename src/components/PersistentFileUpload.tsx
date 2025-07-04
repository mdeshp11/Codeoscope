import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Trash2, Eye, Download, Copy, Lightbulb, Clock, HardDrive } from 'lucide-react';
import { FileSessionManager, StoredFile, FileUploadState } from '../services/FileSessionManager';
import { ButtonVisibilityManager } from '../services/ButtonVisibilityManager';
import CodeSnippetExplainer from './CodeSnippetExplainer';

interface PersistentFileUploadProps {
  onAnalyzeFiles?: (files: StoredFile[]) => void;
}

const PersistentFileUpload: React.FC<PersistentFileUploadProps> = ({ onAnalyzeFiles }) => {
  const [uploadState, setUploadState] = useState<FileUploadState>({ files: [], isAnalyzing: false });
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedFileForAnalysis, setSelectedFileForAnalysis] = useState<StoredFile | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileManager = FileSessionManager.getInstance();
  const buttonManager = ButtonVisibilityManager.getInstance();

  // Subscribe to file manager state changes
  useEffect(() => {
    const unsubscribe = fileManager.subscribe(setUploadState);
    
    // Initialize with current state
    setUploadState({
      files: fileManager.getFiles(),
      isAnalyzing: false,
      lastUploadTime: fileManager.getFilesSummary().newestUpload
    });

    return unsubscribe;
  }, []);

  // Auto-clear feedback after 3 seconds
  useEffect(() => {
    if (uploadFeedback) {
      const timer = setTimeout(() => setUploadFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadFeedback]);

  // Listen for analysis completion events
  useEffect(() => {
    const handleAnalysisComplete = () => {
      setAnalysisComplete(true);
    };

    document.addEventListener('codeAnalysisComplete', handleAnalysisComplete);
    document.addEventListener('analysisReviewComplete', handleAnalysisComplete);

    return () => {
      document.removeEventListener('codeAnalysisComplete', handleAnalysisComplete);
      document.removeEventListener('analysisReviewComplete', handleAnalysisComplete);
    };
  }, []);

  const handleFileUpload = async (files: FileList | File[]) => {
    setIsUploading(true);
    setUploadFeedback(null);

    try {
      const fileArray = Array.from(files);
      const storedFiles = await fileManager.addFiles(fileArray);
      
      if (storedFiles.length > 0) {
        setUploadFeedback({
          type: 'success',
          message: `Successfully uploaded ${storedFiles.length} file${storedFiles.length > 1 ? 's' : ''}`
        });
      } else {
        setUploadFeedback({
          type: 'error',
          message: 'No valid files were uploaded. Check file types and sizes.'
        });
      }
    } catch (error) {
      setUploadFeedback({
        type: 'error',
        message: 'Failed to upload files. Please try again.'
      });
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
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

  const handleAnalyzeFiles = () => {
    if (uploadState.files.length > 0) {
      if (onAnalyzeFiles) {
        onAnalyzeFiles(uploadState.files);
      }
      
      // Mark all files as analyzed
      uploadState.files.forEach(file => {
        fileManager.markFileAnalyzed(file.id);
      });

      // Trigger analysis complete
      setTimeout(() => {
        buttonManager.triggerAnalysisComplete();
        setAnalysisComplete(true);
      }, 1000);
    }
  };

  const handleAnalyzeIndividualFile = (file: StoredFile) => {
    setSelectedFileForAnalysis(file);
    setShowAnalysisModal(true);
    fileManager.markFileAnalyzed(file.id);
  };

  const handleClearFiles = () => {
    fileManager.clearFiles();
    setAnalysisComplete(false);
    buttonManager.resetState();
    setUploadFeedback({
      type: 'success',
      message: 'All files cleared from session'
    });
  };

  const handleRemoveFile = (fileId: string) => {
    const removed = fileManager.removeFile(fileId);
    if (removed) {
      setUploadFeedback({
        type: 'success',
        message: 'File removed from session'
      });
    }
  };

  const copyFileContent = async (file: StoredFile) => {
    try {
      await navigator.clipboard.writeText(file.content);
      setUploadFeedback({
        type: 'success',
        message: `Copied ${file.name} to clipboard`
      });
    } catch (err) {
      setUploadFeedback({
        type: 'error',
        message: 'Failed to copy file content'
      });
    }
  };

  const downloadFile = (file: StoredFile) => {
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const summary = fileManager.getFilesSummary();
  const hasFiles = uploadState.files.length > 0;

  return (
    <div className="space-y-6">
      {/* Upload Feedback */}
      {uploadFeedback && (
        <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
          uploadFeedback.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
        }`}>
          {uploadFeedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{uploadFeedback.message}</span>
        </div>
      )}

      {/* Analysis Complete Banner */}
      {analysisComplete && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="font-medium text-green-900 dark:text-green-100">
                Analysis Complete!
              </h3>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Review the analysis results, then click "Upload your Project" to reveal additional options.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Session Status */}
      {hasFiles && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Files Ready for Analysis
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  {summary.totalFiles} file{summary.totalFiles > 1 ? 's' : ''} loaded • {formatFileSize(summary.totalSize)} total • {summary.languages.join(', ')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAnalyzeFiles}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Analyze All Files</span>
              </button>
              <button
                onClick={handleClearFiles}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          hasFiles
            ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
            : dragActive
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
          accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.html,.css,.json,.md,.vue,.svelte,.scala,.kt,.swift,.dart,.lua,.pl,.r"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />
        
        <div className="space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-colors ${
            hasFiles
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900'
          }`}>
            {hasFiles ? (
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : (
              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          
          <div>
            <h3 className={`text-lg font-medium mb-2 ${
              hasFiles ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-white'
            }`}>
              {hasFiles ? 'Files Loaded in Session' : 'Choose Files to Upload'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {hasFiles 
                ? 'Files are stored in memory until you clear them or refresh the page'
                : 'Drop files here or click to browse. Files will be stored for instant analysis.'
              }
            </p>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto ${
              hasFiles
                ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white'
            }`}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : hasFiles ? (
              <>
                <Upload className="w-4 h-4" />
                <span>Add More Files</span>
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

      {/* File List */}
      {hasFiles && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Uploaded Files ({uploadState.files.length})
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last upload: {summary.newestUpload ? formatTimeAgo(summary.newestUpload) : 'Unknown'}
            </div>
          </div>

          <div className="grid gap-3">
            {uploadState.files.map((file) => (
              <div key={file.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{file.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {file.language}
                        </span>
                        <span>{formatFileSize(file.size)}</span>
                        <span>{file.content.split('\n').length} lines</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(file.uploadedAt)}</span>
                        </div>
                        {file.lastAnalyzed && (
                          <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            <span>Analyzed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyFileContent(file)}
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
                      onClick={() => handleAnalyzeIndividualFile(file)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Analyze</span>
                    </button>
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual File Analysis Modal */}
      {showAnalysisModal && selectedFileForAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Code Analysis: {selectedFileForAnalysis.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {selectedFileForAnalysis.language} • {formatFileSize(selectedFileForAnalysis.size)} • {selectedFileForAnalysis.content.split('\n').length} lines
                </p>
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <CodeSnippetExplainer
                code={selectedFileForAnalysis.content}
                language={selectedFileForAnalysis.language}
                isVisible={true}
                onToggle={() => setShowAnalysisModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersistentFileUpload;