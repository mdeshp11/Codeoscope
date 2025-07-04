import React, { useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, GitBranch, Database, Layers, BarChart3 } from 'lucide-react';
import { AnalysisProgress } from '../types/architecture';

interface ArchitectureAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (repoUrl: string, githubToken?: string) => Promise<void>;
}

const ArchitectureAnalysisModal: React.FC<ArchitectureAnalysisModalProps> = ({
  isOpen,
  onClose,
  onAnalyze
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) return;

    setIsAnalyzing(true);
    setError('');
    setProgress(null);

    try {
      await onAnalyze(repoUrl.trim(), githubToken.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
      setProgress(null);
    }
  };

  const getStageIcon = (stage: AnalysisProgress['stage']) => {
    switch (stage) {
      case 'fetching':
        return <Database className="w-5 h-5 text-blue-600" />;
      case 'parsing':
        return <GitBranch className="w-5 h-5 text-purple-600" />;
      case 'analyzing':
        return <BarChart3 className="w-5 h-5 text-orange-600" />;
      case 'generating':
        return <Layers className="w-5 h-5 text-green-600" />;
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              System Architecture Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Generate interactive architecture diagrams from your repository
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Features Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-medium text-blue-900 dark:text-blue-100">C4 Model Diagrams</h3>
              </div>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                System, container, and component level views following C4 architecture standards
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <GitBranch className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-medium text-purple-900 dark:text-purple-100">Dependency Analysis</h3>
              </div>
              <p className="text-purple-700 dark:text-purple-300 text-sm">
                Automatic detection of component relationships and data flow patterns
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-medium text-green-900 dark:text-green-100">Multi-Language Support</h3>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm">
                JavaScript, TypeScript, Python with Tree-sitter AST parsing
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="font-medium text-orange-900 dark:text-orange-100">Interactive Diagrams</h3>
              </div>
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                Zoom, export, and share Mermaid-powered architecture visualizations
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-100">Analysis Failed</h4>
                  <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Display */}
          {progress && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                {getStageIcon(progress.stage)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-blue-900 dark:text-blue-100 capitalize">
                      {progress.stage}
                    </span>
                    <span className="text-blue-700 dark:text-blue-300 text-sm">
                      {Math.round(progress.progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                {progress.message}
                {progress.currentFile && (
                  <span className="block text-blue-600 dark:text-blue-400 font-mono text-xs mt-1">
                    {progress.currentFile}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Form */}
          {!isAnalyzing && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repository URL
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://github.com/owner/repository"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GitHub Token <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Required for private repositories and higher rate limits
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAnalyze}
            disabled={!repoUrl.trim() || isAnalyzing}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                <span>Analyze Architecture</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureAnalysisModal;