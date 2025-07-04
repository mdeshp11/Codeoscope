import React from 'react';
import { Github, Code } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="flex items-center space-x-4 mb-1">
          <a 
            href="https://github.com/codeoscope/codeoscope" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            aria-label="GitHub Repository"
          >
            <Github className="w-5 h-5" />
          </a>
          <a 
            href="https://bolt.new" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            aria-label="Built with Bolt.new"
          >
            <Code className="w-5 h-5" />
            <span className="text-sm font-medium">Built with Bolt.new</span>
          </a>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Codeoscope. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
