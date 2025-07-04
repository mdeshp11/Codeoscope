import React from 'react';
import { Upload, Code2 } from 'lucide-react';

interface EmptyStateProps {
  onNewProject: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onNewProject }) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <Code2 className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          Welcome to Codeoscope
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          Upload your codebase to get instant insights, explanations, and architecture analysis. 
          Perfect for understanding legacy code or exploring new projects.
        </p>

        <div className="space-y-4">
          <button
            onClick={onNewProject}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload your Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;