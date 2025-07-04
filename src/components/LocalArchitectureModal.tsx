import React from 'react';
import { X, Loader2, AlertCircle, CheckCircle, Cpu, Database, Layers, BarChart3, FileText, Code, GitBranch } from 'lucide-react';
import { AnalysisProgress } from '../types/architecture';
import { Project } from '../types';

interface LocalArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: () => Promise<void>;
  project: Project | null;
  analysisProgress: AnalysisProgress | null;
}

const LocalArchitectureModal: React.FC<LocalArchitectureModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  project,
  analysisProgress
}) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  if (!isOpen || !project) return null;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError('');

    try {
      await onAnalyze();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStageIcon = (stage: AnalysisProgress['stage']) => {
    switch (stage) {
      case 'parsing':
        return <Code className="w-5 h-5 text-blue-600" />;
      case 'analyzing':
        return <BarChart3 className="w-5 h-5 text-purple-600" />;
      case 'generating':
        return <Layers className="w-5 h-5 text-green-600" />;
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />;
    }
  };

  const getFileTypeStats = () => {
    const flattenFiles = (files: any[]): any[] => {
      const result: any[] = [];
      for (const file of files) {
        if (file.type === 'file') {
          result.push(file);
        } else if (file.children) {
          result.push(...flattenFiles(file.children));
        }
      }
      return result;
    };

    const allFiles = flattenFiles(project.files);
    const stats = allFiles.reduce((acc, file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'other';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const fileStats = getFileTypeStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Local Repository Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Analyze "{project.name}" with AI-powered code insights
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
          {/* Project Overview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Project Overview</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Total Files:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100">{project.totalFiles}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Created:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {fileStats.length > 0 && (
              <div className="mt-3">
                <span className="text-blue-700 dark:text-blue-300 font-medium text-sm">File Types:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {fileStats.map(([ext, count]) => (
                    <span
                      key={ext}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                    >
                      .{ext} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analysis Features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-medium text-purple-900 dark:text-purple-100">Code Parsing</h3>
              </div>
              <p className="text-purple-700 dark:text-purple-300 text-sm">
                Extract functions, classes, and dependencies from JavaScript, Python, C++ and other files
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-medium text-green-900 dark:text-green-100">AI Summaries</h3>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Plain English descriptions for each component/s and module/s
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <GitBranch className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="font-medium text-orange-900 dark:text-orange-100">Relationships</h3>
              </div>
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                Map component dependencies and architectural relationships
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-medium text-indigo-900 dark:text-indigo-100">Architecture</h3>
              </div>
              <p className="text-indigo-700 dark:text-indigo-300 text-sm">
                Interactive C4 model diagrams with Mermaid visualization
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
          {analysisProgress && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                {getStageIcon(analysisProgress.stage)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-blue-900 dark:text-blue-100 capitalize">
                      {analysisProgress.stage}
                    </span>
                    <span className="text-blue-700 dark:text-blue-300 text-sm">
                      {Math.round(analysisProgress.progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysisProgress.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                {analysisProgress.message}
                {analysisProgress.currentFile && (
                  <span className="block text-blue-600 dark:text-blue-400 font-mono text-xs mt-1">
                    {analysisProgress.currentFile}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Analysis Info */}
          {!isAnalyzing && !analysisProgress && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">What happens during analysis:</h4>
              <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                <li>Parse all source code files using regex-based analysis</li>
                <li>Extract functions, classes, imports, and dependencies</li>
                <li>Generate AI-powered summaries for each component</li>
                <li>Build relationship maps between components</li>
                <li>Create interactive architecture diagrams</li>
              </ol>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Analysis typically takes 10-30 seconds depending on project size.
              </p>
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
            disabled={isAnalyzing}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Start Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocalArchitectureModal;