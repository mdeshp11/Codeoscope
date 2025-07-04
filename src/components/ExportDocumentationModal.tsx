import React, { useState } from 'react';
import { X, Download, FileText, Code, GitBranch, Cpu, BarChart3, Settings, CheckCircle, Loader2, AlertCircle, Sun, Moon } from 'lucide-react';
import { Project, CodeFile } from '../types';
import { ArchitectureData } from '../types/architecture';

interface ExportDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  architectureData: ArchitectureData | null;
  selectedFile: CodeFile | null;
}

const ExportDocumentationModal: React.FC<ExportDocumentationModalProps> = ({
  isOpen,
  onClose,
  project,
  architectureData,
  selectedFile
}) => {
  const [exportOptions, setExportOptions] = useState({
    includeOverview: true,
    includeArchitecture: true,
    includeCodeExplanations: true,
    includeDependencyMap: true,
    includeSourceCode: true,
    includeReadme: true,
    theme: 'light' as 'light' | 'dark' | 'auto',
    format: 'html' as 'html' | 'markdown' | 'pdf'
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen || !project) return null;

  const handleOptionChange = (option: keyof typeof exportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [option]: value }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);
    
    try {
      // Generate documentation based on selected options
      const documentation = await generateDocumentation(project, architectureData, selectedFile, exportOptions);
      
      // Create downloadable file
      const blob = new Blob([documentation], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-documentation.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportError('Failed to generate documentation. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateDocumentation = async (
    project: Project,
    architectureData: ArchitectureData | null,
    selectedFile: CodeFile | null,
    options: typeof exportOptions
  ): Promise<string> => {
    // Create HTML template
    const html = `
      <!DOCTYPE html>
      <html lang="en" class="${options.theme === 'auto' ? '' : options.theme}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name} - Code Documentation</title>
        <meta name="description" content="Generated documentation for ${project.name}">
        <meta name="generator" content="Codeoscope Documentation Generator">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
        <script src="https://unpkg.com/prismjs@1.29.0/components/prism-core.min.js"></script>
        <script src="https://unpkg.com/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
        <link href="https://unpkg.com/prismjs@1.29.0/themes/prism.css" rel="stylesheet" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          :root {
            --primary-color: #3b82f6;
            --secondary-color: #8b5cf6;
            --success-color: #22c55e;
            --warning-color: #f59e0b;
            --error-color: #ef4444;
            --background-color: #ffffff;
            --text-color: #1f2937;
            --border-color: #e5e7eb;
          }
          
          .dark {
            --primary-color: #60a5fa;
            --secondary-color: #a78bfa;
            --success-color: #4ade80;
            --warning-color: #fbbf24;
            --error-color: #f87171;
            --background-color: #111827;
            --text-color: #f9fafb;
            --border-color: #374151;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            background-color: var(--background-color);
            color: var(--text-color);
          }
          
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 280px;
            height: 100vh;
            overflow-y: auto;
            background-color: var(--background-color);
            border-right: 1px solid var(--border-color);
            padding: 1.5rem;
          }
          
          .main-content {
            margin-left: 280px;
            padding: 2rem;
            max-width: 1200px;
          }
          
          .card {
            background-color: var(--background-color);
            border: 1px solid var(--border-color);
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .nav-link {
            display: block;
            padding: 0.5rem 0;
            color: var(--text-color);
            text-decoration: none;
            border-radius: 0.25rem;
            transition: background-color 0.2s;
          }
          
          .nav-link:hover {
            background-color: rgba(0, 0, 0, 0.05);
          }
          
          .dark .nav-link:hover {
            background-color: rgba(255, 255, 255, 0.05);
          }
          
          .nav-link.active {
            background-color: var(--primary-color);
            color: white;
          }
          
          pre {
            border-radius: 0.5rem;
            margin: 1rem 0;
          }
          
          .theme-toggle {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 50%;
            width: 3rem;
            height: 3rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
          
          @media (max-width: 768px) {
            .sidebar {
              width: 100%;
              height: auto;
              position: relative;
              border-right: none;
              border-bottom: 1px solid var(--border-color);
            }
            
            .main-content {
              margin-left: 0;
            }
          }
          
          /* Mermaid diagram styles */
          .mermaid {
            margin: 2rem 0;
          }
          
          /* Code block styles */
          .code-block {
            position: relative;
            margin: 1.5rem 0;
          }
          
          .code-block-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: rgba(0, 0, 0, 0.05);
            padding: 0.5rem 1rem;
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
            border: 1px solid var(--border-color);
            border-bottom: none;
          }
          
          .dark .code-block-header {
            background-color: rgba(255, 255, 255, 0.05);
          }
          
          .code-block pre {
            margin-top: 0;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
          }
          
          .copy-button {
            background: transparent;
            border: none;
            cursor: pointer;
            color: var(--text-color);
            opacity: 0.7;
            transition: opacity 0.2s;
          }
          
          .copy-button:hover {
            opacity: 1;
          }
        </style>
      </head>
      <body>
        <div class="sidebar">
          <div class="mb-6">
            <h1 class="text-2xl font-bold mb-1">${project.name}</h1>
            <p class="text-sm opacity-75">${project.description}</p>
          </div>
          
          <nav>
            <div class="mb-4">
              <h2 class="text-xs uppercase font-semibold opacity-60 mb-2">Documentation</h2>
              <a href="#overview" class="nav-link">Project Overview</a>
              ${options.includeArchitecture ? '<a href="#architecture" class="nav-link">Architecture</a>' : ''}
              ${options.includeDependencyMap ? '<a href="#dependencies" class="nav-link">Dependencies</a>' : ''}
              ${options.includeCodeExplanations ? '<a href="#code-explanations" class="nav-link">Code Explanations</a>' : ''}
            </div>
            
            ${options.includeSourceCode ? `
            <div class="mb-4">
              <h2 class="text-xs uppercase font-semibold opacity-60 mb-2">Source Code</h2>
              <div class="max-h-64 overflow-y-auto">
                ${generateFileTree(project.files)}
              </div>
            </div>
            ` : ''}
          </nav>
        </div>
        
        <div class="main-content">
          <section id="overview" class="mb-12">
            <h2 class="text-3xl font-bold mb-6">Project Overview</h2>
            <div class="card">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 class="text-xl font-semibold mb-4">Project Details</h3>
                  <ul class="space-y-2">
                    <li><strong>Name:</strong> ${project.name}</li>
                    <li><strong>Description:</strong> ${project.description}</li>
                    <li><strong>Total Files:</strong> ${project.totalFiles}</li>
                    <li><strong>Total Lines:</strong> ${project.totalLines || 'N/A'}</li>
                    <li><strong>Created:</strong> ${new Date(project.createdAt).toLocaleDateString()}</li>
                    <li><strong>Last Updated:</strong> ${new Date(project.updatedAt).toLocaleDateString()}</li>
                  </ul>
                </div>
                
                <div>
                  <h3 class="text-xl font-semibold mb-4">Project Structure</h3>
                  <p>This documentation provides an overview of the project's architecture, dependencies, and code explanations.</p>
                  <p class="mt-2">Use the navigation menu on the left to explore different sections of the documentation.</p>
                </div>
              </div>
            </div>
          </section>
          
          ${options.includeArchitecture && architectureData ? generateArchitectureSection(architectureData) : ''}
          
          ${options.includeDependencyMap && architectureData ? generateDependencySection(architectureData) : ''}
          
          ${options.includeCodeExplanations ? generateCodeExplanationsSection(project.files) : ''}
          
          ${options.includeSourceCode ? generateSourceCodeSection(project.files) : ''}
        </div>
        
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sun-icon">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="moon-icon" style="display: none;">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
        
        <script>
          // Initialize Mermaid diagrams
          mermaid.initialize({ 
            startOnLoad: true,
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
            flowchart: { 
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis'
            }
          });
          
          // Theme toggle functionality
          document.addEventListener('DOMContentLoaded', function() {
            const themeToggle = document.getElementById('theme-toggle');
            const sunIcon = document.querySelector('.sun-icon');
            const moonIcon = document.querySelector('.moon-icon');
            
            // Check for saved theme preference or use OS preference
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (savedTheme === 'dark' || (savedTheme !== 'light' && prefersDark)) {
              document.documentElement.classList.add('dark');
              sunIcon.style.display = 'none';
              moonIcon.style.display = 'block';
            }
            
            // Theme toggle click handler
            themeToggle.addEventListener('click', function() {
              document.documentElement.classList.toggle('dark');
              const isDark = document.documentElement.classList.contains('dark');
              
              localStorage.setItem('theme', isDark ? 'dark' : 'light');
              
              if (isDark) {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
                mermaid.initialize({ theme: 'dark' });
              } else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
                mermaid.initialize({ theme: 'default' });
              }
              
              // Re-render mermaid diagrams
              document.querySelectorAll('.mermaid').forEach(diagram => {
                const content = diagram.getAttribute('data-content');
                if (content) {
                  diagram.innerHTML = content;
                  mermaid.init(undefined, diagram);
                }
              });
            });
            
            // Copy code button functionality
            document.querySelectorAll('.copy-button').forEach(button => {
              button.addEventListener('click', function() {
                const codeBlock = this.closest('.code-block');
                const code = codeBlock.querySelector('code').innerText;
                
                navigator.clipboard.writeText(code).then(() => {
                  const originalText = this.innerHTML;
                  this.innerHTML = 'Copied!';
                  setTimeout(() => {
                    this.innerHTML = originalText;
                  }, 2000);
                });
              });
            });
          });
        </script>
      </body>
      </html>
    `;
    
    return html;
  };

  const generateFileTree = (files: CodeFile[]): string => {
    const renderFile = (file: CodeFile, level: number = 0): string => {
      const indent = '  '.repeat(level);
      const fileId = file.path.replace(/[^a-zA-Z0-9]/g, '-');
      
      if (file.type === 'folder') {
        let result = `${indent}<div class="mb-1">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            <span class="font-medium">${file.name}</span>
          </div>`;
        
        if (file.children && file.children.length > 0) {
          result += `<div class="pl-4 mt-1">`;
          file.children.forEach(child => {
            result += renderFile(child, level + 1);
          });
          result += `</div>`;
        }
        
        result += `</div>`;
        return result;
      } else {
        return `${indent}<div class="mb-1">
          <a href="#file-${fileId}" class="flex items-center nav-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span class="text-sm">${file.name}</span>
          </a>
        </div>`;
      }
    };
    
    let result = '';
    files.forEach(file => {
      result += renderFile(file);
    });
    
    return result;
  };

  const generateArchitectureSection = (architectureData: ArchitectureData): string => {
    return `
      <section id="architecture" class="mb-12">
        <h2 class="text-3xl font-bold mb-6">System Architecture</h2>
        
        <div class="card">
          <h3 class="text-xl font-semibold mb-4">System Overview</h3>
          <p class="mb-4">This diagram shows the high-level architecture of the system, including major components and their relationships.</p>
          
          <div class="mermaid" data-content="graph TB
            subgraph presentation["Presentation Layer"]
              UI["User Interface Components"]
              Pages["Page Components"]
            end
            
            subgraph business["Business Layer"]
              Services["Services"]
              Logic["Business Logic"]
            end
            
            subgraph data["Data Layer"]
              API["API Clients"]
              Models["Data Models"]
            end
            
            UI --> Pages
            Pages --> Services
            Services --> Logic
            Logic --> API
            API --> Models
            
            classDef presentation fill:#e1f5fe,stroke:#01579b,stroke-width:2px
            classDef business fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
            classDef data fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
            
            class UI,Pages presentation
            class Services,Logic business
            class API,Models data">
            graph TB
              subgraph presentation["Presentation Layer"]
                UI["User Interface Components"]
                Pages["Page Components"]
              end
              
              subgraph business["Business Layer"]
                Services["Services"]
                Logic["Business Logic"]
              end
              
              subgraph data["Data Layer"]
                API["API Clients"]
                Models["Data Models"]
              end
              
              UI --> Pages
              Pages --> Services
              Services --> Logic
              Logic --> API
              API --> Models
              
              classDef presentation fill:#e1f5fe,stroke:#01579b,stroke-width:2px
              classDef business fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
              classDef data fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
              
              class UI,Pages presentation
              class Services,Logic business
              class API,Models data
          </div>
        </div>
        
        <div class="card mt-6">
          <h3 class="text-xl font-semibold mb-4">Component Structure</h3>
          <p class="mb-4">This diagram shows the detailed component structure of the application.</p>
          
          <div class="mermaid" data-content="graph TD
            App["App Component"]
            Header["Header"]
            TreeView["TreeView"]
            CodeViewer["CodeViewer"]
            UploadModal["UploadModal"]
            ArchitectureAnalysis["ArchitectureAnalysis"]
            
            App --> Header
            App --> TreeView
            App --> CodeViewer
            App --> UploadModal
            App --> ArchitectureAnalysis
            
            classDef component fill:#e1f5fe,stroke:#01579b,stroke-width:2px
            
            class App,Header,TreeView,CodeViewer,UploadModal,ArchitectureAnalysis component">
            graph TD
              App["App Component"]
              Header["Header"]
              TreeView["TreeView"]
              CodeViewer["CodeViewer"]
              UploadModal["UploadModal"]
              ArchitectureAnalysis["ArchitectureAnalysis"]
              
              App --> Header
              App --> TreeView
              App --> CodeViewer
              App --> UploadModal
              App --> ArchitectureAnalysis
              
              classDef component fill:#e1f5fe,stroke:#01579b,stroke-width:2px
              
              class App,Header,TreeView,CodeViewer,UploadModal,ArchitectureAnalysis component
          </div>
        </div>
      </section>
    `;
  };

  const generateDependencySection = (architectureData: ArchitectureData): string => {
    return `
      <section id="dependencies" class="mb-12">
        <h2 class="text-3xl font-bold mb-6">Dependency Map</h2>
        
        <div class="card">
          <h3 class="text-xl font-semibold mb-4">Component Dependencies</h3>
          <p class="mb-4">This diagram shows the dependencies between major components in the system.</p>
          
          <div class="mermaid" data-content="graph LR
            App["App"]
            AuthContext["AuthContext"]
            ThemeContext["ThemeContext"]
            NotificationContext["NotificationContext"]
            
            Components["UI Components"]
            Services["Services"]
            Utils["Utilities"]
            
            App --> AuthContext
            App --> ThemeContext
            App --> NotificationContext
            App --> Components
            Components --> Services
            Components --> Utils
            Services --> Utils
            
            classDef context fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
            classDef component fill:#e1f5fe,stroke:#01579b,stroke-width:2px
            classDef service fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
            classDef util fill:#fff3e0,stroke:#e65100,stroke-width:2px
            
            class App component
            class AuthContext,ThemeContext,NotificationContext context
            class Components component
            class Services service
            class Utils util">
            graph LR
              App["App"]
              AuthContext["AuthContext"]
              ThemeContext["ThemeContext"]
              NotificationContext["NotificationContext"]
              
              Components["UI Components"]
              Services["Services"]
              Utils["Utilities"]
              
              App --> AuthContext
              App --> ThemeContext
              App --> NotificationContext
              App --> Components
              Components --> Services
              Components --> Utils
              Services --> Utils
              
              classDef context fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
              classDef component fill:#e1f5fe,stroke:#01579b,stroke-width:2px
              classDef service fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
              classDef util fill:#fff3e0,stroke:#e65100,stroke-width:2px
              
              class App component
              class AuthContext,ThemeContext,NotificationContext context
              class Components component
              class Services service
              class Utils util
          </div>
        </div>
        
        <div class="card mt-6">
          <h3 class="text-xl font-semibold mb-4">External Dependencies</h3>
          <p class="mb-4">Key external libraries and frameworks used in this project:</p>
          
          <ul class="space-y-2">
            <li><strong>React:</strong> Frontend UI library</li>
            <li><strong>Firebase:</strong> Authentication and database</li>
            <li><strong>Tailwind CSS:</strong> Utility-first CSS framework</li>
            <li><strong>Lucide React:</strong> Icon library</li>
            <li><strong>Mermaid:</strong> Diagramming and charting library</li>
            <li><strong>D3.js:</strong> Data visualization library</li>
            <li><strong>Tree-sitter:</strong> Parser for code analysis</li>
          </ul>
        </div>
      </section>
    `;
  };

  const generateCodeExplanationsSection = (files: CodeFile[]): string => {
    // Find files with explanations
    const filesWithExplanations = findFilesWithExplanations(files);
    
    if (filesWithExplanations.length === 0) {
      return `
        <section id="code-explanations" class="mb-12">
          <h2 class="text-3xl font-bold mb-6">Code Explanations</h2>
          
          <div class="card">
            <p>No code explanations are available for this project yet. Analyze files to generate explanations.</p>
          </div>
        </section>
      `;
    }
    
    return `
      <section id="code-explanations" class="mb-12">
        <h2 class="text-3xl font-bold mb-6">Code Explanations</h2>
        
        ${filesWithExplanations.map(file => `
          <div class="card">
            <h3 class="text-xl font-semibold mb-4">${file.name}</h3>
            <p class="mb-4">${file.explanation || 'No explanation available.'}</p>
            
            ${file.content ? `
              <div class="code-block">
                <div class="code-block-header">
                  <span>${file.name}</span>
                  <button class="copy-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                </div>
                <pre><code class="language-${file.language || 'javascript'}">${escapeHtml(file.content)}</code></pre>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </section>
    `;
  };

  const generateSourceCodeSection = (files: CodeFile[]): string => {
    const flattenFiles = (files: CodeFile[]): CodeFile[] => {
      let result: CodeFile[] = [];
      
      files.forEach(file => {
        if (file.type === 'file') {
          result.push(file);
        }
        
        if (file.children && file.children.length > 0) {
          result = result.concat(flattenFiles(file.children));
        }
      });
      
      return result;
    };
    
    const allFiles = flattenFiles(files);
    
    return `
      <section id="source-code" class="mb-12">
        <h2 class="text-3xl font-bold mb-6">Source Code</h2>
        
        ${allFiles.map(file => {
          const fileId = file.path.replace(/[^a-zA-Z0-9]/g, '-');
          return `
            <div class="card" id="file-${fileId}">
              <h3 class="text-xl font-semibold mb-4">${file.path}</h3>
              
              ${file.content ? `
                <div class="code-block">
                  <div class="code-block-header">
                    <span>${file.name}</span>
                    <button class="copy-button">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                  <pre><code class="language-${file.language || 'javascript'}">${escapeHtml(file.content)}</code></pre>
                </div>
              ` : '<p>No content available for this file.</p>'}
            </div>
          `;
        }).join('')}
      </section>
    `;
  };

  // Helper functions
  const findFilesWithExplanations = (files: CodeFile[]): CodeFile[] => {
    const result: CodeFile[] = [];
    
    const processFile = (file: CodeFile) => {
      if (file.type === 'file' && file.explanation) {
        result.push(file);
      }
      
      if (file.children) {
        file.children.forEach(processFile);
      }
    };
    
    files.forEach(processFile);
    
    return result;
  };

  const escapeHtml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Export Documentation</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Generate a comprehensive documentation site for your project
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Success Message */}
          {exportSuccess && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-3 text-green-800 dark:text-green-200">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Documentation exported successfully!</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {exportError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-3 text-red-800 dark:text-red-200">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{exportError}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Project Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Project Information</h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                    Exporting documentation for <strong>{project.name}</strong>
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                    {project.totalFiles} files • {project.totalLines || 'N/A'} lines of code
                  </p>
                </div>
              </div>
            </div>

            {/* Content Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Options</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeOverview}
                    onChange={(e) => handleOptionChange('includeOverview', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Include Project Overview</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeArchitecture}
                    onChange={(e) => handleOptionChange('includeArchitecture', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Include Architecture Diagrams</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeDependencyMap}
                    onChange={(e) => handleOptionChange('includeDependencyMap', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Include Dependency Map</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeCodeExplanations}
                    onChange={(e) => handleOptionChange('includeCodeExplanations', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Include Code Explanations</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeSourceCode}
                    onChange={(e) => handleOptionChange('includeSourceCode', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Include Source Code</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeReadme}
                    onChange={(e) => handleOptionChange('includeReadme', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Include README</span>
                </label>
              </div>
            </div>

            {/* Format Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Format Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Output Format
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value="html"
                        checked={exportOptions.format === 'html'}
                        onChange={() => handleOptionChange('format', 'html')}
                        className="mr-2"
                      />
                      <Code className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="text-gray-700 dark:text-gray-300">HTML (Single Page)</span>
                    </label>
                    <label className="flex items-center text-gray-500 dark:text-gray-400">
                      <input
                        type="radio"
                        name="format"
                        value="markdown"
                        disabled
                        className="mr-2"
                      />
                      <FileText className="w-4 h-4 mr-2" />
                      <span>Markdown (Coming Soon)</span>
                    </label>
                    <label className="flex items-center text-gray-500 dark:text-gray-400">
                      <input
                        type="radio"
                        name="format"
                        value="pdf"
                        disabled
                        className="mr-2"
                      />
                      <Download className="w-4 h-4 mr-2" />
                      <span>PDF (Coming Soon)</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={exportOptions.theme === 'light'}
                        onChange={() => handleOptionChange('theme', 'light')}
                        className="mr-2"
                      />
                      <Sun className="w-4 h-4 mr-2 text-amber-500" />
                      <span className="text-gray-700 dark:text-gray-300">Light</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={exportOptions.theme === 'dark'}
                        onChange={() => handleOptionChange('theme', 'dark')}
                        className="mr-2"
                      />
                      <Moon className="w-4 h-4 mr-2 text-indigo-500" />
                      <span className="text-gray-700 dark:text-gray-300">Dark</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="theme"
                        value="auto"
                        checked={exportOptions.theme === 'auto'}
                        onChange={() => handleOptionChange('theme', 'auto')}
                        className="mr-2"
                      />
                      <Settings className="w-4 h-4 mr-2 text-purple-500" />
                      <span className="text-gray-700 dark:text-gray-300">Auto (User Preference)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documentation Preview</h3>
              
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{project.name} Documentation</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Generated by Codeoscope</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white mb-2">Navigation</div>
                    <div className="space-y-1 text-sm">
                      <div className="text-blue-600 dark:text-blue-400">Overview</div>
                      {exportOptions.includeArchitecture && <div className="text-gray-700 dark:text-gray-300">Architecture</div>}
                      {exportOptions.includeDependencyMap && <div className="text-gray-700 dark:text-gray-300">Dependencies</div>}
                      {exportOptions.includeCodeExplanations && <div className="text-gray-700 dark:text-gray-300">Code Explanations</div>}
                      {exportOptions.includeSourceCode && <div className="text-gray-700 dark:text-gray-300">Source Code</div>}
                    </div>
                  </div>
                  
                  <div className="col-span-3 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white mb-2">Content Preview</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p>Project overview with key metrics and structure information.</p>
                      {exportOptions.includeArchitecture && (
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                          [Architecture Diagram]
                        </div>
                      )}
                      {exportOptions.includeCodeExplanations && (
                        <p className="mt-2">Code explanations with syntax highlighting and annotations.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Documentation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDocumentationModal;