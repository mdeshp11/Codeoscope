import Loki from 'lokijs';
import { ComponentNode, SystemBoundary, ArchitectureData, Relationship, AnalysisProgress } from '../types/architecture';
import { CodeFile } from '../types';

export class LocalRepositoryAnalyzer {
  private db: Loki;
  private components: Collection<ComponentNode>;
  private relationships: Collection<Relationship>;
  private progressCallback?: (progress: AnalysisProgress) => void;

  constructor() {
    this.db = new Loki('local-architecture.db');
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

  async analyzeLocalRepository(files: CodeFile[], projectName: string): Promise<ArchitectureData> {
    this.updateProgress('parsing', 0, 'Starting enhanced local repository analysis...');
    
    try {
      // Clear previous analysis
      this.components.clear();
      this.relationships.clear();

      // Filter relevant files for analysis
      const relevantFiles = this.filterRelevantFiles(files);
      this.updateProgress('parsing', 20, `Found ${relevantFiles.length} files to analyze`);

      // Analyze each file with enhanced detail
      let processedFiles = 0;
      for (const file of relevantFiles) {
        this.updateProgress('parsing', 20 + (processedFiles / relevantFiles.length) * 50, 
          'Analyzing files with enhanced detail...', file.path);
        
        await this.analyzeLocalFileEnhanced(file);
        processedFiles++;
      }

      this.updateProgress('analyzing', 70, 'Building component relationships...');
      
      // Build relationships between components
      this.buildRelationships();
      
      this.updateProgress('analyzing', 85, 'Generating detailed AI summaries...');
      
      // Generate enhanced AI summaries for components
      await this.generateEnhancedAISummaries();
      
      this.updateProgress('generating', 95, 'Creating system boundaries...');
      
      // Generate system boundaries
      const boundaries = this.generateSystemBoundaries();
      
      // Prepare final architecture data
      const architectureData: ArchitectureData = {
        components: this.components.find(),
        boundaries,
        relationships: this.relationships.find(),
        metadata: {
          totalFiles: relevantFiles.length,
          totalComponents: this.components.count(),
          analysisDate: new Date().toISOString(),
          repositoryUrl: `local://${projectName}`,
          mainLanguages: this.getMainLanguages(relevantFiles)
        }
      };

      this.updateProgress('complete', 100, 'Enhanced local analysis complete');
      return architectureData;

    } catch (error) {
      console.error('Enhanced local repository analysis failed:', error);
      throw error;
    }
  }

  private filterRelevantFiles(files: CodeFile[]): CodeFile[] {
    const relevantExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.cpp', '.c', '.h', '.hpp', '.json', '.md', '.yml', '.yaml', '.css', '.scss', '.html'];
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

    const flattenFiles = (fileList: CodeFile[]): CodeFile[] => {
      const result: CodeFile[] = [];
      
      for (const file of fileList) {
        if (file.type === 'file') {
          result.push(file);
        } else if (file.children) {
          result.push(...flattenFiles(file.children));
        }
      }
      
      return result;
    };

    const allFiles = flattenFiles(files);
    
    return allFiles.filter(file => {
      if (file.type !== 'file') return false;
      
      const hasRelevantExtension = relevantExtensions.some(ext => file.name.endsWith(ext));
      const shouldSkip = skipPatterns.some(pattern => pattern.test(file.path));
      
      return hasRelevantExtension && !shouldSkip;
    });
  }

  private async analyzeLocalFileEnhanced(file: CodeFile) {
    if (!file.content) return;

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let components: ComponentNode[] = [];
      
      if (['js', 'jsx', 'ts', 'tsx'].includes(extension || '')) {
        components = this.parseJavaScriptFileEnhanced(file.content, file.path);
      } else if (extension === 'py') {
        components = this.parsePythonFileEnhanced(file.content, file.path);
      } else if (['cpp', 'c', 'h', 'hpp'].includes(extension || '')) {
        components = this.parseCppFileEnhanced(file.content, file.path);
      } else if (extension === 'json') {
        components = this.parseConfigFileEnhanced(file.content, file.path);
      } else if (['css', 'scss'].includes(extension || '')) {
        components = this.parseStyleFileEnhanced(file.content, file.path);
      } else if (extension === 'html') {
        components = this.parseHtmlFileEnhanced(file.content, file.path);
      } else if (['md', 'yml', 'yaml'].includes(extension || '')) {
        components = this.parseDocumentationFileEnhanced(file.content, file.path);
      }

      // Store components in database
      components.forEach(component => {
        this.components.insert(component);
      });

    } catch (error) {
      console.warn(`Failed to analyze file ${file.path}:`, error);
    }
  }

  private parseJavaScriptFileEnhanced(content: string, filePath: string): ComponentNode[] {
    const components: ComponentNode[] = [];
    const lines = content.split('\n');
    
    try {
      // Enhanced analysis with detailed extraction
      const fileAnalysis = this.analyzeJavaScriptFileStructure(content);
      
      // Extract imports and exports with detailed analysis
      const imports = this.extractJSImportsEnhanced(content);
      const exports = this.extractJSExportsEnhanced(content);
      
      // Extract classes with enhanced details
      const classes = this.extractJSClassesEnhanced(content, filePath, fileAnalysis);
      components.push(...classes);
      
      // Extract functions with enhanced details
      const functions = this.extractJSFunctionsEnhanced(content, filePath, fileAnalysis);
      components.push(...functions);
      
      // Extract React components with enhanced details
      const reactComponents = this.extractReactComponentsEnhanced(content, filePath, fileAnalysis);
      components.push(...reactComponents);
      
      // Extract API calls and external integrations
      const apiCalls = this.extractAPICallsEnhanced(content, filePath);
      components.push(...apiCalls);
      
      // Create enhanced module component
      const moduleComponent: ComponentNode = {
        id: `module_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'unknown',
        type: 'module',
        file: filePath,
        dependencies: imports.map(imp => imp.source),
        exports: exports.map(exp => exp.name),
        imports: imports.map(imp => imp.source),
        layer: this.determineLayer(filePath),
        complexity: this.calculateComplexityEnhanced(content),
        lines: lines.length,
        description: this.generateModuleDescription(filePath, fileAnalysis, imports, exports)
      };
      
      components.push(moduleComponent);
      
    } catch (error) {
      console.warn(`Failed to parse JavaScript file ${filePath}:`, error);
    }
    
    return components;
  }

  private parsePythonFileEnhanced(content: string, filePath: string): ComponentNode[] {
    const components: ComponentNode[] = [];
    const lines = content.split('\n');
    
    try {
      const fileAnalysis = this.analyzePythonFileStructure(content);
      
      // Extract imports with enhanced details
      const imports = this.extractPythonImportsEnhanced(content);
      
      // Extract classes with enhanced details
      const classes = this.extractPythonClassesEnhanced(content, filePath, fileAnalysis);
      components.push(...classes);
      
      // Extract functions with enhanced details
      const functions = this.extractPythonFunctionsEnhanced(content, filePath, fileAnalysis);
      components.push(...functions);
      
      // Create enhanced module component
      const moduleComponent: ComponentNode = {
        id: `module_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'unknown',
        type: 'module',
        file: filePath,
        dependencies: imports.map(imp => imp.source),
        exports: [],
        imports: imports.map(imp => imp.source),
        layer: this.determineLayer(filePath),
        complexity: this.calculateComplexityEnhanced(content),
        lines: lines.length,
        description: this.generatePythonModuleDescription(filePath, fileAnalysis, imports)
      };
      
      components.push(moduleComponent);
      
    } catch (error) {
      console.warn(`Failed to parse Python file ${filePath}:`, error);
    }
    
    return components;
  }

  private parseCppFileEnhanced(content: string, filePath: string): ComponentNode[] {
    const components: ComponentNode[] = [];
    const lines = content.split('\n');
    
    try {
      const fileAnalysis = this.analyzeCppFileStructure(content);
      
      // Extract includes with enhanced details
      const includes = this.extractCppIncludesEnhanced(content);
      
      // Extract classes with enhanced details
      const classes = this.extractCppClassesEnhanced(content, filePath, fileAnalysis);
      components.push(...classes);
      
      // Extract functions with enhanced details
      const functions = this.extractCppFunctionsEnhanced(content, filePath, fileAnalysis);
      components.push(...functions);
      
      // Create enhanced module component
      const moduleComponent: ComponentNode = {
        id: `module_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'unknown',
        type: 'module',
        file: filePath,
        dependencies: includes.map(inc => inc.source),
        exports: [],
        imports: includes.map(inc => inc.source),
        layer: this.determineLayer(filePath),
        complexity: this.calculateComplexityEnhanced(content),
        lines: lines.length,
        description: this.generateCppModuleDescription(filePath, fileAnalysis, includes)
      };
      
      components.push(moduleComponent);
      
    } catch (error) {
      console.warn(`Failed to parse C++ file ${filePath}:`, error);
    }
    
    return components;
  }

  private parseConfigFileEnhanced(content: string, filePath: string): ComponentNode[] {
    try {
      const config = JSON.parse(content);
      const analysis = this.analyzeConfigStructure(config, filePath);
      
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
        lines: content.split('\n').length,
        description: this.generateConfigDescription(filePath, config, analysis)
      };
      
      return [component];
    } catch (error) {
      return [];
    }
  }

  private parseStyleFileEnhanced(content: string, filePath: string): ComponentNode[] {
    const analysis = this.analyzeStyleFileStructure(content);
    
    const component: ComponentNode = {
      id: `style_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: filePath.split('/').pop() || 'styles',
      type: 'component',
      file: filePath,
      dependencies: this.extractStyleDependencies(content),
      exports: [],
      imports: [],
      layer: 'presentation',
      complexity: analysis.ruleCount,
      lines: content.split('\n').length,
      description: this.generateStyleDescription(filePath, analysis)
    };
    
    return [component];
  }

  private parseHtmlFileEnhanced(content: string, filePath: string): ComponentNode[] {
    const analysis = this.analyzeHtmlFileStructure(content);
    
    const component: ComponentNode = {
      id: `html_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: filePath.split('/').pop() || 'page',
      type: 'component',
      file: filePath,
      dependencies: this.extractHtmlDependencies(content),
      exports: [],
      imports: [],
      layer: 'presentation',
      complexity: analysis.elementCount,
      lines: content.split('\n').length,
      description: this.generateHtmlDescription(filePath, analysis)
    };
    
    return [component];
  }

  private parseDocumentationFileEnhanced(content: string, filePath: string): ComponentNode[] {
    const analysis = this.analyzeDocumentationStructure(content, filePath);
    
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
      lines: content.split('\n').length,
      description: this.generateDocumentationDescription(filePath, analysis)
    };
    
    return [component];
  }

  // Enhanced analysis methods for JavaScript
  private analyzeJavaScriptFileStructure(content: string) {
    return {
      hasReactImports: /import.*react/i.test(content),
      hasStateManagement: /useState|useReducer|redux|zustand/i.test(content),
      hasAsyncOperations: /async|await|Promise|fetch|axios/i.test(content),
      hasEventHandlers: /addEventListener|onClick|onSubmit|onChange/i.test(content),
      hasDOMManipulation: /document\.|getElementById|querySelector/i.test(content),
      hasAPIIntegration: /fetch\(|axios\.|api\./i.test(content),
      hasDataProcessing: /map\(|filter\(|reduce\(|sort\(/i.test(content),
      hasValidation: /validate|schema|yup|joi/i.test(content),
      hasRouting: /router|route|navigate|Link/i.test(content),
      hasUtilities: /util|helper|format|parse/i.test(content),
      hasTestingCode: /test|spec|describe|it\(|expect/i.test(content),
      hasTypeDefinitions: /interface|type\s+\w+\s*=/i.test(content),
      hasHooks: /use[A-Z]\w*/g.exec(content)?.length || 0,
      componentCount: (content.match(/(?:function|const)\s+[A-Z]\w*|class\s+[A-Z]\w*/g) || []).length,
      functionCount: (content.match(/function\s+\w+|const\s+\w+\s*=.*=>/g) || []).length
    };
  }

  private analyzePythonFileStructure(content: string) {
    return {
      hasDataScience: /pandas|numpy|matplotlib|seaborn|sklearn/i.test(content),
      hasWebFramework: /flask|django|fastapi|tornado/i.test(content),
      hasAsyncOperations: /async|await|asyncio/i.test(content),
      hasFileOperations: /open\(|with\s+open|file\./i.test(content),
      hasDataProcessing: /\.map\(|\.filter\(|\.apply\(|\.groupby\(/i.test(content),
      hasAPIIntegration: /requests\.|urllib|httpx/i.test(content),
      hasDatabase: /sqlite|postgresql|mysql|mongodb/i.test(content),
      hasTestingCode: /unittest|pytest|test_|def test/i.test(content),
      hasLogging: /logging\.|logger\./i.test(content),
      hasConfigHandling: /config|settings|env/i.test(content),
      classCount: (content.match(/class\s+\w+/g) || []).length,
      functionCount: (content.match(/def\s+\w+/g) || []).length,
      decoratorCount: (content.match(/@\w+/g) || []).length
    };
  }

  private analyzeCppFileStructure(content: string) {
    return {
      hasSTL: /#include\s*<(vector|string|map|set|algorithm|iostream)/i.test(content),
      hasBoost: /#include\s*<boost/i.test(content),
      hasOpenCV: /#include\s*<opencv/i.test(content),
      hasQt: /#include\s*<Q\w+>/i.test(content),
      hasTemplates: /template\s*</i.test(content),
      hasNamespaces: /namespace\s+\w+/i.test(content),
      hasPointers: /\*\w+|\w+\*/g.test(content),
      hasMemoryManagement: /new\s+|delete\s+|malloc|free|shared_ptr|unique_ptr/i.test(content),
      hasThreading: /thread|mutex|lock|atomic/i.test(content),
      hasFileIO: /fstream|ifstream|ofstream|FILE\*/i.test(content),
      classCount: (content.match(/class\s+\w+/g) || []).length,
      functionCount: (content.match(/\w+\s+\w+\s*\([^)]*\)\s*{/g) || []).length,
      structCount: (content.match(/struct\s+\w+/g) || []).length
    };
  }

  private analyzeConfigStructure(config: any, filePath: string) {
    const isPackageJson = filePath.endsWith('package.json');
    const isTsConfig = filePath.includes('tsconfig');
    const isWebpackConfig = filePath.includes('webpack');
    
    return {
      isPackageJson,
      isTsConfig,
      isWebpackConfig,
      hasScripts: config.scripts && Object.keys(config.scripts).length > 0,
      hasDependencies: config.dependencies && Object.keys(config.dependencies).length > 0,
      hasDevDependencies: config.devDependencies && Object.keys(config.devDependencies).length > 0,
      dependencyCount: (config.dependencies ? Object.keys(config.dependencies).length : 0) +
                      (config.devDependencies ? Object.keys(config.devDependencies).length : 0),
      scriptCount: config.scripts ? Object.keys(config.scripts).length : 0,
      configKeys: Object.keys(config)
    };
  }

  private analyzeStyleFileStructure(content: string) {
    return {
      hasVariables: /--\w+:|@\w+:/g.test(content),
      hasMediaQueries: /@media/g.test(content),
      hasAnimations: /@keyframes|animation:|transition:/g.test(content),
      hasFlexbox: /display:\s*flex|flex-/g.test(content),
      hasGrid: /display:\s*grid|grid-/g.test(content),
      hasImports: /@import/g.test(content),
      ruleCount: (content.match(/[^{}]+\s*{[^{}]*}/g) || []).length,
      selectorCount: (content.match(/[^{}]+(?=\s*{)/g) || []).length,
      variableCount: (content.match(/--\w+:/g) || []).length
    };
  }

  private analyzeHtmlFileStructure(content: string) {
    return {
      hasScripts: /<script/i.test(content),
      hasStyles: /<style|<link.*stylesheet/i.test(content),
      hasForms: /<form/i.test(content),
      hasCanvas: /<canvas/i.test(content),
      hasVideo: /<video/i.test(content),
      hasAudio: /<audio/i.test(content),
      hasMetaTags: /<meta/i.test(content),
      elementCount: (content.match(/<\w+/g) || []).length,
      scriptCount: (content.match(/<script/g) || []).length,
      linkCount: (content.match(/<link/g) || []).length
    };
  }

  private analyzeDocumentationStructure(content: string, filePath: string) {
    const isReadme = /readme/i.test(filePath);
    const isChangelog = /changelog|changes/i.test(filePath);
    const isApiDoc = /api/i.test(filePath);
    
    return {
      isReadme,
      isChangelog,
      isApiDoc,
      hasCodeBlocks: /```|`[^`]+`/g.test(content),
      hasLinks: /\[.*\]\(.*\)|https?:\/\//g.test(content),
      hasImages: /!\[.*\]\(.*\)/g.test(content),
      hasTables: /\|.*\|/g.test(content),
      headingCount: (content.match(/^#+\s/gm) || []).length,
      linkCount: (content.match(/\[.*\]\(.*\)/g) || []).length,
      codeBlockCount: (content.match(/```/g) || []).length / 2
    };
  }

  // Enhanced extraction methods
  private extractJSImportsEnhanced(content: string) {
    const imports: Array<{source: string, type: string, items: string[]}> = [];
    
    // ES6 imports
    const es6ImportRegex = /import\s+(.*?)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      const importItems = match[1].replace(/[{}]/g, '').split(',').map(s => s.trim());
      imports.push({
        source: match[2],
        type: 'es6',
        items: importItems
      });
    }
    
    // CommonJS requires
    const requireRegex = /(?:const|let|var)\s+(.*?)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push({
        source: match[2],
        type: 'commonjs',
        items: [match[1]]
      });
    }
    
    return imports;
  }

  private extractJSExportsEnhanced(content: string) {
    const exports: Array<{name: string, type: string, isDefault: boolean}> = [];
    
    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push({
        name: match[1],
        type: 'named',
        isDefault: false
      });
    }
    
    // Default exports
    const defaultExportRegex = /export\s+default\s+(?:class|function)?\s*(\w+)?/g;
    while ((match = defaultExportRegex.exec(content)) !== null) {
      exports.push({
        name: match[1] || 'default',
        type: 'default',
        isDefault: true
      });
    }
    
    return exports;
  }

  private extractJSClassesEnhanced(content: string, filePath: string, analysis: any): ComponentNode[] {
    const classes: ComponentNode[] = [];
    const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g;
    
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const extendsClass = match[2];
      const classBody = match[3];
      
      const methods = this.extractClassMethods(classBody);
      const properties = this.extractClassProperties(classBody);
      
      classes.push({
        id: `class_${filePath}_${className}`.replace(/[^a-zA-Z0-9]/g, '_'),
        name: className,
        type: 'class',
        file: filePath,
        dependencies: extendsClass ? [extendsClass] : [],
        exports: [className],
        imports: [],
        layer: this.determineLayer(filePath),
        complexity: this.calculateMethodComplexity(classBody, className),
        lines: this.countClassLines(content, className),
        description: this.generateClassDescription(className, methods, properties, extendsClass, analysis)
      });
    }
    
    return classes;
  }

  private extractJSFunctionsEnhanced(content: string, filePath: string, analysis: any): ComponentNode[] {
    const functions: ComponentNode[] = [];
    
    // Function declarations
    const funcDeclRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g;
    let match;
    while ((match = funcDeclRegex.exec(content)) !== null) {
      const funcName = match[1];
      const params = match[2];
      const funcBody = match[3];
      
      functions.push({
        id: `func_${filePath}_${funcName}`.replace(/[^a-zA-Z0-9]/g, '_'),
        name: funcName,
        type: 'function',
        file: filePath,
        dependencies: this.extractFunctionDependencies(funcBody, funcName),
        exports: [funcName],
        imports: [],
        layer: this.determineLayer(filePath),
        complexity: this.calculateFunctionComplexity(funcBody, funcName),
        lines: this.countFunctionLines(content, funcName),
        description: this.generateFunctionDescription(funcName, params, funcBody, analysis)
      });
    }
    
    // Arrow functions and const functions
    const arrowFuncRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:\(([^)]*)\)\s*=>|async\s*\(([^)]*)\)\s*=>)\s*{?([^{}]*(?:{[^{}]*}[^{}]*)*)}?/g;
    while ((match = arrowFuncRegex.exec(content)) !== null) {
      const funcName = match[1];
      const params = match[2] || match[3] || '';
      const funcBody = match[4];
      
      functions.push({
        id: `func_${filePath}_${funcName}`.replace(/[^a-zA-Z0-9]/g, '_'),
        name: funcName,
        type: 'function',
        file: filePath,
        dependencies: this.extractFunctionDependencies(funcBody, funcName),
        exports: [funcName],
        imports: [],
        layer: this.determineLayer(filePath),
        complexity: this.calculateFunctionComplexity(funcBody, funcName),
        lines: this.countFunctionLines(content, funcName),
        description: this.generateFunctionDescription(funcName, params, funcBody, analysis)
      });
    }
    
    return functions;
  }

  private extractReactComponentsEnhanced(content: string, filePath: string, analysis: any): ComponentNode[] {
    const components: ComponentNode[] = [];
    
    // React functional components
    const reactFuncRegex = /(?:const|function)\s+([A-Z]\w*)\s*(?:\([^)]*\))?\s*(?::\s*React\.FC)?.*?=>\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}|(?:const|function)\s+([A-Z]\w*)\s*\([^)]*\)\s*{([^{}]*(?:{[^{}]*}[^{}]*)*return\s*\([^}]*)}/g;
    let match;
    while ((match = reactFuncRegex.exec(content)) !== null) {
      const componentName = match[1] || match[3];
      const componentBody = match[2] || match[4];
      
      if (componentName && /^[A-Z]/.test(componentName)) {
        const hooks = this.extractReactHooks(componentBody);
        const props = this.extractReactProps(componentBody);
        const jsx = this.analyzeJSXStructure(componentBody);
        
        components.push({
          id: `component_${filePath}_${componentName}`.replace(/[^a-zA-Z0-9]/g, '_'),
          name: componentName,
          type: 'component',
          file: filePath,
          dependencies: this.extractReactDependencies(componentBody, componentName),
          exports: [componentName],
          imports: [],
          layer: 'presentation',
          complexity: this.calculateComponentComplexity(componentBody, componentName),
          lines: this.countComponentLines(content, componentName),
          description: this.generateReactComponentDescription(componentName, hooks, props, jsx, analysis)
        });
      }
    }
    
    return components;
  }

  private extractAPICallsEnhanced(content: string, filePath: string): ComponentNode[] {
    const apiCalls: ComponentNode[] = [];
    
    // Extract fetch calls
    const fetchRegex = /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = fetchRegex.exec(content)) !== null) {
      const endpoint = match[1];
      
      apiCalls.push({
        id: `api_${filePath}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: `API: ${endpoint}`,
        type: 'service',
        file: filePath,
        dependencies: ['fetch'],
        exports: [],
        imports: [],
        layer: 'business',
        complexity: 2,
        lines: 1,
        description: `Makes HTTP requests to ${endpoint} endpoint for data retrieval and manipulation`
      });
    }
    
    return apiCalls;
  }

  // Enhanced description generators
  private generateModuleDescription(filePath: string, analysis: any, imports: any[], exports: any[]): string {
    const fileName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'module';
    const fileType = this.getFileTypeDescription(filePath);
    
    let description = `This ${fileType} module`;
    
    // Determine primary purpose based on analysis
    if (analysis.hasReactImports && analysis.componentCount > 0) {
      description += ` implements ${analysis.componentCount} React component${analysis.componentCount > 1 ? 's' : ''}`;
      if (analysis.hasStateManagement) description += ' with state management';
      if (analysis.hasRouting) description += ' and routing capabilities';
    } else if (analysis.hasAPIIntegration) {
      description += ` handles API integration and data communication`;
      if (analysis.hasDataProcessing) description += ', processing and transforming data';
    } else if (analysis.hasUtilities) {
      description += ` provides utility functions and helper methods`;
    } else if (analysis.hasTestingCode) {
      description += ` contains test cases and specifications`;
    } else {
      description += ` manages ${fileName} functionality`;
    }
    
    // Add specific capabilities
    const capabilities = [];
    if (analysis.hasAsyncOperations) capabilities.push('asynchronous operations');
    if (analysis.hasEventHandlers) capabilities.push('event handling');
    if (analysis.hasDOMManipulation) capabilities.push('DOM manipulation');
    if (analysis.hasValidation) capabilities.push('data validation');
    
    if (capabilities.length > 0) {
      description += `, implementing ${capabilities.join(', ')}`;
    }
    
    // Add import/export information
    if (imports.length > 0) {
      const mainImports = imports.slice(0, 3).map(imp => imp.source).join(', ');
      description += `. Imports from ${mainImports}`;
      if (imports.length > 3) description += ` and ${imports.length - 3} other modules`;
    }
    
    if (exports.length > 0) {
      description += ` and exports ${exports.map(exp => exp.name).join(', ')} for external use`;
    }
    
    return description + '.';
  }

  private generateClassDescription(className: string, methods: string[], properties: string[], extendsClass?: string, analysis?: any): string {
    let description = `Class ${className}`;
    
    if (extendsClass) {
      description += ` extends ${extendsClass} and`;
    }
    
    description += ` encapsulates object-oriented functionality with ${methods.length} method${methods.length !== 1 ? 's' : ''}`;
    
    if (properties.length > 0) {
      description += ` and ${properties.length} propert${properties.length !== 1 ? 'ies' : 'y'}`;
    }
    
    // Determine class purpose based on methods
    const hasConstructor = methods.includes('constructor');
    const hasGetters = methods.some(m => m.startsWith('get'));
    const hasSetters = methods.some(m => m.startsWith('set'));
    const hasProcessing = methods.some(m => m.includes('process') || m.includes('handle') || m.includes('execute'));
    
    if (hasConstructor) description += ', initializing instance state';
    if (hasGetters || hasSetters) description += ', providing data access methods';
    if (hasProcessing) description += ', handling business logic operations';
    
    return description + '. Designed for reusability and maintainability in object-oriented architecture.';
  }

  private generateFunctionDescription(funcName: string, params: string, funcBody: string, analysis: any): string {
    const paramCount = params ? params.split(',').length : 0;
    let description = `Function ${funcName}`;
    
    // Determine function purpose based on name and body
    if (funcName.startsWith('get') || funcName.startsWith('fetch')) {
      description += ` retrieves and returns data`;
    } else if (funcName.startsWith('set') || funcName.startsWith('update')) {
      description += ` modifies and updates data`;
    } else if (funcName.startsWith('process') || funcName.startsWith('handle')) {
      description += ` processes input data and performs operations`;
    } else if (funcName.startsWith('validate') || funcName.startsWith('check')) {
      description += ` validates input parameters and returns verification results`;
    } else if (funcName.startsWith('format') || funcName.startsWith('transform')) {
      description += ` transforms and formats data for presentation`;
    } else if (funcName.startsWith('calculate') || funcName.startsWith('compute')) {
      description += ` performs calculations and returns computed results`;
    } else {
      description += ` executes specialized functionality`;
    }
    
    if (paramCount > 0) {
      description += ` accepting ${paramCount} parameter${paramCount !== 1 ? 's' : ''}`;
    }
    
    // Add specific capabilities based on function body analysis
    if (/return\s+/.test(funcBody)) description += ', returning processed results';
    if (/async|await/.test(funcBody)) description += ' using asynchronous operations';
    if (/fetch|axios/.test(funcBody)) description += ' with external API communication';
    if (/console\.log|logger/.test(funcBody)) description += ' and includes logging for debugging';
    
    return description + '. Designed for modularity and reuse across the application.';
  }

  private generateReactComponentDescription(componentName: string, hooks: string[], props: any[], jsx: any, analysis: any): string {
    let description = `React component ${componentName} renders`;
    
    // Determine UI purpose based on JSX analysis
    if (jsx.hasForm) {
      description += ` an interactive form interface`;
    } else if (jsx.hasTable) {
      description += ` a data table with structured information`;
    } else if (jsx.hasList) {
      description += ` a dynamic list of items`;
    } else if (jsx.hasModal) {
      description += ` a modal dialog for user interaction`;
    } else {
      description += ` user interface elements`;
    }
    
    // Add state management information
    if (hooks.includes('useState')) {
      description += ` with local state management`;
    }
    if (hooks.includes('useEffect')) {
      description += ` and lifecycle effects`;
    }
    if (hooks.includes('useContext')) {
      description += ` utilizing React context`;
    }
    
    // Add interaction capabilities
    const interactions = [];
    if (jsx.hasButtons) interactions.push('button interactions');
    if (jsx.hasInputs) interactions.push('form inputs');
    if (jsx.hasLinks) interactions.push('navigation links');
    
    if (interactions.length > 0) {
      description += `, handling ${interactions.join(', ')}`;
    }
    
    // Add props information
    if (props.length > 0) {
      description += `. Accepts ${props.length} prop${props.length !== 1 ? 's' : ''} for customization`;
    }
    
    return description + '. Follows React best practices for component composition and reusability.';
  }

  private generatePythonModuleDescription(filePath: string, analysis: any, imports: any[]): string {
    const fileName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'module';
    let description = `Python module ${fileName}`;
    
    if (analysis.hasDataScience) {
      description += ` implements data science operations using pandas, numpy, and visualization libraries`;
    } else if (analysis.hasWebFramework) {
      description += ` provides web application functionality with Flask/Django framework`;
    } else if (analysis.hasDatabase) {
      description += ` manages database operations and data persistence`;
    } else if (analysis.hasAPIIntegration) {
      description += ` handles HTTP requests and API communication`;
    } else {
      description += ` provides specialized Python functionality`;
    }
    
    if (analysis.hasAsyncOperations) description += ' with asynchronous processing capabilities';
    if (analysis.hasFileOperations) description += ', file I/O operations';
    if (analysis.hasDataProcessing) description += ', and data transformation methods';
    if (analysis.hasLogging) description += '. Includes comprehensive logging for monitoring and debugging';
    
    return description + '. Designed following Python best practices and PEP standards.';
  }

  private generateCppModuleDescription(filePath: string, analysis: any, includes: any[]): string {
    const fileName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'module';
    const isHeader = filePath.endsWith('.h') || filePath.endsWith('.hpp');
    
    let description = `C++ ${isHeader ? 'header' : 'implementation'} file ${fileName}`;
    
    if (analysis.hasSTL) {
      description += ` utilizes Standard Template Library for data structures and algorithms`;
    } else if (analysis.hasOpenCV) {
      description += ` implements computer vision operations using OpenCV library`;
    } else if (analysis.hasQt) {
      description += ` provides GUI functionality with Qt framework`;
    } else {
      description += ` implements core C++ functionality`;
    }
    
    if (analysis.hasTemplates) description += ' with template-based generic programming';
    if (analysis.hasMemoryManagement) description += ', manual memory management';
    if (analysis.hasThreading) description += ', and multi-threading capabilities';
    if (analysis.hasFileIO) description += '. Includes file I/O operations for data persistence';
    
    return description + '. Follows modern C++ standards and best practices for performance and safety.';
  }

  private generateConfigDescription(filePath: string, config: any, analysis: any): string {
    const fileName = filePath.split('/').pop() || 'configuration';
    
    if (analysis.isPackageJson) {
      return `Package.json configuration file defining project metadata, ${analysis.dependencyCount} dependencies, and ${analysis.scriptCount} build scripts. Manages Node.js project structure, version control, and development workflow automation.`;
    } else if (analysis.isTsConfig) {
      return `TypeScript configuration file specifying compiler options, module resolution, and build settings. Defines type checking rules, output directories, and development environment setup for TypeScript compilation.`;
    } else if (analysis.isWebpackConfig) {
      return `Webpack configuration file defining module bundling, asset processing, and build optimization. Configures entry points, loaders, plugins, and output settings for web application deployment.`;
    } else {
      return `Configuration file ${fileName} containing ${Object.keys(config).length} settings and parameters. Defines application behavior, environment variables, and system configuration for runtime execution.`;
    }
  }

  private generateStyleDescription(filePath: string, analysis: any): string {
    const fileName = filePath.split('/').pop() || 'styles';
    const isScss = filePath.endsWith('.scss');
    
    let description = `${isScss ? 'SCSS' : 'CSS'} stylesheet ${fileName} defines visual presentation with ${analysis.ruleCount} style rules`;
    
    if (analysis.hasVariables) description += ' and CSS custom properties';
    if (analysis.hasMediaQueries) description += ', responsive design breakpoints';
    if (analysis.hasAnimations) description += ', animations and transitions';
    if (analysis.hasFlexbox) description += '. Implements flexbox layout system';
    if (analysis.hasGrid) description += ' and CSS Grid for complex layouts';
    
    return description + '. Provides consistent visual styling and user experience across the application.';
  }

  private generateHtmlDescription(filePath: string, analysis: any): string {
    const fileName = filePath.split('/').pop() || 'page';
    
    let description = `HTML document ${fileName} structures web page content with ${analysis.elementCount} elements`;
    
    if (analysis.hasScripts) description += ', JavaScript integration';
    if (analysis.hasStyles) description += ', CSS styling';
    if (analysis.hasForms) description += ', interactive forms';
    if (analysis.hasCanvas) description += ', canvas graphics';
    if (analysis.hasVideo || analysis.hasAudio) description += ', multimedia content';
    
    return description + '. Provides semantic markup and accessibility features for web browsers.';
  }

  private generateDocumentationDescription(filePath: string, analysis: any): string {
    const fileName = filePath.split('/').pop() || 'documentation';
    
    if (analysis.isReadme) {
      return `README documentation providing project overview, installation instructions, usage examples, and contribution guidelines. Contains ${analysis.headingCount} sections with ${analysis.codeBlockCount} code examples and ${analysis.linkCount} reference links.`;
    } else if (analysis.isChangelog) {
      return `Changelog documentation tracking version history, feature additions, bug fixes, and breaking changes. Maintains chronological record of project evolution and release notes for users and developers.`;
    } else if (analysis.isApiDoc) {
      return `API documentation describing endpoints, request/response formats, authentication methods, and usage examples. Provides comprehensive reference for developers integrating with the service.`;
    } else {
      return `Documentation file ${fileName} containing ${analysis.headingCount} sections with detailed information, ${analysis.codeBlockCount} code examples, and ${analysis.linkCount} reference links. Supports project understanding and developer onboarding.`;
    }
  }

  // Helper methods for enhanced analysis
  private extractClassMethods(classBody: string): string[] {
    const methodRegex = /(\w+)\s*\([^)]*\)\s*{/g;
    const methods: string[] = [];
    let match;
    while ((match = methodRegex.exec(classBody)) !== null) {
      methods.push(match[1]);
    }
    return methods;
  }

  private extractClassProperties(classBody: string): string[] {
    const propertyRegex = /(?:this\.)?(\w+)\s*=/g;
    const properties: string[] = [];
    let match;
    while ((match = propertyRegex.exec(classBody)) !== null) {
      if (!properties.includes(match[1])) {
        properties.push(match[1]);
      }
    }
    return properties;
  }

  private extractReactHooks(componentBody: string): string[] {
    const hookRegex = /use[A-Z]\w*/g;
    const hooks = componentBody.match(hookRegex) || [];
    return [...new Set(hooks)];
  }

  private extractReactProps(componentBody: string): string[] {
    const propRegex = /props\.(\w+)/g;
    const props: string[] = [];
    let match;
    while ((match = propRegex.exec(componentBody)) !== null) {
      if (!props.includes(match[1])) {
        props.push(match[1]);
      }
    }
    return props;
  }

  private analyzeJSXStructure(componentBody: string) {
    return {
      hasForm: /<form/i.test(componentBody),
      hasTable: /<table/i.test(componentBody),
      hasList: /<[uo]l|<li/i.test(componentBody),
      hasModal: /modal|dialog/i.test(componentBody),
      hasButtons: /<button|onClick/i.test(componentBody),
      hasInputs: /<input|<textarea|<select/i.test(componentBody),
      hasLinks: /<a\s|<Link/i.test(componentBody)
    };
  }

  private extractPythonImportsEnhanced(content: string) {
    const imports: Array<{source: string, type: string, items: string[]}> = [];
    
    // from ... import ...
    const fromImportRegex = /from\s+(\S+)\s+import\s+(.+)/g;
    let match;
    while ((match = fromImportRegex.exec(content)) !== null) {
      const items = match[2].split(',').map(s => s.trim());
      imports.push({
        source: match[1],
        type: 'from',
        items
      });
    }
    
    // import ...
    const importRegex = /^import\s+(.+)/gm;
    while ((match = importRegex.exec(content)) !== null) {
      const items = match[1].split(',').map(s => s.trim());
      imports.push({
        source: match[1],
        type: 'import',
        items
      });
    }
    
    return imports;
  }

  private extractPythonClassesEnhanced(content: string, filePath: string, analysis: any): ComponentNode[] {
    const classes: ComponentNode[] = [];
    const classRegex = /class\s+(\w+)(?:\([^)]*\))?\s*:([^]*?)(?=\nclass|\n\ndef|\n\n\w|\n*$)/g;
    
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const classBody = match[2];
      
      const methods = this.extractPythonMethods(classBody);
      
      classes.push({
        id: `class_${filePath}_${className}`.replace(/[^a-zA-Z0-9]/g, '_'),
        name: className,
        type: 'class',
        file: filePath,
        dependencies: [],
        exports: [className],
        imports: [],
        layer: this.determineLayer(filePath),
        complexity: this.calculateMethodComplexity(classBody, className),
        lines: this.countClassLines(content, className),
        description: this.generatePythonClassDescription(className, methods, analysis)
      });
    }
    
    return classes;
  }

  private extractPythonFunctionsEnhanced(content: string, filePath: string, analysis: any): ComponentNode[] {
    const functions: ComponentNode[] = [];
    const funcRegex = /def\s+(\w+)\s*\(([^)]*)\)\s*:([^]*?)(?=\ndef|\nclass|\n\n\w|\n*$)/g;
    
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[1];
      const params = match[2];
      const funcBody = match[3];
      
      if (!funcName.startsWith('__')) { // Skip magic methods
        functions.push({
          id: `func_${filePath}_${funcName}`.replace(/[^a-zA-Z0-9]/g, '_'),
          name: funcName,
          type: 'function',
          file: filePath,
          dependencies: [],
          exports: [funcName],
          imports: [],
          layer: this.determineLayer(filePath),
          complexity: this.calculateFunctionComplexity(funcBody, funcName),
          lines: this.countFunctionLines(content, funcName),
          description: this.generatePythonFunctionDescription(funcName, params, funcBody, analysis)
        });
      }
    }
    
    return functions;
  }

  private extractCppIncludesEnhanced(content: string) {
    const includes: Array<{source: string, type: string}> = [];
    
    const includeRegex = /#include\s*([<"])([^>"]+)[>"]/g;
    let match;
    while ((match = includeRegex.exec(content)) !== null) {
      includes.push({
        source: match[2],
        type: match[1] === '<' ? 'system' : 'local'
      });
    }
    
    return includes;
  }

  private extractCppClassesEnhanced(content: string, filePath: string, analysis: any): ComponentNode[] {
    const classes: ComponentNode[] = [];
    const classRegex = /class\s+(\w+)(?:\s*:\s*(?:public|private|protected)\s+\w+)?\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g;
    
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const classBody = match[2];
      
      const methods = this.extractCppMethods(classBody);
      
      classes.push({
        id: `class_${filePath}_${className}`.replace(/[^a-zA-Z0-9]/g, '_'),
        name: className,
        type: 'class',
        file: filePath,
        dependencies: [],
        exports: [className],
        imports: [],
        layer: this.determineLayer(filePath),
        complexity: this.calculateMethodComplexity(classBody, className),
        lines: this.countClassLines(content, className),
        description: this.generateCppClassDescription(className, methods, analysis)
      });
    }
    
    return classes;
  }

  private extractCppFunctionsEnhanced(content: string, filePath: string, analysis: any): ComponentNode[] {
    const functions: ComponentNode[] = [];
    const funcRegex = /(?:^|\s)(\w+)\s+(\w+)\s*\(([^)]*)\)\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/gm;
    
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const returnType = match[1];
      const funcName = match[2];
      const params = match[3];
      const funcBody = match[4];
      
      // Skip common keywords and constructors
      if (!['if', 'for', 'while', 'switch', 'class', 'struct'].includes(returnType)) {
        functions.push({
          id: `func_${filePath}_${funcName}`.replace(/[^a-zA-Z0-9]/g, '_'),
          name: funcName,
          type: 'function',
          file: filePath,
          dependencies: [],
          exports: [funcName],
          imports: [],
          layer: this.determineLayer(filePath),
          complexity: this.calculateFunctionComplexity(funcBody, funcName),
          lines: this.countFunctionLines(content, funcName),
          description: this.generateCppFunctionDescription(funcName, returnType, params, funcBody, analysis)
        });
      }
    }
    
    return functions;
  }

  private extractPythonMethods(classBody: string): string[] {
    const methodRegex = /def\s+(\w+)\s*\(/g;
    const methods: string[] = [];
    let match;
    while ((match = methodRegex.exec(classBody)) !== null) {
      methods.push(match[1]);
    }
    return methods;
  }

  private extractCppMethods(classBody: string): string[] {
    const methodRegex = /(\w+)\s*\([^)]*\)\s*(?:const)?\s*[{;]/g;
    const methods: string[] = [];
    let match;
    while ((match = methodRegex.exec(classBody)) !== null) {
      methods.push(match[1]);
    }
    return methods;
  }

  private generatePythonClassDescription(className: string, methods: string[], analysis: any): string {
    let description = `Python class ${className} encapsulates object-oriented functionality with ${methods.length} method${methods.length !== 1 ? 's' : ''}`;
    
    if (analysis.hasDataScience) {
      description += ', implementing data science operations and statistical analysis';
    } else if (analysis.hasWebFramework) {
      description += ', providing web application endpoints and request handling';
    } else if (analysis.hasDatabase) {
      description += ', managing database connections and data persistence';
    }
    
    const hasInit = methods.includes('__init__');
    const hasStr = methods.includes('__str__');
    const hasRepr = methods.includes('__repr__');
    
    if (hasInit) description += '. Includes constructor for instance initialization';
    if (hasStr || hasRepr) description += ' and string representation methods';
    
    return description + '. Follows Python conventions and object-oriented design principles.';
  }

  private generatePythonFunctionDescription(funcName: string, params: string, funcBody: string, analysis: any): string {
    const paramCount = params ? params.split(',').filter(p => p.trim()).length : 0;
    let description = `Python function ${funcName}`;
    
    if (funcName.startsWith('get_') || funcName.startsWith('fetch_')) {
      description += ` retrieves and returns data`;
    } else if (funcName.startsWith('process_') || funcName.startsWith('handle_')) {
      description += ` processes input data and performs operations`;
    } else if (funcName.startsWith('validate_') || funcName.startsWith('check_')) {
      description += ` validates input parameters and returns verification results`;
    } else {
      description += ` executes specialized functionality`;
    }
    
    if (paramCount > 0) {
      description += ` accepting ${paramCount} parameter${paramCount !== 1 ? 's' : ''}`;
    }
    
    if (/return\s+/.test(funcBody)) description += ', returning processed results';
    if (/async|await/.test(funcBody)) description += ' using asynchronous operations';
    if (/requests\.|urllib/.test(funcBody)) description += ' with HTTP communication';
    
    return description + '. Implements Pythonic coding standards and error handling.';
  }

  private generateCppClassDescription(className: string, methods: string[], analysis: any): string {
    let description = `C++ class ${className} implements object-oriented design with ${methods.length} method${methods.length !== 1 ? 's' : ''}`;
    
    if (analysis.hasSTL) {
      description += ', utilizing Standard Template Library containers and algorithms';
    } else if (analysis.hasOpenCV) {
      description += ', implementing computer vision and image processing operations';
    } else if (analysis.hasQt) {
      description += ', providing graphical user interface functionality';
    }
    
    if (analysis.hasTemplates) description += ' with template-based generic programming';
    if (analysis.hasMemoryManagement) description += ', manual memory management';
    if (analysis.hasThreading) description += ', and thread-safe operations';
    
    return description + '. Follows modern C++ standards for performance and type safety.';
  }

  private generateCppFunctionDescription(funcName: string, returnType: string, params: string, funcBody: string, analysis: any): string {
    const paramCount = params ? params.split(',').filter(p => p.trim()).length : 0;
    let description = `C++ function ${funcName} returns ${returnType}`;
    
    if (funcName.startsWith('get') || funcName.startsWith('fetch')) {
      description += ` and retrieves data`;
    } else if (funcName.startsWith('set') || funcName.startsWith('update')) {
      description += ` and modifies data`;
    } else if (funcName.startsWith('process') || funcName.startsWith('handle')) {
      description += ` and processes input data`;
    } else {
      description += ` and executes specialized operations`;
    }
    
    if (paramCount > 0) {
      description += ` accepting ${paramCount} parameter${paramCount !== 1 ? 's' : ''}`;
    }
    
    if (/new\s+|malloc/.test(funcBody)) description += ', allocating dynamic memory';
    if (/delete\s+|free/.test(funcBody)) description += ', managing memory deallocation';
    if (/thread|mutex/.test(funcBody)) description += ' with thread synchronization';
    
    return description + '. Implements efficient algorithms with proper resource management.';
  }

  private extractStyleDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Extract @import statements
    const importRegex = /@import\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    
    return dependencies;
  }

  private extractHtmlDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Extract script sources
    const scriptRegex = /<script[^>]+src=['"]([^'"]+)['"]/g;
    let match;
    while ((match = scriptRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    
    // Extract stylesheet links
    const linkRegex = /<link[^>]+href=['"]([^'"]+)['"]/g;
    while ((match = linkRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    
    return dependencies;
  }

  private getFileTypeDescription(filePath: string): string {
    if (filePath.includes('/components/')) return 'React component';
    if (filePath.includes('/services/')) return 'service';
    if (filePath.includes('/utils/')) return 'utility';
    if (filePath.includes('/hooks/')) return 'React hook';
    if (filePath.includes('/pages/')) return 'page component';
    if (filePath.includes('/api/')) return 'API';
    return 'JavaScript';
  }

  // Enhanced complexity calculation
  private calculateComplexityEnhanced(content: string): number {
    let complexity = 1;
    
    // Count control flow statements with weights
    const controlFlowPatterns = [
      { pattern: /\bif\b/g, weight: 1 },
      { pattern: /\belse\s+if\b/g, weight: 1 },
      { pattern: /\bwhile\b/g, weight: 2 },
      { pattern: /\bfor\b/g, weight: 2 },
      { pattern: /\bswitch\b/g, weight: 2 },
      { pattern: /\bcase\b/g, weight: 1 },
      { pattern: /\bcatch\b/g, weight: 2 },
      { pattern: /&&|\|\|/g, weight: 1 },
      { pattern: /\btry\b/g, weight: 1 },
      { pattern: /\bexcept\b/g, weight: 2 }
    ];
    
    controlFlowPatterns.forEach(({ pattern, weight }) => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length * weight;
      }
    });
    
    // Add complexity for nested structures
    const nestingLevel = this.calculateNestingLevel(content);
    complexity += nestingLevel;
    
    return complexity;
  }

  private calculateNestingLevel(content: string): number {
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const char of content) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting--;
      }
    }
    
    return maxNesting;
  }

  // Rest of the existing methods remain the same...
  private determineLayer(filePath: string): ComponentNode['layer'] {
    if (filePath.includes('/components/') || filePath.includes('/pages/') || filePath.includes('/views/') || filePath.includes('/ui/')) {
      return 'presentation';
    }
    if (filePath.includes('/services/') || filePath.includes('/business/') || filePath.includes('/logic/') || filePath.includes('/api/')) {
      return 'business';
    }
    if (filePath.includes('/data/') || filePath.includes('/models/') || filePath.includes('/repositories/') || filePath.includes('/database/')) {
      return 'data';
    }
    if (filePath.includes('/config/') || filePath.includes('/utils/') || filePath.includes('/infrastructure/') || filePath.includes('/lib/')) {
      return  'infrastructure';
    }
    return 'business';
  }

  private buildRelationships() {
    const components = this.components.find();
    
    components.forEach(component => {
      component.dependencies.forEach(dep => {
        const targetComponent = components.find(c => 
          c.name === dep || 
          c.file.includes(dep) || 
          c.exports.includes(dep) ||
          c.id.includes(dep.replace(/[^a-zA-Z0-9]/g, '_'))
        );
        
        if (targetComponent && targetComponent.id !== component.id) {
          // Check if relationship already exists
          const existingRel = this.relationships.findOne({
            from: component.id,
            to: targetComponent.id
          });
          
          if (!existingRel) {
            this.relationships.insert({
              from: component.id,
              to: targetComponent.id,
              type: this.determineRelationshipType(component, targetComponent, dep),
              weight: 1
            });
          }
        }
      });
    });
  }

  private determineRelationshipType(from: ComponentNode, to: ComponentNode, dependency: string): Relationship['type'] {
    if (from.type === 'class' && to.type === 'class') {
      return 'extends';
    }
    if (from.type === 'component' && to.type === 'component') {
      return 'uses';
    }
    if (dependency.startsWith('use')) {
      return 'uses';
    }
    return 'imports';
  }

  private async generateEnhancedAISummaries() {
    const components = this.components.find();
    
    for (const component of components) {
      // The enhanced descriptions are already generated during parsing
      // This method can be extended for additional AI processing if needed
      if (!component.description) {
        component.description = this.generateFallbackDescription(component);
      }
    }
  }

  private generateFallbackDescription(component: ComponentNode): string {
    const { type, name, file, layer, complexity } = component;
    
    return `${type.charAt(0).toUpperCase() + type.slice(1)} ${name} in ${file} provides ${layer} layer functionality with ${complexity > 5 ? 'high' : 'moderate'} complexity. Implements specialized operations and maintains clean architecture principles.`;
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
        description: `Components in the ${layer} layer handling ${this.getLayerDescription(layer)}`
      });
    });
    
    return boundaries;
  }

  private getLayerDescription(layer: string): string {
    const descriptions = {
      presentation: 'user interface and user experience',
      business: 'core business logic and application rules',
      data: 'data access and persistence operations',
      infrastructure: 'system utilities and external integrations',
      external: 'third-party services and external dependencies'
    };
    
    return descriptions[layer as keyof typeof descriptions] || 'application functionality';
  }

  private getMainLanguages(files: CodeFile[]): string[] {
    const languageCounts = files.reduce((counts, file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
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

  // Helper methods that were referenced but not defined
  private calculateMethodComplexity(content: string, name: string): number {
    return this.calculateComplexityEnhanced(content);
  }

  private calculateFunctionComplexity(content: string, name: string): number {
    return this.calculateComplexityEnhanced(content);
  }

  private calculateComponentComplexity(content: string, name: string): number {
    return this.calculateComplexityEnhanced(content);
  }

  private countClassLines(content: string, className: string): number {
    const classRegex = new RegExp(`class\\s+${className}[^{]*{([^}]*(?:{[^}]*}[^}]*)*)}`, 'g');
    const match = classRegex.exec(content);
    if (match) {
      return match[1].split('\n').length;
    }
    return 1;
  }

  private countFunctionLines(content: string, funcName: string): number {
    const funcRegex = new RegExp(`(?:function\\s+${funcName}|${funcName}\\s*=)[^{]*{([^}]*(?:{[^}]*}[^}]*)*)}`, 'g');
    const match = funcRegex.exec(content);
    if (match) {
      return match[1].split('\n').length;
    }
    return 1;
  }

  private countComponentLines(content: string, componentName: string): number {
    const componentRegex = new RegExp(`(?:const|function)\\s+${componentName}[^{]*{([^}]*(?:{[^}]*}[^}]*)*)}`, 'g');
    const match = componentRegex.exec(content);
    if (match) {
      return match[1].split('\n').length;
    }
    return 1;
  }

  private extractFunctionDependencies(content: string, funcName: string): string[] {
    // Extract function calls within the function
    const dependencies: string[] = [];
    const callRegex = /(\w+)\s*\(/g;
    let match;
    while ((match = callRegex.exec(content)) !== null) {
      const calledFunc = match[1];
      if (calledFunc !== funcName && !['console', 'Math', 'Object', 'Array'].includes(calledFunc)) {
        dependencies.push(calledFunc);
      }
    }
    
    return [...new Set(dependencies)]; // Remove duplicates
  }

  private extractReactDependencies(content: string, componentName: string): string[] {
    const dependencies: string[] = [];
    
    // Extract hooks usage
    const hooksRegex = /use\w+/g;
    const hooks = content.match(hooksRegex) || [];
    dependencies.push(...hooks);
    
    // Extract component usage (capitalized identifiers)
    const componentRegex = /<(\w+)/g;
    let match;
    while ((match = componentRegex.exec(content)) !== null) {
      const usedComponent = match[1];
      if (/^[A-Z]/.test(usedComponent) && usedComponent !== componentName) {
        dependencies.push(usedComponent);
      }
    }
    
    return [...new Set(dependencies)];
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
}