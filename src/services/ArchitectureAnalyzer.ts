import Loki from 'lokijs';
import { ComponentNode, SystemBoundary, ArchitectureData, Relationship, AnalysisProgress } from '../types/architecture';

export class ArchitectureAnalyzer {
  private db: Loki;
  private components: Collection<ComponentNode>;
  private relationships: Collection<Relationship>;
  private progressCallback?: (progress: AnalysisProgress) => void;

  constructor() {
    // Initialize LokiJS database
    this.db = new Loki('architecture.db');
    this.components = this.db.addCollection('components');
    this.relationships = this.db.addCollection('relationships');
  }

  setProgressCallback(callback: (progress: AnalysisProgress) => void) {
    this.progressCallback = callback;
  }

  private updateProgress(stage: AnalysisProgress['stage'], progress: number, message: string, currentFile?: string) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message, currentFile });
    }
  }

  async analyzeRepository(repoUrl: string, githubToken?: string): Promise<ArchitectureData> {
    this.updateProgress('fetching', 0, 'Fetching repository structure...');
    
    try {
      // Clear previous analysis
      this.components.clear();
      this.relationships.clear();

      // Parse GitHub URL
      const repoInfo = this.parseGithubUrl(repoUrl);
      if (!repoInfo) {
        throw new Error('Invalid GitHub URL');
      }

      // Fetch repository tree
      const tree = await this.fetchRepositoryTree(repoInfo, githubToken);
      this.updateProgress('fetching', 30, 'Repository structure fetched');

      // Filter relevant files
      const relevantFiles = this.filterRelevantFiles(tree);
      this.updateProgress('parsing', 40, `Found ${relevantFiles.length} files to analyze`);

      // Analyze files
      let processedFiles = 0;
      for (const file of relevantFiles) {
        this.updateProgress('parsing', 40 + (processedFiles / relevantFiles.length) * 40, 
          'Analyzing files...', file.path);
        
        await this.analyzeFile(file, repoInfo, githubToken);
        processedFiles++;
      }

      this.updateProgress('analyzing', 80, 'Building component relationships...');
      
      // Build relationships
      this.buildRelationships();
      
      this.updateProgress('generating', 90, 'Generating architecture data...');
      
      // Generate system boundaries
      const boundaries = this.generateSystemBoundaries();
      
      // Prepare final data
      const architectureData: ArchitectureData = {
        components: this.components.find(),
        boundaries,
        relationships: this.relationships.find(),
        metadata: {
          totalFiles: relevantFiles.length,
          totalComponents: this.components.count(),
          analysisDate: new Date().toISOString(),
          repositoryUrl: repoUrl,
          mainLanguages: this.getMainLanguages(relevantFiles)
        }
      };

      this.updateProgress('complete', 100, 'Analysis complete');
      return architectureData;

    } catch (error) {
      console.error('Architecture analysis failed:', error);
      throw error;
    }
  }

  private parseGithubUrl(url: string) {
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
  }

  private async fetchRepositoryTree(repoInfo: any, githubToken?: string) {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (githubToken?.trim()) {
      headers['Authorization'] = `token ${githubToken.trim()}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/git/trees/${repoInfo.branch}?recursive=1`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch repository tree: ${response.status}`);
    }

    const data = await response.json();
    return data.tree;
  }

  private filterRelevantFiles(tree: any[]) {
    const relevantExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.json', '.md', '.yml', '.yaml'];
    const skipPatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.next/,
      /\.nuxt/,
      /\.vscode/,
      /\.idea/,
      /package-lock\.json/,
      /yarn\.lock/
    ];

    return tree.filter(item => {
      if (item.type !== 'blob') return false;
      
      const hasRelevantExtension = relevantExtensions.some(ext => item.path.endsWith(ext));
      const shouldSkip = skipPatterns.some(pattern => pattern.test(item.path));
      
      return hasRelevantExtension && !shouldSkip;
    });
  }

  private async analyzeFile(file: any, repoInfo: any, githubToken?: string) {
    try {
      const content = await this.fetchFileContent(file.path, repoInfo, githubToken);
      const extension = file.path.split('.').pop()?.toLowerCase();
      
      let components: ComponentNode[] = [];
      
      if (['js', 'jsx', 'ts', 'tsx'].includes(extension || '')) {
        components = this.parseJavaScriptFile(content, file.path);
      } else if (extension === 'py') {
        components = this.parsePythonFile(content, file.path);
      } else if (extension === 'json') {
        components = this.parseConfigFile(content, file.path);
      } else if (['md', 'yml', 'yaml'].includes(extension || '')) {
        components = this.parseDocumentationFile(content, file.path);
      }

      // Store components in database
      components.forEach(component => {
        this.components.insert(component);
      });

    } catch (error) {
      console.warn(`Failed to analyze file ${file.path}:`, error);
    }
  }

  private async fetchFileContent(path: string, repoInfo: any, githubToken?: string): Promise<string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (githubToken?.trim()) {
      headers['Authorization'] = `token ${githubToken.trim()}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${path}?ref=${repoInfo.branch}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.status}`);
    }

    const data = await response.json();
    return atob(data.content.replace(/\n/g, ''));
  }

  private parseJavaScriptFile(content: string, filePath: string): ComponentNode[] {
    const components: ComponentNode[] = [];
    const lines = content.split('\n');
    
    try {
      // Extract imports using regex
      const imports = this.extractImportsRegex(content);
      const exports = this.extractExportsRegex(content);
      
      // Extract classes using regex
      const classes = this.extractClassesRegex(content, filePath);
      components.push(...classes);
      
      // Extract functions using regex
      const functions = this.extractFunctionsRegex(content, filePath);
      components.push(...functions);
      
      // Create module component
      const moduleComponent: ComponentNode = {
        id: `module_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'unknown',
        type: 'module',
        file: filePath,
        dependencies: imports,
        exports,
        imports,
        layer: this.determineLayer(filePath),
        complexity: this.calculateComplexityRegex(content),
        lines: lines.length
      };
      
      components.push(moduleComponent);
      
    } catch (error) {
      console.warn(`Failed to parse JavaScript file ${filePath}:`, error);
    }
    
    return components;
  }

  private parsePythonFile(content: string, filePath: string): ComponentNode[] {
    const components: ComponentNode[] = [];
    const lines = content.split('\n');
    
    try {
      // Extract imports using regex
      const imports = this.extractPythonImportsRegex(content);
      
      // Extract classes using regex
      const classes = this.extractPythonClassesRegex(content, filePath);
      components.push(...classes);
      
      // Extract functions using regex
      const functions = this.extractPythonFunctionsRegex(content, filePath);
      components.push(...functions);
      
      // Create module component
      const moduleComponent: ComponentNode = {
        id: `module_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'unknown',
        type: 'module',
        file: filePath,
        dependencies: imports,
        exports: [],
        imports,
        layer: this.determineLayer(filePath),
        complexity: this.calculateComplexityRegex(content),
        lines: lines.length
      };
      
      components.push(moduleComponent);
      
    } catch (error) {
      console.warn(`Failed to parse Python file ${filePath}:`, error);
    }
    
    return components;
  }

  private parseConfigFile(content: string, filePath: string): ComponentNode[] {
    try {
      const config = JSON.parse(content);
      const component: ComponentNode = {
        id: `config_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: filePath.split('/').pop() || 'config',
        type: 'config',
        file: filePath,
        dependencies: this.extractConfigDependencies(config),
        exports: [],
        imports: [],
        layer: 'infrastructure',
        complexity: Object.keys(config).length,
        lines: content.split('\n').length
      };
      
      return [component];
    } catch (error) {
      return [];
    }
  }

  private parseDocumentationFile(content: string, filePath: string): ComponentNode[] {
    const component: ComponentNode = {
      id: `doc_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: filePath.split('/').pop() || 'documentation',
      type: 'component',
      file: filePath,
      dependencies: [],
      exports: [],
      imports: [],
      layer: 'infrastructure',
      complexity: 1,
      lines: content.split('\n').length
    };
    
    return [component];
  }

  private extractImportsRegex(content: string): string[] {
    const imports: string[] = [];
    
    // Match ES6 imports
    const es6ImportRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Match CommonJS requires
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  private extractExportsRegex(content: string): string[] {
    const exports: string[] = [];
    
    // Match named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Match default exports
    const defaultExportRegex = /export\s+default\s+(?:class|function)?\s*(\w+)?/g;
    while ((match = defaultExportRegex.exec(content)) !== null) {
      if (match[1]) {
        exports.push(match[1]);
      }
    }
    
    return exports;
  }

  private extractClassesRegex(content: string, filePath: string): ComponentNode[] {
    const classes: ComponentNode[] = [];
    const classRegex = /class\s+(\w+)(?:\s+extends\s+\w+)?\s*{/g;
    
    let match;
    let matchIndex = 0;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const startLine = content.substring(0, match.index).split('\n').length;
      
      classes.push({
        id: `class_${filePath}_${className}_${startLine}_${matchIndex}`.replace(/[^a-zA-Z0-9_]/g, '_'),
        name: className,
        type: 'class',
        file: filePath,
        dependencies: [],
        exports: [className],
        imports: [],
        layer: this.determineLayer(filePath),
        complexity: this.calculateComplexityRegex(match[0]),
        lines: match[0].split('\n').length
      });
      
      matchIndex++;
    }
    
    return classes;
  }

  private extractFunctionsRegex(content: string, filePath: string): ComponentNode[] {
    const functions: ComponentNode[] = [];
    
    // Match function declarations
    const funcDeclRegex = /function\s+(\w+)\s*\(/g;
    let match;
    let matchIndex = 0;
    while ((match = funcDeclRegex.exec(content)) !== null) {
      const funcName = match[1];
      const startLine = content.substring(0, match.index).split('\n').length;
      
      functions.push({
        id: `func_${filePath}_${funcName}_${startLine}_${matchIndex}`.replace(/[^a-zA-Z0-9_]/g, '_'),
        name: funcName,
        type: 'function',
        file: filePath,
        dependencies: [],
        exports: [funcName],
        imports: [],
        layer: this.determineLayer(filePath),
        complexity: 1,
        lines: 1
      });
      
      matchIndex++;
    }
    
    // Match arrow functions and const functions
    const arrowFuncRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/g;
    matchIndex = 0;
    while ((match = arrowFuncRegex.exec(content)) !== null) {
      const funcName = match[1];
      const startLine = content.substring(0, match.index).split('\n').length;
      
      functions.push({
        id: `arrow_func_${filePath}_${funcName}_${startLine}_${matchIndex}`.replace(/[^a-zA-Z0-9_]/g, '_'),
        name: funcName,
        type: 'function',
        file: filePath,
        dependencies: [],
        exports: [funcName],
        imports: [],
        layer: this.determineLayer(filePath),
        complexity: 1,
        lines: 1
      });
      
      matchIndex++;
    }
    
    return functions;
  }

  private extractPythonImportsRegex(content: string): string[] {
    const imports: string[] = [];
    
    // Match import statements
    const importRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1] || match[2]);
    }
    
    return imports;
  }

  private extractPythonClassesRegex(content: string, filePath: string): ComponentNode[] {
    const classes: ComponentNode[] = [];
    const classRegex = /class\s+(\w+)(?:\([^)]*\))?\s*:/g;
    
    let match;
    let matchIndex = 0;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const startLine = content.substring(0, match.index).split('\n').length;
      
      classes.push({
        id: `py_class_${filePath}_${className}_${startLine}_${matchIndex}`.replace(/[^a-zA-Z0-9_]/g, '_'),
        name: className,
        type: 'class',
        file: filePath,
        dependencies: [],
        exports: [className],
        imports: [],
        layer: this.determineLayer(filePath),
        complexity: 1,
        lines: 1
      });
      
      matchIndex++;
    }
    
    return classes;
  }

  private extractPythonFunctionsRegex(content: string, filePath: string): ComponentNode[] {
    const functions: ComponentNode[] = [];
    const funcRegex = /def\s+(\w+)\s*\(/g;
    
    let match;
    let matchIndex = 0;
    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[1];
      const startLine = content.substring(0, match.index).split('\n').length;
      
      functions.push({
        id: `py_func_${filePath}_${funcName}_${startLine}_${matchIndex}`.replace(/[^a-zA-Z0-9_]/g, '_'),
        name: funcName,
        type: 'function',
        file: filePath,
        dependencies: [],
        exports: [funcName],
        imports: [],
        layer: this.determineLayer(filePath),
        complexity: 1,
        lines: 1
      });
      
      matchIndex++;
    }
    
    return functions;
  }

  private extractConfigDependencies(config: any): string[] {
    const dependencies: string[] = [];
    
    if (config.dependencies) {
      dependencies.push(...Object.keys(config.dependencies));
    }
    
    if (config.devDependencies) {
      dependencies.push(...Object.keys(config.devDependencies));
    }
    
    return dependencies;
  }

  private determineLayer(filePath: string): ComponentNode['layer'] {
    if (filePath.includes('/components/') || filePath.includes('/pages/') || filePath.includes('/views/')) {
      return 'presentation';
    }
    if (filePath.includes('/services/') || filePath.includes('/business/') || filePath.includes('/logic/')) {
      return 'business';
    }
    if (filePath.includes('/data/') || filePath.includes('/models/') || filePath.includes('/repositories/')) {
      return 'data';
    }
    if (filePath.includes('/config/') || filePath.includes('/utils/') || filePath.includes('/infrastructure/')) {
      return 'infrastructure';
    }
    return 'business';
  }

  private calculateComplexityRegex(content: string): number {
    let complexity = 1;
    
    // Count control flow statements
    const controlFlowRegex = /\b(if|while|for|switch|case|catch|&&|\|\|)\b/g;
    const matches = content.match(controlFlowRegex);
    if (matches) {
      complexity += matches.length;
    }
    
    return complexity;
  }

  private buildRelationships() {
    const components = this.components.find();
    
    components.forEach(component => {
      component.dependencies.forEach(dep => {
        const targetComponent = components.find(c => 
          c.name === dep || c.file.includes(dep) || c.exports.includes(dep)
        );
        
        if (targetComponent) {
          this.relationships.insert({
            from: component.id,
            to: targetComponent.id,
            type: 'imports',
            weight: 1
          });
        }
      });
    });
  }

  private generateSystemBoundaries(): SystemBoundary[] {
    const boundaries: SystemBoundary[] = [];
    const components = this.components.find();
    
    // Group by layer
    const layerGroups = components.reduce((groups, component) => {
      if (!groups[component.layer]) {
        groups[component.layer] = [];
      }
      groups[component.layer].push(component.id);
      return groups;
    }, {} as Record<string, string[]>);
    
    Object.entries(layerGroups).forEach(([layer, componentIds]) => {
      boundaries.push({
        id: `boundary_${layer}`,
        name: `${layer.charAt(0).toUpperCase() + layer.slice(1)} Layer`,
        components: componentIds,
        type: 'container',
        description: `Components in the ${layer} layer`
      });
    });
    
    return boundaries;
  }

  private getMainLanguages(files: any[]): string[] {
    const languageCounts = files.reduce((counts, file) => {
      const ext = file.path.split('.').pop()?.toLowerCase();
      if (ext) {
        counts[ext] = (counts[ext] || 0) + 1;
      }
      return counts;
    }, {} as Record<string, number>);
    
    return Object.entries(languageCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([lang]) => lang);
  }
}