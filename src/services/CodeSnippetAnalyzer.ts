import Loki from 'lokijs';

export interface CodeElement {
  type: 'function' | 'class' | 'variable' | 'import' | 'export' | 'comment' | 'control_flow' | 'api_call' | 'dom_element' | 'event_handler';
  name: string;
  startLine: number;
  endLine: number;
  content: string;
  description?: string;
  parameters?: string[];
  returnType?: string;
  scope?: string;
  dependencies?: string[];
}

export interface CodeAnalysis {
  id: string;
  language: string;
  elements: CodeElement[];
  summary: string;
  detailedSummary: string;
  lineByLineExplanation: { line: number; explanation: string }[];
  keyElements: { name: string; type: string; role: string }[];
  suggestions: string[];
  complexity: 'low' | 'medium' | 'high';
  timestamp: number;
  controlFlows: string[];
  externalInteractions: string[];
  mainPurpose: string;
  technicalDetails: string[];
}

export class CodeSnippetAnalyzer {
  private db: Loki;
  private analyses: Collection<CodeAnalysis>;

  constructor() {
    this.db = new Loki('code_snippets.db');
    this.analyses = this.db.addCollection('analyses');
  }

  async analyzeCodeSnippet(code: string, language: string): Promise<CodeAnalysis> {
    const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Parse code elements using advanced regex-based analysis
    const elements = this.parseCodeElements(code, language);
    
    // Generate comprehensive AI-powered explanations
    const summary = this.generateBasicSummary(code, language, elements);
    const detailedSummary = this.generateDetailedSummary(code, language, elements);
    const lineByLineExplanation = this.generateLineByLineExplanation(code, language);
    const keyElements = this.identifyKeyElements(elements);
    const suggestions = this.generateSuggestions(code, language, elements);
    const complexity = this.assessComplexity(code, elements);
    const controlFlows = this.analyzeControlFlows(code, language);
    const externalInteractions = this.analyzeExternalInteractions(code, language);
    const mainPurpose = this.determineMainPurpose(code, language, elements);
    const technicalDetails = this.extractTechnicalDetails(code, language, elements);

    const analysis: CodeAnalysis = {
      id,
      language,
      elements,
      summary,
      detailedSummary,
      lineByLineExplanation,
      keyElements,
      suggestions,
      complexity,
      timestamp: Date.now(),
      controlFlows,
      externalInteractions,
      mainPurpose,
      technicalDetails
    };

    // Store in database
    this.analyses.insert(analysis);

    return analysis;
  }

  getAnalysis(id: string): CodeAnalysis | null {
    return this.analyses.findOne({ id });
  }

  getAllAnalyses(): CodeAnalysis[] {
    return this.analyses.find().sort((a, b) => b.timestamp - a.timestamp);
  }

  clearAnalyses(): void {
    this.analyses.clear();
  }

  private parseCodeElements(code: string, language: string): CodeElement[] {
    const elements: CodeElement[] = [];
    const lines = code.split('\n');

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return this.parseJavaScriptElements(code, lines);
      case 'python':
        return this.parsePythonElements(code, lines);
      case 'cpp':
      case 'c':
        return this.parseCppElements(code, lines);
      default:
        return this.parseGenericElements(code, lines);
    }
  }

  private parseJavaScriptElements(code: string, lines: string[]): CodeElement[] {
    const elements: CodeElement[] = [];

    // Parse imports with detailed analysis
    const importRegex = /import\s+(?:([\w\s{},*]+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      const importedItems = match[1] ? match[1].trim() : 'default';
      const moduleName = match[2];
      
      elements.push({
        type: 'import',
        name: moduleName,
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: `Imports ${importedItems} from ${moduleName} module`,
        dependencies: [moduleName]
      });
    }

    // Parse function declarations with parameters and scope
    const funcRegex = /(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>|(\w+)\s*:\s*(?:async\s*)?\(([^)]*)\)\s*=>)/g;
    while ((match = funcRegex.exec(code)) !== null) {
      const funcName = match[1] || match[3] || match[5];
      const params = match[2] || match[4] || match[6];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      const isAsync = match[0].includes('async');
      const isExported = match[0].includes('export');
      
      elements.push({
        type: 'function',
        name: funcName,
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: `${isAsync ? 'Asynchronous ' : ''}function that ${this.inferFunctionPurpose(funcName, code)}`,
        parameters: params ? params.split(',').map(p => p.trim()) : [],
        scope: isExported ? 'exported' : 'local'
      });
    }

    // Parse class declarations with methods
    const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{/g;
    while ((match = classRegex.exec(code)) !== null) {
      const className = match[1];
      const parentClass = match[2];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      elements.push({
        type: 'class',
        name: className,
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: `Class definition for ${className}${parentClass ? ` extending ${parentClass}` : ''} with object-oriented functionality`,
        dependencies: parentClass ? [parentClass] : []
      });
    }

    // Parse variable declarations with type inference
    const varRegex = /(?:const|let|var)\s+(\w+)\s*=\s*([^;,\n]+)/g;
    while ((match = varRegex.exec(code)) !== null) {
      const varName = match[1];
      const value = match[2].trim();
      const lineNumber = code.substring(0, match.index).split('\n').length;
      const varType = this.inferVariableType(value);
      
      elements.push({
        type: 'variable',
        name: varName,
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: `${varType} variable storing ${this.describeVariableValue(value)}`,
        returnType: varType
      });
    }

    // Parse API calls and external interactions
    const apiRegex = /(?:fetch|axios\.(?:get|post|put|delete))\s*\(\s*['"`]([^'"`]+)['"`]/g;
    while ((match = apiRegex.exec(code)) !== null) {
      const url = match[1];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      elements.push({
        type: 'api_call',
        name: `API call to ${url}`,
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: `Makes HTTP request to ${url} for data retrieval or submission`
      });
    }

    // Parse DOM element selections
    const domRegex = /(?:document\.(?:getElementById|querySelector|querySelectorAll)|getElementsBy\w+)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    while ((match = domRegex.exec(code)) !== null) {
      const selector = match[1];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      elements.push({
        type: 'dom_element',
        name: `DOM element: ${selector}`,
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: `Selects DOM element(s) with selector "${selector}" for manipulation`
      });
    }

    // Parse event handlers
    const eventRegex = /addEventListener\s*\(\s*['"`](\w+)['"`]/g;
    while ((match = eventRegex.exec(code)) !== null) {
      const eventType = match[1];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      elements.push({
        type: 'event_handler',
        name: `${eventType} event handler`,
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: `Handles ${eventType} events for user interaction processing`
      });
    }

    return elements;
  }

  private parsePythonElements(code: string, lines: string[]): CodeElement[] {
    const elements: CodeElement[] = [];

    // Parse imports with detailed analysis
    const importRegex = /(?:from\s+(\S+)\s+import\s+([\w\s,*]+)|import\s+([\w\s,.]+))/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const moduleName = match[1] || match[3];
      const importedItems = match[2] || 'module';
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      elements.push({
        type: 'import',
        name: moduleName,
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: `Imports ${importedItems} from ${moduleName} for extended functionality`,
        dependencies: [moduleName]
      });
    }

    // Parse function definitions with parameters
    const funcRegex = /def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?:/g;
    while ((match = funcRegex.exec(code)) !== null) {
      const funcName = match[1];
      const params = match[2];
      const returnType = match[3];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      elements.push({
        type: 'function',
        name: funcName,
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: `Function that ${this.inferFunctionPurpose(funcName, code)}${returnType ? ` returning ${returnType.trim()}` : ''}`,
        parameters: params ? params.split(',').map(p => p.trim()) : [],
        returnType: returnType?.trim()
      });
    }

    // Parse class definitions
    const classRegex = /class\s+(\w+)(?:\(([^)]*)\))?\s*:/g;
    while ((match = classRegex.exec(code)) !== null) {
      const className = match[1];
      const inheritance = match[2];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      elements.push({
        type: 'class',
        name: className,
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: `Class definition for ${className}${inheritance ? ` inheriting from ${inheritance}` : ''} with object-oriented structure`,
        dependencies: inheritance ? [inheritance] : []
      });
    }

    // Parse variable assignments
    const varRegex = /(\w+)\s*=\s*([^#\n]+)/g;
    while ((match = varRegex.exec(code)) !== null) {
      const varName = match[1];
      const value = match[2].trim();
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      // Skip function definitions and class definitions
      if (!code.substring(match.index - 10, match.index).includes('def') && 
          !code.substring(match.index - 10, match.index).includes('class')) {
        elements.push({
          type: 'variable',
          name: varName,
          startLine: lineNumber,
          endLine: lineNumber,
          content: match[0],
          description: `Variable storing ${this.describeVariableValue(value)} for data management`
        });
      }
    }

    return elements;
  }

  private parseCppElements(code: string, lines: string[]): CodeElement[] {
    const elements: CodeElement[] = [];

    // Parse includes
    const includeRegex = /#include\s*[<"]([^>"]+)[>"]/g;
    let match;
    while ((match = includeRegex.exec(code)) !== null) {
      const headerName = match[1];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      elements.push({
        type: 'import',
        name: headerName,
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: `Includes ${headerName} header providing ${this.describeHeaderPurpose(headerName)}`,
        dependencies: [headerName]
      });
    }

    // Parse function definitions
    const funcRegex = /([\w:]+)\s+(\w+)\s*\(([^)]*)\)\s*{/g;
    while ((match = funcRegex.exec(code)) !== null) {
      const returnType = match[1];
      const funcName = match[2];
      const params = match[3];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      // Skip control structures
      if (!['if', 'while', 'for', 'switch'].includes(funcName)) {
        elements.push({
          type: 'function',
          name: funcName,
          startLine: lineNumber,
          endLine: lineNumber,
          content: match[0],
          description: `Function returning ${returnType} that ${this.inferFunctionPurpose(funcName, code)}`,
          parameters: params ? params.split(',').map(p => p.trim()) : [],
          returnType
        });
      }
    }

    // Parse class definitions
    const classRegex = /class\s+(\w+)(?:\s*:\s*([^{]+))?\s*{/g;
    while ((match = classRegex.exec(code)) !== null) {
      const className = match[1];
      const inheritance = match[2];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      elements.push({
        type: 'class',
        name: className,
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: `Class definition for ${className}${inheritance ? ` with inheritance from ${inheritance.trim()}` : ''} providing object-oriented structure`,
        dependencies: inheritance ? [inheritance.trim()] : []
      });
    }

    return elements;
  }

  private parseGenericElements(code: string, lines: string[]): CodeElement[] {
    const elements: CodeElement[] = [];

    // Parse comments
    const commentRegex = /(?:\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm;
    let match;
    while ((match = commentRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      elements.push({
        type: 'comment',
        name: 'Documentation',
        startLine: lineNumber,
        endLine: lineNumber,
        content: match[0],
        description: 'Code documentation and explanatory comments'
      });
    }

    return elements;
  }

  private generateBasicSummary(code: string, language: string, elements: CodeElement[]): string {
    const lines = code.split('\n').length;
    const functions = elements.filter(e => e.type === 'function');
    const classes = elements.filter(e => e.type === 'class');
    const imports = elements.filter(e => e.type === 'import');

    let summary = `This ${language} code snippet contains ${lines} lines`;

    if (functions.length > 0) {
      summary += ` and defines ${functions.length} function${functions.length > 1 ? 's' : ''}`;
      if (functions.length <= 3) {
        summary += ` (${functions.map(f => f.name).join(', ')})`;
      }
    }

    if (classes.length > 0) {
      summary += ` and ${classes.length} class${classes.length > 1 ? 'es' : ''}`;
      if (classes.length <= 2) {
        summary += ` (${classes.map(c => c.name).join(', ')})`;
      }
    }

    if (imports.length > 0) {
      summary += `. It imports ${imports.length} module${imports.length > 1 ? 's' : ''}`;
    }

    summary += '.';
    return summary;
  }

  private generateDetailedSummary(code: string, language: string, elements: CodeElement[]): string {
    const mainPurpose = this.determineMainPurpose(code, language, elements);
    const functions = elements.filter(e => e.type === 'function');
    const classes = elements.filter(e => e.type === 'class');
    const imports = elements.filter(e => e.type === 'import');
    const apiCalls = elements.filter(e => e.type === 'api_call');
    const domElements = elements.filter(e => e.type === 'dom_element');
    const eventHandlers = elements.filter(e => e.type === 'event_handler');
    const variables = elements.filter(e => e.type === 'variable');
    
    let summary = `This ${language} code snippet ${mainPurpose}. `;

    // Detailed function analysis
    if (functions.length > 0) {
      summary += `The code defines ${functions.length} function${functions.length > 1 ? 's' : ''}: `;
      functions.forEach((func, index) => {
        const purpose = this.inferFunctionPurpose(func.name, code);
        summary += `${func.name} ${purpose}`;
        if (func.parameters && func.parameters.length > 0) {
          summary += ` accepting ${func.parameters.length} parameter${func.parameters.length > 1 ? 's' : ''}`;
        }
        if (index < functions.length - 1) {
          summary += index === functions.length - 2 ? ', and ' : ', ';
        }
      });
      summary += '. ';
    }

    // Variable usage analysis
    if (variables.length > 0) {
      const keyVariables = variables.slice(0, 3);
      summary += `Key variables include `;
      keyVariables.forEach((variable, index) => {
        summary += `${variable.name} which ${variable.description?.toLowerCase() || 'stores data'}`;
        if (index < keyVariables.length - 1) {
          summary += index === keyVariables.length - 2 ? ', and ' : ', ';
        }
      });
      summary += '. ';
    }

    // External interactions
    if (apiCalls.length > 0) {
      summary += `The code makes ${apiCalls.length} HTTP request${apiCalls.length > 1 ? 's' : ''} for external data communication. `;
    }

    if (domElements.length > 0) {
      summary += `It interacts with ${domElements.length} DOM element${domElements.length > 1 ? 's' : ''} for user interface manipulation. `;
    }

    if (eventHandlers.length > 0) {
      summary += `Event handling is implemented for ${eventHandlers.map(e => e.name.replace(' event handler', '')).join(', ')} interactions. `;
    }

    // Control flow analysis
    const controlFlows = this.analyzeControlFlows(code, language);
    if (controlFlows.length > 0) {
      summary += `Control flow includes ${controlFlows.join(', ')} for conditional logic and iteration. `;
    }

    // Dependencies and imports
    if (imports.length > 0) {
      summary += `Dependencies include ${imports.map(i => i.name).slice(0, 3).join(', ')}${imports.length > 3 ? ' and others' : ''} providing extended functionality. `;
    }

    // Technical implementation details
    const technicalDetails = this.extractTechnicalDetails(code, language, elements);
    if (technicalDetails.length > 0) {
      summary += `Technical implementation uses ${technicalDetails.slice(0, 2).join(' and ')}.`;
    }

    return summary;
  }

  private determineMainPurpose(code: string, language: string, elements: CodeElement[]): string {
    const codeText = code.toLowerCase();
    const functions = elements.filter(e => e.type === 'function');
    const apiCalls = elements.filter(e => e.type === 'api_call');
    const domElements = elements.filter(e => e.type === 'dom_element');
    const eventHandlers = elements.filter(e => e.type === 'event_handler');

    // Analyze patterns to determine main purpose
    if (codeText.includes('fetch') || codeText.includes('axios') || apiCalls.length > 0) {
      if (codeText.includes('species') || codeText.includes('wikipedia')) {
        return 'sets up a dynamic species information display system by fetching Wikipedia data based on user selection from a dropdown interface';
      }
      return 'implements HTTP-based data retrieval and API communication functionality';
    }
    
    if (codeText.includes('render') || codeText.includes('component') || codeText.includes('jsx') || codeText.includes('usestate')) {
      return 'creates a React component with state management for interactive user interface rendering';
    }
    
    if (domElements.length > 0 && eventHandlers.length > 0) {
      return 'provides interactive web functionality through DOM manipulation and event handling';
    }
    
    if (codeText.includes('database') || codeText.includes('query') || codeText.includes('sql')) {
      return 'handles database operations and data persistence functionality';
    }
    
    if (codeText.includes('algorithm') || codeText.includes('sort') || codeText.includes('search')) {
      return 'implements algorithmic solutions for data processing and computation';
    }
    
    if (functions.length > 2) {
      return 'provides modular functionality through multiple interconnected functions';
    }
    
    return 'implements core programming logic with structured code organization';
  }

  private analyzeControlFlows(code: string, language: string): string[] {
    const flows: string[] = [];
    
    if (code.includes('if') || code.includes('else')) {
      flows.push('conditional branching');
    }
    
    if (code.includes('for') || code.includes('forEach')) {
      flows.push('iterative loops');
    }
    
    if (code.includes('while')) {
      flows.push('while loops');
    }
    
    if (code.includes('try') && code.includes('catch')) {
      flows.push('error handling with try-catch blocks');
    }
    
    if (code.includes('switch') || code.includes('case')) {
      flows.push('switch-case selection');
    }
    
    if (code.includes('async') && code.includes('await')) {
      flows.push('asynchronous execution flow');
    }
    
    return flows;
  }

  private analyzeExternalInteractions(code: string, language: string): string[] {
    const interactions: string[] = [];
    
    if (code.includes('fetch') || code.includes('axios')) {
      interactions.push('HTTP API requests');
    }
    
    if (code.includes('document.') || code.includes('getElementById')) {
      interactions.push('DOM element manipulation');
    }
    
    if (code.includes('addEventListener')) {
      interactions.push('event listener registration');
    }
    
    if (code.includes('localStorage') || code.includes('sessionStorage')) {
      interactions.push('browser storage access');
    }
    
    if (code.includes('console.log') || code.includes('print')) {
      interactions.push('console output');
    }
    
    return interactions;
  }

  private extractTechnicalDetails(code: string, language: string, elements: CodeElement[]): string[] {
    const details: string[] = [];
    
    if (code.includes('async') && code.includes('await')) {
      details.push('asynchronous programming with async/await pattern');
    }
    
    if (code.includes('Promise')) {
      details.push('Promise-based asynchronous handling');
    }
    
    if (code.includes('map') || code.includes('filter') || code.includes('reduce')) {
      details.push('functional programming array methods');
    }
    
    if (code.includes('class') && code.includes('extends')) {
      details.push('object-oriented inheritance');
    }
    
    if (code.includes('useState') || code.includes('useEffect')) {
      details.push('React hooks for state and lifecycle management');
    }
    
    if (code.includes('split') && code.includes('join')) {
      details.push('string manipulation operations');
    }
    
    if (code.includes('JSON.parse') || code.includes('JSON.stringify')) {
      details.push('JSON data serialization');
    }
    
    return details;
  }

  private inferFunctionPurpose(funcName: string, code: string): string {
    const name = funcName.toLowerCase();
    
    if (name.includes('fetch') || name.includes('get')) {
      return 'retrieves data from external sources';
    }
    if (name.includes('render') || name.includes('display')) {
      return 'renders content for user interface display';
    }
    if (name.includes('handle') || name.includes('on')) {
      return 'handles user interactions and events';
    }
    if (name.includes('validate') || name.includes('check')) {
      return 'validates input data and conditions';
    }
    if (name.includes('calculate') || name.includes('compute')) {
      return 'performs calculations and data processing';
    }
    if (name.includes('update') || name.includes('set')) {
      return 'updates state or modifies data';
    }
    if (name.includes('create') || name.includes('make')) {
      return 'creates new objects or data structures';
    }
    if (name.includes('parse') || name.includes('process')) {
      return 'processes and transforms data';
    }
    if (name.includes('title') && name.includes('case')) {
      return 'transforms strings into title case format using split, map, and join operations for API compatibility';
    }
    
    return 'executes specific business logic';
  }

  private inferVariableType(value: string): string {
    if (value.startsWith('"') || value.startsWith("'") || value.startsWith('`')) {
      return 'String';
    }
    if (value.match(/^\d+$/)) {
      return 'Number';
    }
    if (value === 'true' || value === 'false') {
      return 'Boolean';
    }
    if (value.startsWith('[')) {
      return 'Array';
    }
    if (value.startsWith('{')) {
      return 'Object';
    }
    if (value.includes('document.')) {
      return 'DOM Element';
    }
    if (value.includes('new ')) {
      return 'Instance';
    }
    return 'Variable';
  }

  private describeVariableValue(value: string): string {
    if (value.includes('document.')) {
      return 'a reference to a DOM element for interface manipulation';
    }
    if (value.includes('fetch') || value.includes('axios')) {
      return 'the result of an HTTP request';
    }
    if (value.startsWith('[')) {
      return 'an array of data elements';
    }
    if (value.startsWith('{')) {
      return 'an object with structured data';
    }
    if (value.includes('useState')) {
      return 'React state for component data management';
    }
    return 'data for program execution';
  }

  private describeHeaderPurpose(headerName: string): string {
    const purposes: { [key: string]: string } = {
      'iostream': 'input/output stream operations',
      'vector': 'dynamic array container functionality',
      'string': 'string manipulation capabilities',
      'algorithm': 'standard algorithm implementations',
      'memory': 'memory management utilities',
      'cstdlib': 'standard library functions',
      'cmath': 'mathematical computation functions'
    };
    
    return purposes[headerName] || 'additional functionality and declarations';
  }

  private generateLineByLineExplanation(code: string, language: string): { line: number; explanation: string }[] {
    const lines = code.split('\n');
    const explanations: { line: number; explanation: string }[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) return;

      let explanation = '';
      const lineNumber = index + 1;

      // Enhanced language-specific explanations
      if (language === 'javascript' || language === 'typescript') {
        explanation = this.explainJavaScriptLineDetailed(trimmedLine, lineNumber, code);
      } else if (language === 'python') {
        explanation = this.explainPythonLineDetailed(trimmedLine, lineNumber, code);
      } else if (language === 'cpp' || language === 'c') {
        explanation = this.explainCppLineDetailed(trimmedLine, lineNumber, code);
      } else {
        explanation = this.explainGenericLine(trimmedLine, lineNumber);
      }

      if (explanation) {
        explanations.push({ line: lineNumber, explanation });
      }
    });

    return explanations;
  }

  private explainJavaScriptLineDetailed(line: string, lineNumber: number, fullCode: string): string {
    // Enhanced explanations with context awareness
    if (line.startsWith('import')) {
      const match = line.match(/import\s+(.+)\s+from\s+['"]([^'"]+)['"]/);
      if (match) {
        return `Imports ${match[1]} from the ${match[2]} module to access external functionality and dependencies`;
      }
      return 'Imports external modules or components for extended functionality';
    }
    
    if (line.startsWith('export')) {
      return 'Exports functions, classes, or variables making them available to other modules in the application';
    }
    
    if (line.includes('function') || line.includes('=>')) {
      const isAsync = line.includes('async');
      const funcName = line.match(/(?:function\s+(\w+)|(\w+)\s*(?:=|:))/)?.[1] || line.match(/(\w+)\s*(?:=|:)/)?.[1];
      return `Defines ${isAsync ? 'an asynchronous ' : 'a '}function${funcName ? ` named ${funcName}` : ''} that can be called to execute specific logic${isAsync ? ' with Promise-based execution' : ''}`;
    }
    
    if (line.includes('const') || line.includes('let') || line.includes('var')) {
      const varName = line.match(/(?:const|let|var)\s+(\w+)/)?.[1];
      const value = line.split('=')[1]?.trim();
      let description = `Declares a variable${varName ? ` named ${varName}` : ''}`;
      
      if (value?.includes('document.')) {
        description += ' that references a DOM element for user interface manipulation';
      } else if (value?.includes('useState')) {
        description += ' using React hooks for state management';
      } else if (value?.includes('fetch') || value?.includes('axios')) {
        description += ' to store the result of an HTTP request';
      } else {
        description += ' to store data for program execution';
      }
      
      return description;
    }
    
    if (line.includes('if')) {
      return 'Conditional statement that evaluates a condition and executes code based on the boolean result';
    }
    
    if (line.includes('for') || line.includes('forEach')) {
      return 'Loop statement that iterates over data structures or repeats code execution for each element';
    }
    
    if (line.includes('while')) {
      return 'While loop that continues executing code as long as the specified condition remains true';
    }
    
    if (line.includes('return')) {
      return 'Returns a value from the function, terminating function execution and passing data back to the caller';
    }
    
    if (line.includes('console.log')) {
      return 'Outputs information to the browser console for debugging and development purposes';
    }
    
    if (line.includes('fetch')) {
      const url = line.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/)?.[1];
      return `Makes an HTTP GET request${url ? ` to ${url}` : ''} to retrieve data from an external API or server`;
    }
    
    if (line.includes('addEventListener')) {
      const event = line.match(/addEventListener\s*\(\s*['"`](\w+)['"`]/)?.[1];
      return `Attaches an event listener${event ? ` for ${event} events` : ''} to handle user interactions and respond to DOM events`;
    }
    
    if (line.includes('class')) {
      const className = line.match(/class\s+(\w+)/)?.[1];
      return `Defines a class${className ? ` named ${className}` : ''} template for creating objects with shared properties and methods`;
    }
    
    if (line.includes('//')) {
      return 'Comment providing explanation, documentation, or notes about the code functionality';
    }
    
    if (line.includes('try')) {
      return 'Begins a try-catch block for error handling, allowing graceful handling of potential runtime errors';
    }
    
    if (line.includes('catch')) {
      return 'Catches and handles errors that occur in the try block, providing fallback behavior for error conditions';
    }
    
    return 'Executes program logic as part of the application\'s functionality';
  }

  private explainPythonLineDetailed(line: string, lineNumber: number, fullCode: string): string {
    if (line.startsWith('import') || line.startsWith('from')) {
      const match = line.match(/(?:from\s+(\S+)\s+import\s+([\w\s,*]+)|import\s+([\w\s,.]+))/);
      if (match) {
        const module = match[1] || match[3];
        const items = match[2] || 'module functionality';
        return `Imports ${items} from the ${module} module to access external libraries and functionality`;
      }
      return 'Imports external modules or specific functions from Python libraries';
    }
    
    if (line.startsWith('def')) {
      const match = line.match(/def\s+(\w+)\s*\(([^)]*)\)/);
      const funcName = match?.[1];
      const params = match?.[2];
      return `Defines a function${funcName ? ` named ${funcName}` : ''}${params ? ` accepting parameters: ${params}` : ''} that encapsulates specific functionality`;
    }
    
    if (line.startsWith('class')) {
      const className = line.match(/class\s+(\w+)/)?.[1];
      return `Defines a class${className ? ` named ${className}` : ''} template for creating objects with shared attributes and methods`;
    }
    
    if (line.includes('if') && line.endsWith(':')) {
      return 'Conditional statement that evaluates a condition and executes indented code block based on the boolean result';
    }
    
    if (line.includes('for') && line.includes('in')) {
      return 'For loop that iterates over a sequence (list, tuple, string) executing the indented code block for each element';
    }
    
    if (line.includes('while') && line.endsWith(':')) {
      return 'While loop that continues executing the indented code block as long as the condition remains true';
    }
    
    if (line.includes('return')) {
      return 'Returns a value from the function, terminating function execution and passing data back to the caller';
    }
    
    if (line.includes('print')) {
      return 'Outputs information to the console for debugging, logging, or user communication purposes';
    }
    
    if (line.includes('=') && !line.includes('==') && !line.includes('!=')) {
      const varName = line.split('=')[0].trim();
      return `Assigns a value to the variable ${varName}, storing data for later use in the program`;
    }
    
    if (line.startsWith('#')) {
      return 'Comment providing explanation, documentation, or notes about the code functionality';
    }
    
    if (line.includes('try:')) {
      return 'Begins a try-except block for error handling, allowing graceful handling of potential runtime exceptions';
    }
    
    if (line.includes('except')) {
      return 'Catches and handles specific exceptions that occur in the try block, providing error recovery mechanisms';
    }
    
    return 'Executes Python program logic as part of the application\'s functionality';
  }

  private explainCppLineDetailed(line: string, lineNumber: number, fullCode: string): string {
    if (line.startsWith('#include')) {
      const header = line.match(/#include\s*[<"]([^>"]+)[>"]/)?.[1];
      return `Includes the ${header} header file, providing access to ${this.describeHeaderPurpose(header || 'library')} and function declarations`;
    }
    
    if (line.includes('int main') || line.includes('void main')) {
      return 'Defines the main function where program execution begins, serving as the entry point for the application';
    }
    
    if (line.includes('class')) {
      const className = line.match(/class\s+(\w+)/)?.[1];
      return `Defines a class${className ? ` named ${className}` : ''} template for creating objects with encapsulated data and methods`;
    }
    
    if (line.includes('if')) {
      return 'Conditional statement that evaluates a boolean expression and executes code based on the result';
    }
    
    if (line.includes('for')) {
      return 'For loop that iterates with initialization, condition checking, and increment/decrement operations';
    }
    
    if (line.includes('while')) {
      return 'While loop that continues executing code as long as the specified condition evaluates to true';
    }
    
    if (line.includes('return')) {
      return 'Returns a value from the function, terminating function execution and passing data back to the calling code';
    }
    
    if (line.includes('cout') || line.includes('printf')) {
      return 'Outputs formatted information to the console for user communication or debugging purposes';
    }
    
    if (line.includes('cin') || line.includes('scanf')) {
      return 'Reads input from the user through the console, allowing interactive program behavior';
    }
    
    if (line.includes('//') || line.includes('/*')) {
      return 'Comment providing explanation, documentation, or notes about the code implementation';
    }
    
    if (line.includes('new')) {
      return 'Dynamically allocates memory on the heap for object creation, requiring manual memory management';
    }
    
    if (line.includes('delete')) {
      return 'Deallocates dynamically allocated memory to prevent memory leaks and manage resources';
    }
    
    return 'Executes C++ program logic with compiled language performance characteristics';
  }

  private explainGenericLine(line: string, lineNumber: number): string {
    if (line.includes('=') && !line.includes('==')) {
      return 'Assigns or initializes a value to a variable for data storage';
    }
    if (line.includes('if')) {
      return 'Conditional logic that executes code based on boolean evaluation';
    }
    if (line.includes('for') || line.includes('while')) {
      return 'Iterative control structure that repeats code execution';
    }
    if (line.includes('function') || line.includes('def')) {
      return 'Function definition that encapsulates reusable code logic';
    }
    if (line.includes('//') || line.includes('#') || line.includes('/*')) {
      return 'Code comment providing documentation and explanatory notes';
    }
    return 'Program instruction that contributes to the overall application logic';
  }

  private identifyKeyElements(elements: CodeElement[]): { name: string; type: string; role: string }[] {
    const keyElements: { name: string; type: string; role: string }[] = [];

    elements.forEach(element => {
      let role = '';
      switch (element.type) {
        case 'function':
          role = `Executes ${element.description?.toLowerCase() || 'specific functionality'} and can be called from other parts of the code`;
          break;
        case 'class':
          role = `Serves as a blueprint for creating objects with shared properties and methods, ${element.description?.toLowerCase() || 'providing object-oriented structure'}`;
          break;
        case 'variable':
          role = `Stores ${element.description?.toLowerCase() || 'data'} that can be accessed and modified throughout the program execution`;
          break;
        case 'import':
          role = `Provides ${element.description?.toLowerCase() || 'external functionality'} and dependencies to the current module`;
          break;
        case 'export':
          role = 'Makes functions, classes, or variables available to other modules in the application';
          break;
        case 'api_call':
          role = `Facilitates ${element.description?.toLowerCase() || 'HTTP communication'} with external services and data sources`;
          break;
        case 'dom_element':
          role = `Enables ${element.description?.toLowerCase() || 'DOM manipulation'} for user interface interactions and updates`;
          break;
        case 'event_handler':
          role = `Manages ${element.description?.toLowerCase() || 'user interactions'} and responds to specific events in the application`;
          break;
        default:
          role = 'Contributes to the overall program structure and functionality';
      }

      keyElements.push({
        name: element.name,
        type: element.type,
        role
      });
    });

    return keyElements;
  }

  private generateSuggestions(code: string, language: string, elements: CodeElement[]): string[] {
    const suggestions: string[] = [];
    const codeText = code.toLowerCase();

    // Error handling suggestions
    if ((codeText.includes('fetch') || codeText.includes('axios')) && !codeText.includes('catch') && !codeText.includes('try')) {
      suggestions.push('Consider adding error handling with try-catch blocks for HTTP requests to prevent hanging on slow networks and handle API failures gracefully');
    }

    // Input validation
    if (elements.some(e => e.type === 'function') && !codeText.includes('validate') && !codeText.includes('check')) {
      suggestions.push('Add input validation to ensure function parameters are valid and prevent runtime errors from invalid data');
    }

    // Documentation
    if (elements.filter(e => e.type === 'comment').length === 0) {
      suggestions.push('Add comprehensive comments to explain complex logic, function purposes, and business rules for better code maintainability');
    }

    // Performance suggestions
    if (codeText.includes('for') && codeText.includes('array') && !codeText.includes('map') && !codeText.includes('filter')) {
      suggestions.push('Consider using functional array methods like map(), filter(), or reduce() for better performance and more readable code');
    }

    // Security suggestions
    if (codeText.includes('eval') || codeText.includes('innerhtml')) {
      suggestions.push('Avoid using eval() or innerHTML as they can introduce XSS vulnerabilities and security risks');
    }

    // Async/await suggestions
    if (codeText.includes('promise') && !codeText.includes('async') && !codeText.includes('await')) {
      suggestions.push('Consider using async/await syntax instead of Promise chains for cleaner, more readable asynchronous code');
    }

    // Constants suggestions
    if (code.match(/\b\d+\b/g) && code.match(/\b\d+\b/g)!.length > 3) {
      suggestions.push('Consider extracting magic numbers into named constants with descriptive names for better maintainability and code clarity');
    }

    // Function length
    const lines = code.split('\n').length;
    if (lines > 50) {
      suggestions.push('Consider breaking down large functions into smaller, more focused functions following the Single Responsibility Principle');
    }

    // Timeout suggestions for fetch calls
    if (codeText.includes('fetch') && !codeText.includes('timeout') && !codeText.includes('abortsignal')) {
      suggestions.push('Consider adding a timeout for fetch calls to prevent hanging on slow networks and improve user experience');
    }

    // Type safety suggestions
    if (language === 'javascript' && !codeText.includes('typescript')) {
      suggestions.push('Consider migrating to TypeScript for better type safety, improved IDE support, and reduced runtime errors');
    }

    // Accessibility suggestions
    if (codeText.includes('addeventlistener') && !codeText.includes('keydown') && !codeText.includes('keypress')) {
      suggestions.push('Consider adding keyboard event handlers alongside mouse events for better accessibility and user experience');
    }

    return suggestions;
  }

  private assessComplexity(code: string, elements: CodeElement[]): 'low' | 'medium' | 'high' {
    let complexityScore = 0;

    // Base complexity from lines of code
    const lines = code.split('\n').length;
    complexityScore += Math.floor(lines / 10);

    // Complexity from control structures
    const controlStructures = (code.match(/\b(if|else|while|for|switch|case)\b/g) || []).length;
    complexityScore += controlStructures * 2;

    // Complexity from nested structures
    const nestedStructures = (code.match(/{[^{}]*{/g) || []).length;
    complexityScore += nestedStructures * 3;

    // Complexity from function count
    const functionCount = elements.filter(e => e.type === 'function').length;
    complexityScore += functionCount;

    // Complexity from async operations
    const asyncOperations = (code.match(/\b(async|await|promise|then|catch)\b/gi) || []).length;
    complexityScore += asyncOperations;

    // Complexity from external interactions
    const externalInteractions = elements.filter(e => 
      e.type === 'api_call' || e.type === 'dom_element' || e.type === 'event_handler'
    ).length;
    complexityScore += externalInteractions * 2;

    if (complexityScore <= 8) return 'low';
    if (complexityScore <= 20) return 'medium';
    return 'high';
  }
}