import React, { useState } from 'react';
import { X, Upload, Lightbulb } from 'lucide-react';
import PersistentFileUpload from './PersistentFileUpload';
import { StoredFile } from '../services/FileSessionManager';

interface CodeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CodeUploadModal: React.FC<CodeUploadModalProps> = ({ isOpen, onClose }) => {
  const [analysisResults, setAnalysisResults] = useState<StoredFile[]>([]);

  const handleAnalyzeFiles = (files: StoredFile[]) => {
    setAnalysisResults(files);
    console.log(`Analyzing ${files.length} files:`, files.map(f => f.name));
    
    // Here you could trigger additional analysis workflows
    // For example, sending files to a more comprehensive analysis service
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Persistent File Upload & Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Upload files once, analyze instantly. Files persist throughout your session.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Enhanced Header Info */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-purple-200 dark:border-purple-800 p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-purple-900 dark:text-purple-100">Session-Persistent File Management</h4>
              <p className="text-purple-700 dark:text-purple-300 text-sm mt-1">
                Upload files once and they'll remain available throughout your session. 
                Click "Analyze Files" for instant AI-powered analysis without re-uploading.
              </p>
              <ul className="text-purple-700 dark:text-purple-300 text-sm mt-2 ml-4 list-disc space-y-1">
                <li>Files stored in memory until session ends</li>
                <li>Instant analysis without re-upload</li>
                <li>Individual file analysis available</li>
                <li>Clear visual indicators for loaded files</li>
                <li>Comprehensive AI explanations and suggestions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <PersistentFileUpload onAnalyzeFiles={handleAnalyzeFiles} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {analysisResults.length > 0 && (
              <span>Last analysis: {analysisResults.length} file{analysisResults.length > 1 ? 's' : ''} processed</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeUploadModal;