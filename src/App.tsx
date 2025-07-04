import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EmptyState from './components/EmptyState';
import ProjectCard from './components/ProjectCard';
import UploadModal from './components/UploadModal';
import TreeView from './components/TreeView';
import CodeViewer from './components/CodeViewer';
import RepositoryAnalysis from './components/RepositoryAnalysis';
import ArchitectureAnalysisModal from './components/ArchitectureAnalysisModal';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import LocalArchitectureModal from './components/LocalArchitectureModal';
import DependencyMap from './components/DependencyMap';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import NotificationToastContainer from './components/NotificationToastContainer';
import ScrollableContainer from './components/ScrollableContainer';
import Footer from './components/Footer';
import ExportDocumentationModal from './components/ExportDocumentationModal';
import { Project, CodeFile } from './types';
import { ArchitectureData, AnalysisProgress } from './types/architecture';
import { ArchitectureAnalyzer } from './services/ArchitectureAnalyzer';
import { LocalRepositoryAnalyzer } from './services/LocalRepositoryAnalyzer';
import { processUploadedFiles } from './utils/fileProcessor';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';

interface GitHubRepoData {
  name: string;
  description: string;
  tree: any[];
  repoInfo: {
    owner: string;
    repo: string;
    branch: string;
  };
  totalFiles: number;
  totalFolders: number;
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [githubRepoData, setGithubRepoData] = useState<GitHubRepoData | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isLocalArchitectureModalOpen, setIsLocalArchitectureModalOpen] = useState(false);
  const [architectureData, setArchitectureData] = useState<ArchitectureData | null>(null);
  const [showArchitectureDiagram, setShowArchitectureDiagram] = useState(false);
  const [showDependencyMap, setShowDependencyMap] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [showPX4Demo, setShowPX4Demo] = useState(false);
  const [githubFetchError, setGithubFetchError] = useState<string | null>(null);
  const [isExportDocModalOpen, setIsExportDocModalOpen] = useState(false);

  // Load PX4 Autopilot repository as a demo project (accessible via navigation)
  const loadPX4Repository = async () => {
    const px4RepoData = {
      name: 'PX4-Autopilot',
      description: 'PX4 Autopilot Software - Demo Repository',
      tree: [], // Will be populated by handleGitHubFetch
      repoInfo: {
        owner: 'PX4',
        repo: 'PX4-Autopilot',
        branch: 'main'
      },
      totalFiles: 0,
      totalFolders: 0
    };
    
    try {
      setShowPX4Demo(true);
      await handleGitHubFetch(px4RepoData, 'https://github.com/PX4/PX4-Autopilot');
    } catch (error) {
      console.warn('Failed to load PX4 repository:', error);
      setShowPX4Demo(false);
      // Show user-friendly error message
      alert('Failed to load PX4 demo repository. You can still upload your own projects or use GitHub URLs.');
    }
  };

  const handleUpload = async (files: FileList | File[], projectName: string) => {
    try {
      const processedFiles = await processUploadedFiles(files, projectName);
      
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: projectName,
        description: `Uploaded ${files.length} files`,
        files: processedFiles,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalFiles: Array.from(files).length,
        totalLines: 0
      };

      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      setSelectedFile(null);
      setGithubRepoData(null);
      setShowAnalysis(false);
      setShowPX4Demo(false);
    } catch (error) {
      console.error('Failed to process files:', error);
    }
  };

  const handleGitHubFetch = async (repoData: GitHubRepoData, githubUrl?: string, githubToken?: string) => {
    try {
      setGithubFetchError(null);
      const url = githubUrl || `https://github.com/${repoData.repoInfo.owner}/${repoData.repoInfo.repo}`;
      const repoInfo = parseGithubUrl(url);
      
      if (!repoInfo) {
        console.error('Invalid GitHub URL');
        setGithubFetchError('Invalid GitHub URL format');
        return;
      }

      // Use a CORS proxy for GitHub API requests from the deployed site
      const apiBaseUrl = window.location.hostname === 'localhost' 
        ? 'https://api.github.com' 
        : 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.github.com');

      // Fetch the complete repository tree structure
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
      };

      // Add authorization header if token is provided
      if (githubToken && githubToken.trim()) {
        headers['Authorization'] = `token ${githubToken.trim()}`;
      }

      // Get repository info
      const repoUrl = `${apiBaseUrl}/repos/${repoInfo.owner}/${repoInfo.repo}`;
      console.log('Fetching repo info from:', repoUrl);
      
      const repoResponse = await fetch(repoUrl, {
        headers,
        mode: 'cors'
      });
      
      if (!repoResponse.ok) {
        throw new Error(`Failed to fetch repository: ${repoResponse.status}`);
      }
      
      const repoDetails = await repoResponse.json();
      
      // Get the complete repository tree (recursive) - this includes ALL files and folders
      const treeUrl = `${apiBaseUrl}/repos/${repoInfo.owner}/${repoInfo.repo}/git/trees/${repoInfo.branch}?recursive=1`;
      console.log('Fetching repo tree from:', treeUrl);
      
      const treeResponse = await fetch(treeUrl, {
        headers,
        mode: 'cors'
      });
      
      if (!treeResponse.ok) {
        throw new Error(`Failed to fetch repository tree: ${treeResponse.status}`);
      }
      
      const treeData = await treeResponse.json();
      
      // Convert GitHub tree structure to CodeFile format with complete hierarchy
      const convertTreeToCodeFiles = (treeNodes: any[]): CodeFile[] => {
        const nodeMap = new Map<string, CodeFile>();
        const rootNodes: CodeFile[] = [];

        // Sort items to ensure proper hierarchy building
        const sortedNodes = treeNodes.sort((a, b) => {
          const aDepth = a.path.split('/').length;
          const bDepth = b.path.split('/').length;
          if (aDepth !== bDepth) return aDepth - bDepth;
          return a.path.localeCompare(b.path);
        });

        // Create all nodes first
        for (const node of sortedNodes) {
          const pathParts = node.path.split('/');
          const name = pathParts[pathParts.length - 1];
          
          const codeFile: CodeFile = {
            id: `github-${node.path}`,
            name,
            path: node.path,
            type: node.type === 'tree' ? 'folder' : 'file',
            size: node.size,
            children: node.type === 'tree' ? [] : undefined,
            language: node.type === 'blob' ? getLanguageFromFilename(name) : undefined,
            // Store repository info for content fetching
            repoInfo: {
              owner: repoInfo.owner,
              repo: repoInfo.repo,
              branch: repoInfo.branch
            }
          };

          nodeMap.set(node.path, codeFile);

          // Create intermediate directories if they don't exist
          for (let i = 0; i < pathParts.length - 1; i++) {
            const intermediatePath = pathParts.slice(0, i + 1).join('/');
            if (!nodeMap.has(intermediatePath)) {
              const intermediateFile: CodeFile = {
                id: `github-${intermediatePath}`,
                name: pathParts[i],
                path: intermediatePath,
                type: 'folder',
                children: [],
                repoInfo: {
                  owner: repoInfo.owner,
                  repo: repoInfo.repo,
                  branch: repoInfo.branch
                }
              };
              nodeMap.set(intermediatePath, intermediateFile);
            }
          }
        }

        // Build hierarchy
        for (const [path, node] of nodeMap) {
          const pathParts = path.split('/');
          
          if (pathParts.length === 1) {
            // Root level
            rootNodes.push(node);
          } else {
            // Find parent
            const parentPath = pathParts.slice(0, -1).join('/');
            const parent = nodeMap.get(parentPath);
            if (parent && parent.children) {
              parent.children.push(node);
            }
          }
        }

        // Sort each level: folders first, then files, both alphabetically
        const sortNodes = (nodes: CodeFile[]): CodeFile[] => {
          return nodes.sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name, undefined, { numeric: true });
          });
        };

        const sortRecursively = (nodes: CodeFile[]): CodeFile[] => {
          const sorted = sortNodes(nodes);
          sorted.forEach(node => {
            if (node.children) {
              node.children = sortRecursively(node.children);
            }
          });
          return sorted;
        };

        return sortRecursively(rootNodes);
      };

      const codeFiles = convertTreeToCodeFiles(treeData.tree);

      const newProject: Project = {
        id: `github-proj-${Date.now()}`,
        name: repoDetails.name,
        description: repoDetails.description || `GitHub repository: ${repoInfo.owner}/${repoInfo.repo}`,
        files: codeFiles,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalFiles: treeData.tree.filter((item: any) => item.type === 'blob').length,
        totalLines: 0
      };

      const updatedRepoData = {
        ...repoData,
        name: repoDetails.name,
        description: repoDetails.description,
        tree: codeFiles,
        totalFiles: treeData.tree.filter((item: any) => item.type === 'blob').length,
        totalFolders: treeData.tree.filter((item: any) => item.type === 'tree').length,
        repoInfo: repoInfo
      };

      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      setSelectedFile(null);
      setGithubRepoData(updatedRepoData);
      setShowAnalysis(false); // Changed to false to match local folder behavior
      setShowPX4Demo(false);

    } catch (error) {
      console.error('Failed to fetch GitHub repository:', error);
      setGithubFetchError(error instanceof Error ? error.message : 'Failed to fetch repository');
      throw error; // Re-throw to allow caller to handle
    }
  };

  const handleArchitectureAnalysis = async (repoUrl: string, githubToken?: string) => {
    const analyzer = new ArchitectureAnalyzer();
    
    // Set up progress callback
    analyzer.setProgressCallback((progress: AnalysisProgress) => {
      setAnalysisProgress(progress);
    });

    try {
      const data = await analyzer.analyzeRepository(repoUrl, githubToken);
      setArchitectureData(data);
      setShowArchitectureDiagram(true);
    } catch (error) {
      console.error('Architecture analysis failed:', error);
      throw error;
    } finally {
      setAnalysisProgress(null);
    }
  };

  const handleLocalArchitectureAnalysis = async (project: Project) => {
    const analyzer = new LocalRepositoryAnalyzer();
    
    // Set up progress callback
    analyzer.setProgressCallback((progress: AnalysisProgress) => {
      setAnalysisProgress(progress);
    });

    try {
      const data = await analyzer.analyzeLocalRepository(project.files, project.name);
      setArchitectureData(data);
      setShowArchitectureDiagram(true);
    } catch (error) {
      console.error('Local architecture analysis failed:', error);
      throw error;
    } finally {
      setAnalysisProgress(null);
    }
  };

  const handleShowDependencyMap = async () => {
    if (!currentProject) return;

    // If we already have architecture data, show the dependency map
    if (architectureData) {
      setShowDependencyMap(true);
      return;
    }

    // Otherwise, analyze the project first
    const analyzer = new LocalRepositoryAnalyzer();
    
    // Set up progress callback
    analyzer.setProgressCallback((progress: AnalysisProgress) => {
      setAnalysisProgress(progress);
    });

    try {
      const data = await analyzer.analyzeLocalRepository(currentProject.files, currentProject.name);
      setArchitectureData(data);
      setShowDependencyMap(true);
    } catch (error) {
      console.error('Dependency analysis failed:', error);
    } finally {
      setAnalysisProgress(null);
    }
  };

  const handleExportDocumentation = () => {
    setIsExportDocModalOpen(true);
  };

  const parseGithubUrl = (url: string) => {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/,
      /github\.com\/([^\/]+)\/([^\/]+)\.git/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace('.git', ''),
          branch: match[3] || 'main'
        };
      }
    }
    return null;
  };

  const getLanguageFromFilename = (filename: string): string => {
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
      scss: 'scss',
      sass: 'sass',
      json: 'json',
      md: 'markdown',
      vue: 'vue',
      svelte: 'svelte',
      cmake: 'cmake',
      sh: 'shell',
      bash: 'shell',
      yml: 'yaml',
      yaml: 'yaml',
      xml: 'xml',
      h: 'c',
      hpp: 'cpp',
      hxx: 'cpp'
    };
    
    return languageMap[extension || ''] || 'text';
  };

  const handleProjectSelect = (project: Project) => {
    setCurrentProject(project);
    setSelectedFile(null);
    setGithubRepoData(null);
    setShowAnalysis(false);
    setArchitectureData(null); // Reset architecture data when switching projects
    setShowPX4Demo(false);
  };

  const handleFileSelect = (file: CodeFile) => {
    setSelectedFile(file);
    setShowAnalysis(false);
  };

  const handleNewProject = () => {
    setIsUploadModalOpen(true);
  };

  const handleBackToProjects = () => {
    setCurrentProject(null);
    setSelectedFile(null);
    setGithubRepoData(null);
    setShowAnalysis(false);
    setArchitectureData(null);
    setShowPX4Demo(false);
  };

  const handleShowAnalysis = () => {
    setSelectedFile(null);
    setShowAnalysis(true);
  };

  const handleShowArchitecture = () => {
    setIsArchitectureModalOpen(true);
  };

  const handleShowLocalArchitecture = () => {
    setIsLocalArchitectureModalOpen(true);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden transition-colors duration-300">
            <Header 
              project={currentProject} 
              onNewProject={handleNewProject}
              onBackToProjects={currentProject ? handleBackToProjects : undefined}
              onShowAnalysis={handleShowAnalysis}
              onShowArchitecture={handleShowArchitecture}
              onShowLocalArchitecture={currentProject ? handleShowLocalArchitecture : undefined}
              onShowDependencyMap={currentProject ? handleShowDependencyMap : undefined}
              onExportDocumentation={currentProject ? handleExportDocumentation : undefined}
              showAnalysisButton={!!currentProject}
              showArchitectureButton={!!currentProject}
              showLocalArchitectureButton={!!currentProject}
              showDependencyMapButton={!!currentProject}
              showExportButton={!!currentProject}
            />

            {/* Email Verification Banner */}
            <EmailVerificationBanner />

            {/* GitHub Fetch Error Banner */}
            {githubFetchError && (
              <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3">
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">GitHub Repository Fetch Error</p>
                      <p className="text-sm text-red-700 dark:text-red-300">{githubFetchError}</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Try using a Personal Access Token or upload a local folder instead.
                      </p>
                    </div>
                    <button 
                      onClick={() => setGithubFetchError(null)}
                      className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 flex overflow-hidden">
              {!currentProject ? (
                // Homepage/Project selection view
                <div className="flex-1 flex flex-col">
                  {projects.length === 0 ? (
                    <div className="flex-1 flex flex-col">
                      <EmptyState onNewProject={handleNewProject} />
                      
                      {/* Demo Section */}
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                        <div className="max-w-4xl mx-auto text-center">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Try a Demo Repository?
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Explore Codeoscope's features with the PX4 Autopilot open-source project
                          </p>
                          <button
                            onClick={loadPX4Repository}
                            disabled={showPX4Demo}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
                          >
                            {showPX4Demo ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Loading PX4 Demo...</span>
                              </>
                            ) : (
                              <>
                                <span>🚁</span>
                                <span>Load PX4 Autopilot Demo</span>
                              </>
                            )}
                          </button>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            This will fetch the PX4-Autopilot repository from GitHub
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ScrollableContainer className="flex-1 p-6">
                      <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Projects</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Select a project to explore its codebase</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={loadPX4Repository}
                              disabled={showPX4Demo}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                            >
                              {showPX4Demo ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Loading Demo...</span>
                                </>
                              ) : (
                                <>
                                  <span>🚁</span>
                                  <span>PX4 Demo</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleNewProject}
                              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              New Project
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {projects.map(project => (
                            <ProjectCard
                              key={project.id}
                              project={project}
                              onClick={() => handleProjectSelect(project)}
                            />
                          ))}
                        </div>
                      </div>
                    </ScrollableContainer>
                  )}
                </div>
              ) : (
                // Project detail view with tree structure on left
                <>
                  <TreeView
                    files={currentProject.files}
                    selectedFile={selectedFile?.id || null}
                    onFileSelect={handleFileSelect}
                    className="w-96 border-r-2 border-gray-300 dark:border-gray-600"
                  />
                  {showAnalysis ? (
                    <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
                      <RepositoryAnalysis repoUrl={githubRepoData ? 
                        `https://github.com/${githubRepoData.repoInfo.owner}/${githubRepoData.repoInfo.repo}` : 
                        `local-project-${currentProject.id}`} 
                      />
                    </div>
                  ) : (
                    <CodeViewer file={selectedFile} />
                  )}
                </>
              )}
            </div>

            <Footer />

            <UploadModal
              isOpen={isUploadModalOpen}
              onClose={() => setIsUploadModalOpen(false)}
              onUpload={handleUpload}
              onGitHubFetch={handleGitHubFetch}
            />

            <ArchitectureAnalysisModal
              isOpen={isArchitectureModalOpen}
              onClose={() => setIsArchitectureModalOpen(false)}
              onAnalyze={handleArchitectureAnalysis}
            />

            <LocalArchitectureModal
              isOpen={isLocalArchitectureModalOpen}
              onClose={() => setIsLocalArchitectureModalOpen(false)}
              onAnalyze={() => currentProject && handleLocalArchitectureAnalysis(currentProject)}
              project={currentProject}
              analysisProgress={analysisProgress}
            />

            {showArchitectureDiagram && architectureData && (
              <ArchitectureDiagram
                data={architectureData}
                onClose={() => setShowArchitectureDiagram(false)}
              />
            )}

            {showDependencyMap && architectureData && (
              <DependencyMap
                data={architectureData}
                onClose={() => setShowDependencyMap(false)}
              />
            )}

            {isExportDocModalOpen && (
              <ExportDocumentationModal
                isOpen={isExportDocModalOpen}
                onClose={() => setIsExportDocModalOpen(false)}
                project={currentProject}
                architectureData={architectureData}
                selectedFile={selectedFile}
              />
            )}

            {/* Toast Notifications */}
            <NotificationToastContainer />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;