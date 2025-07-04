import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Folder, Code, AlertCircle, Github, Loader2, ChevronRight, ChevronDown, File, FolderOpen, Key, Eye, EyeOff, Clock, Copy, Download, HardDrive, Lightbulb } from 'lucide-react';
import { UploadProgress } from '../types';
import CodeSnippetExplainer from './CodeSnippetExplainer';
import { CSSUploadButtonHandler } from '../utils/uploadButtonHandler';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: FileList | File[], projectName: string) => void;
  onGitHubFetch?: (repoData: any, githubUrl?: string, githubToken?: string) => void;
}

interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  sha: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  size?: number;
  isExpanded?: boolean;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload, onGitHubFetch }) => {
  const [activeTab, setActiveTab] = useState<'folder' | 'github' | 'files' | 'paste'>('folder');
  const [code, setCode] = useState('');
  const [projectName, setProjectName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showRateLimitWarning, setShowRateLimitWarning] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [uploadButtonHandler, setUploadButtonHandler] = useState<CSSUploadButtonHandler | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  // Initialize upload button handler when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        const handler = new CSSUploadButtonHandler({
          fileInput: filesInputRef.current || undefined,
          folderInput: folderInputRef.current || undefined,
          analyzeButton: 'header [data-analyze-button="purple"]',
          analyzeFilesButton: 'header [data-analyze-files-button="pink"]',
          onFileUploadStart: () => {
            console.log('File upload started - hiding purple Analyze button');
          },
          onFolderUploadStart: () => {
            console.log('Folder upload started - hiding pink Analyze Files button');
          },
          onUploadComplete: () => {
            console.log('Upload completed - showing buttons');
          },
          onUploadError: (error) => {
            console.error('Upload error:', error);
            setErrorMessage('Upload failed. Please try again.');
          }
        });
        setUploadButtonHandler(handler);
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  // Cleanup handler when modal closes
  useEffect(() => {
    return () => {
      if (uploadButtonHandler) {
        uploadButtonHandler.cleanup();
      }
    };
  }, [uploadButtonHandler]);

  if (!isOpen) return null;

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Manually trigger button hiding for folder upload
    if (uploadButtonHandler) {
      uploadButtonHandler.hideButtonsManually('analyzeFiles');
    }
    
    // Extract folder name from the first file's path
    const firstFile = files[0];
    let folderName = projectName;
    
    if (!folderName && 'webkitRelativePath' in firstFile && firstFile.webkitRelativePath) {
      folderName = firstFile.webkitRelativePath.split('/')[0];
    }
    
    if (!folderName) {
      folderName = 'Uploaded Folder';
    }
    
    // Simulate upload process
    setTimeout(() => {
      onUpload(files, folderName);
      onClose();
      
      // Show button after upload completes
      if (uploadButtonHandler) {
        uploadButtonHandler.showButtonsManually('analyzeFiles');
      }
    }, 1500); // Simulate 1.5 second upload time
  };

  const handleFilesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Manually trigger button hiding for file upload
    if (uploadButtonHandler) {
      uploadButtonHandler.hideButtonsManually('analyze');
    }
    
    const projectNameFromFiles = projectName || 'Code Files';
    
    // Simulate upload process
    setTimeout(() => {
      onUpload(files, projectNameFromFiles);
      onClose();
      
      // Show button after upload completes
      if (uploadButtonHandler) {
        uploadButtonHandler.showButtonsManually('analyze');
      }
    }, 1000); // Simulate 1 second upload time
  };

  const handlePasteSubmit = () => {
    if (!code.trim() || !projectName.trim()) return;
    
    // Create a mock file for pasted code
    const fileExtension = getFileExtension(selectedLanguage);
    const file = new File([code], `main.${fileExtension}`, { type: 'text/plain' });
    onUpload([file], projectName);
    setCode('');
    setProjectName('');
    onClose();
  };

  const getFileExtension = (language: string): string => {
    const extensions: { [key: string]: string } = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      cpp: 'cpp',
      c: 'c',
      java: 'java',
      html: 'html',
      css: 'css',
      json: 'json'
    };
    return extensions[language] || 'txt';
  };

  const parseGithubUrl = (url: string) => {
    // Support various GitHub URL formats
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

  const buildTreeStructure = (items: GitHubTreeItem[]): TreeNode[] => {
    const root: TreeNode[] = [];
    const nodeMap = new Map<string, TreeNode>();

    // Sort items to ensure folders come before their contents
    const sortedItems = items.sort((a, b) => {
      const aDepth = a.path.split('/').length;
      const bDepth = b.path.split('/').length;
      if (aDepth !== bDepth) return aDepth - bDepth;
      return a.path.localeCompare(b.path);
    });

    for (const item of sortedItems) {
      const pathParts = item.path.split('/');
      const name = pathParts[pathParts.length - 1];
      
      const node: TreeNode = {
        name,
        path: item.path,
        type: item.type === 'tree' ? 'folder' : 'file',
        size: item.size,
        children: item.type === 'tree' ? [] : undefined
      };

      nodeMap.set(item.path, node);

      if (pathParts.length === 1) {
        // Root level item
        root.push(node);
      } else {
        // Find parent folder
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = nodeMap.get(parentPath);
        
        if (parent && parent.children) {
          parent.children.push(node);
        }
      }
    }

    // Sort each level: folders first, then files, both alphabetically
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    };

    const sortRecursively = (nodes: TreeNode[]): TreeNode[] => {
      const sorted = sortNodes(nodes);
      sorted.forEach(node => {
        if (node.children) {
          node.children = sortRecursively(node.children);
        }
      });
      return sorted;
    };

    return sortRecursively(root);
  };

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (githubToken.trim()) {
      headers['Authorization'] = `token ${githubToken.trim()}`;
    }
    
    return headers;
  };

  const fetchGithubRepo = async () => {
    if (!githubUrl.trim()) return;
    
    const repoInfo = parseGithubUrl(githubUrl);
    if (!repoInfo) {
      setErrorMessage('Invalid GitHub URL. Please use format: https://github.com/owner/repo');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setShowRateLimitWarning(false);
    
    try {
      // Use a CORS proxy for GitHub API requests from the deployed site
      const apiBaseUrl = window.location.hostname === 'localhost' 
        ? 'https://api.github.com' 
        : 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.github.com');
      
      const headers = getAuthHeaders();
      
      // First, get repository info
      const repoUrl = `${apiBaseUrl}/repos/${repoInfo.owner}/${repoInfo.repo}`;
      console.log('Fetching repo info from:', repoUrl);
      
      const repoResponse = await fetch(repoUrl, {
        headers,
        mode: 'cors'
      });
      
      if (!repoResponse.ok) {
        if (repoResponse.status === 404) {
          throw new Error('Repository not found. Please check the URL and ensure you have access to this repository.');
        } else if (repoResponse.status === 403) {
          const rateLimitRemaining = repoResponse.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = repoResponse.headers.get('X-RateLimit-Reset');
          
          if (rateLimitRemaining === '0') {
            let resetTime = '';
            if (rateLimitReset) {
              const resetDate = new Date(parseInt(rateLimitReset) * 1000);
              resetTime = ` Rate limit resets at ${resetDate.toLocaleTimeString()}.`;
            }
            
            setShowRateLimitWarning(true);
            throw new Error(`GitHub API rate limit exceeded.${resetTime} Please provide a Personal Access Token to continue with higher rate limits.`);
          } else {
            throw new Error('Access forbidden. This repository may be private - please provide a Personal Access Token with appropriate permissions.');
          }
        } else if (repoResponse.status === 401) {
          throw new Error('Invalid Personal Access Token. Please check your token and try again.');
        } else {
          throw new Error(`GitHub API error: ${repoResponse.status} ${repoResponse.statusText}`);
        }
      }
      
      const repoData = await repoResponse.json();
      
      // Get the complete repository tree (recursive) - this includes ALL files and folders
      const treeUrl = `${apiBaseUrl}/repos/${repoInfo.owner}/${repoInfo.repo}/git/trees/${repoInfo.branch}?recursive=1`;
      console.log('Fetching repo tree from:', treeUrl);
      
      const treeResponse = await fetch(treeUrl, {
        headers,
        mode: 'cors'
      });
      
      if (!treeResponse.ok) {
        if (treeResponse.status === 404) {
          throw new Error(`Branch '${repoInfo.branch}' not found. The repository may use 'master' instead of 'main'.`);
        } else if (treeResponse.status === 403) {
          const rateLimitRemaining = treeResponse.headers.get('X-RateLimit-Remaining');
          if (rateLimitRemaining === '0') {
            setShowRateLimitWarning(true);
            throw new Error('GitHub API rate limit exceeded while fetching repository contents. Please provide a Personal Access Token to continue.');
          }
        }
        throw new Error(`Failed to fetch repository contents: ${treeResponse.status} ${treeResponse.statusText}`);
      }
      
      const treeData = await treeResponse.json();
      
      // Build tree structure from ALL items
      const treeStructure = buildTreeStructure(treeData.tree);
      
      // Create repository data object
      const repositoryData = {
        name: projectName || repoData.name,
        description: repoData.description || `GitHub repository: ${repoInfo.owner}/${repoInfo.repo}`,
        tree: treeStructure,
        repoInfo,
        totalFiles: treeData.tree.filter((item: GitHubTreeItem) => item.type === 'blob').length,
        totalFolders: treeData.tree.filter((item: GitHubTreeItem) => item.type === 'tree').length
      };
      
      // Call the callback to pass data to parent component with token
      if (onGitHubFetch) {
        onGitHubFetch(repositoryData, githubUrl, githubToken);
      }
      
      // Clear form and close modal
      setGithubUrl('');
      setProjectName('');
      setErrorMessage('');
      setShowRateLimitWarning(false);
      onClose();
      
    } catch (error) {
      console.error('GitHub fetch error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch repository';
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const items = event.dataTransfer.items;
    const files: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    
    if (files.length > 0) {
      const folderName = projectName || 'Dropped Files';
      onUpload(files, folderName);
      onClose();
    }
  };

  const sampleCode = `// Sample React Component
import React, { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  const fetchUser = async (id) => {
    try {
      const response = await fetch(\`/api/users/\${id}\`);
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};

export default UserProfile;`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex">
        {/* Main Modal Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Upload a Project</h2>
              <p className="text-gray-600 mt-1">Upload your codebase, file or paste your code to get started</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Upload Button Handler Status */}
          {/* {uploadButtonHandler && (
            <div className="px-6 py-2 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Upload button handler active - buttons will hide during upload</span>
              </div>
            </div>
          )} */}

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('folder')}
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === 'folder'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Upload Folder</span>
            </button>
            <button
              onClick={() => setActiveTab('github')}
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === 'github'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Github className="w-4 h-4" />
              <span>GitHub URL</span>
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === 'files'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Upload Files</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === 'paste'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Paste Code</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'folder' && (
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <HardDrive className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Upload Complete Project Folder</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Select an entire folder to upload all files and maintain the complete directory structure.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Project Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name <span className="text-gray-500"></span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter project name..."/>
                </div>

                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                >
                  <input
                    ref={folderInputRef}
                    type="file"
                    webkitdirectory=""
                    multiple
                    onChange={handleFolderUpload}
                    className="hidden"
                    data-upload-type="folder"
                  />
                  <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select Folder to Upload
                  </h3>
                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Choose Folder
                  </button>
                  <p className="text-xs text-gray-500 mt-3">
                    Supports: JavaScript, TypeScript, Python, C++, HTML, CSS, JSON, Markdown, and more
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'github' && (
              <div className="p-6 space-y-4">
                {/* Error Message */}
                {errorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-900">Error</h4>
                        <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rate Limit Warning */}
                {showRateLimitWarning && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-900">GitHub API Rate Limit Exceeded</h4>
                        <p className="text-yellow-700 text-sm mt-1">
                          You've reached the GitHub API rate limit for unauthenticated requests. To continue:
                        </p>
                        <ol className="text-yellow-700 text-sm mt-2 ml-4 list-decimal space-y-1">
                          <li>
                            Go to{' '}
                            <a 
                              href="https://github.com/settings/tokens" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-yellow-800 underline hover:text-yellow-900"
                            >
                              GitHub Settings → Personal Access Tokens
                            </a>
                          </li>
                          <li>Create a new token with 'repo' scope (for private repos) or 'public_repo' scope</li>
                          <li>Paste the token in the field below and try again</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name <span className="text-gray-500">(optional - will use repo name)</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter project name..."
                  />
                </div>

                {/* GitHub Token Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-2">
                      <Key className="w-4 h-4" />
                      <span>Personal Access Token</span>
                      <span className="text-gray-500">(optional - for private repos & higher rate limits)</span>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a token at{' '}
                    <a 
                      href="https://github.com/settings/tokens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      github.com/settings/tokens
                    </a>
                    {' '}with 'repo\' scope for private repositories
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Github className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Import from GitHub</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Enter a public GitHub repository URL to automatically fetch and display the complete directory structure.
                        For private repositories or higher rate limits, provide a Personal Access Token.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="https://github.com/owner/repository"
                    disabled={isLoading}
                  />
                  <button
                    onClick={fetchGithubRepo}
                    disabled={!githubUrl.trim() || isLoading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Fetching...</span>
                      </>
                    ) : (
                      <>
                        <Github className="w-4 h-4" />
                        <span>Fetch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="p-6 space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900">Upload Individual Files</h4>
                      <p className="text-purple-700 text-sm mt-1">
                        You can select multiple code files or even <b>Drag and Drop</b> your files for analysis.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                >
                  <input
                    ref={filesInputRef}
                    type="file"
                    multiple
                    onChange={handleFilesUpload}
                    accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.html,.css,.json,.md"
                    className="hidden"
                    data-upload-type="files"
                  />
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload Code Files
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Select multiple code files or drag and drop them here. The "Analyze" button will be hidden during upload.
                  </p>
                  <button
                    onClick={() => filesInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Choose Files
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p className="font-medium mb-1">Supported file types:</p>
                  <p>.js, .jsx, .ts, .tsx, .py, .java, .cpp, .c, .cs, .php, .rb, .go, .rs, .html, .css, .json, .md</p>
                </div>
              </div>
            )}

            {activeTab === 'paste' && (
              <div className="p-6 space-y-4">
                {/* Enhanced Paste Code Header */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-900">AI-Powered Code Analysis</h4>
                      <p className="text-purple-700 text-sm mt-1">
                        Paste any code snippet to get detailed explanations, line-by-line commentary, 
                        and improvement suggestions powered by advanced AI analysis.
                      </p>
                      <ul className="text-purple-700 text-sm mt-2 ml-4 list-disc space-y-1">
                        <li>Detailed functionality explanations</li>
                        <li>Line-by-line code commentary</li>
                        <li>Key elements identification</li>
                        <li>Improvement suggestions in the code snippet</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Enter project name..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="java">Java</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Code
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCode(sampleCode)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Load sample code
                      </button>
                      <button
                        onClick={() => setShowExplainer(!showExplainer)}
                        className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                          showExplainer 
                            ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Lightbulb className="w-3 h-3" />
                        <span>{showExplainer ? 'Hide' : 'Show'} AI Analysis</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-80 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Paste your code here..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            {activeTab === 'paste' ? (
              <button
                onClick={handlePasteSubmit}
                disabled={!code.trim() || !projectName.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Create Project
              </button>
            ) : activeTab === 'github' ? (
              <p className="text-sm text-gray-500">
                Enter a GitHub URL and click Fetch to continue
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Select {activeTab === 'folder' ? 'a folder' : 'files'} to continue
              </p>
            )}
          </div>
        </div>

        {/* Code Explainer Panel */}
        {activeTab === 'paste' && showExplainer && (
          <div className="w-96 border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <CodeSnippetExplainer
              code={code}
              language={selectedLanguage}
              isVisible={showExplainer}
              onToggle={() => setShowExplainer(!showExplainer)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;