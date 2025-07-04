import React, { useState, useEffect } from 'react';
import { Settings, ArrowLeft, Cpu, Network, Upload, LogIn, Download } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import CodeUploadModal from './CodeUploadModal';
import AuthModal from './AuthModal';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import { ButtonVisibilityManager } from '../services/ButtonVisibilityManager';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  project: any;
  onNewProject: () => void;
  onBackToProjects?: () => void;
  onShowAnalysis?: () => void;
  onShowArchitecture?: () => void;
  onShowLocalArchitecture?: () => void;
  onShowDependencyMap?: () => void;
  onExportDocumentation?: () => void;
  showAnalysisButton?: boolean;
  showArchitectureButton?: boolean;
  showLocalArchitectureButton?: boolean;
  showDependencyMapButton?: boolean;
  showExportButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  project, 
  onNewProject, 
  onBackToProjects, 
  onShowAnalysis,
  onShowArchitecture,
  onShowLocalArchitecture,
  onShowDependencyMap,
  onExportDocumentation,
  showAnalysisButton,
  showArchitectureButton,
  showLocalArchitectureButton,
  showDependencyMapButton,
  showExportButton
}) => {
  const [isCodeUploadModalOpen, setIsCodeUploadModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [buttonManager] = useState(() => ButtonVisibilityManager.getInstance());
  const { user, isAuthenticated } = useAuth();

  // Determine if we're on the home page (no current project)
  const isHomePage = !project;

  // Register buttons with the visibility manager
  useEffect(() => {
    const buttonsToRegister = [
      {
        id: 'dependencies',
        selector: 'button:has(.lucide-network)',
        revealOrder: 2,
        revealDelay: 100
      },
      {
        id: 'local-architecture',
        selector: 'button:has(.lucide-cpu)',
        revealOrder: 3,
        revealDelay: 200
      },
      {
        id: 'export-documentation',
        selector: 'button:has(.lucide-download)',
        revealOrder: 4,
        revealDelay: 300
      }
    ];

    // Small delay to ensure DOM elements are rendered
    const timer = setTimeout(() => {
      buttonManager.registerButtons(buttonsToRegister);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [buttonManager]);

  // Enhanced New Project handler
  const handleNewProject = () => {
    // Reset button visibility state when starting new project
    buttonManager.resetState();
    onNewProject();
  };

  // Handle logo click to go to home page
  const handleLogoClick = () => {
    if (onBackToProjects) {
      onBackToProjects();
    }
  };

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              {project && onBackToProjects && (
                <button
                  onClick={onBackToProjects}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Back to projects"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              
              {/* Clickable Codeoscope Logo */}
              <button
                onClick={handleLogoClick}
                className="flex items-center space-x-3 group transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-lg p-2 -m-2"
                title="Go to Home Page"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-200">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  Codeoscope
                </h1>
              </button>
            </div>
            
            {project && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>/</span>
                <span className="font-medium text-gray-900 dark:text-white">{project.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Analyze Files Button - HIDDEN ON HOME PAGE, VISIBLE EVERYWHERE ELSE */}
            {!isHomePage && (
              <button
                onClick={() => setIsCodeUploadModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2"
                title="Upload and analyze code files"
              >
                <Upload className="w-4 h-4" />
                <span>Analyze Files</span>
              </button>
            )}
            
            {/* Dependencies Button - Managed by ButtonVisibilityManager */}
            {showDependencyMapButton && onShowDependencyMap && (
              <button
                onClick={onShowDependencyMap}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2"
              >
                <Network className="w-4 h-4" />
                <span>Dependencies</span>
              </button>
            )}
            
            {/* Local Architecture Button - Managed by ButtonVisibilityManager */}
            {showLocalArchitectureButton && onShowLocalArchitecture && (
              <button
                onClick={onShowLocalArchitecture}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2"
              >
                <Cpu className="w-4 h-4" />
                <span>Analyze</span>
              </button>
            )}

            {/* Export Documentation Button - Managed by ButtonVisibilityManager */}
            {showExportButton && onExportDocumentation && (
              <button
                onClick={onExportDocumentation}
                className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Docs</span>
              </button>
            )}
            
            {/* Upload your Project Button - Special handling for sequential reveal trigger */}
            <button
              onClick={handleNewProject}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 new-project-btn"
              data-new-project="true"
            >
              Upload New Project
            </button>
            
            <div className="flex items-center space-x-2">
              <ThemeToggle size="md" />
              
              <NotificationBell />
            
              {/* Authentication Section */}
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <CodeUploadModal
        isOpen={isCodeUploadModalOpen}
        onClose={() => setIsCodeUploadModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default Header;