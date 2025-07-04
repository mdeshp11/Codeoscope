import { CodeFile } from '../types';

export const parseCodeStructure = (code: string, filename: string): CodeFile[] => {
  const files: CodeFile[] = [];
  const fileId = `file-${Date.now()}`;
  
  // Basic parsing for demonstration - in production, use a proper AST parser
  const lines = code.split('\n');
  let currentLine = 0;
  
  const mainFile: CodeFile = {
    id: fileId,
    name: filename,
    type: 'file',
    content: code,
    language: getLanguageFromFilename(filename),
    children: []
  };
  
  files.push(mainFile);
  
  // Simple regex patterns for different constructs
  const classPattern = /class\s+(\w+)/g;
  const functionPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=|(\w+)\s*:\s*\()/g;
  const methodPattern = /(\w+)\s*\([^)]*\)\s*{/g;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Find classes
    const classMatch = classPattern.exec(trimmedLine);
    if (classMatch) {
      const classId = `class-${Date.now()}-${index}`;
      const classFile: CodeFile = {
        id: classId,
        name: classMatch[1],
        type: 'class',
        content: trimmedLine,
        language: mainFile.language,
        parent: fileId,
        startLine: index + 1,
        endLine: index + 1, // Would need better parsing for actual end
        explanation: `Class ${classMatch[1]} definition`
      };
      files.push(classFile);
      mainFile.children?.push(classId);
    }
    
    // Find functions
    const functionMatch = functionPattern.exec(trimmedLine);
    if (functionMatch) {
      const funcName = functionMatch[1] || functionMatch[2] || functionMatch[3];
      if (funcName) {
        const funcId = `func-${Date.now()}-${index}`;
        const funcFile: CodeFile = {
          id: funcId,
          name: funcName,
          type: 'function',
          content: trimmedLine,
          language: mainFile.language,
          parent: fileId,
          startLine: index + 1,
          endLine: index + 1,
          explanation: `Function ${funcName} implementation`
        };
        files.push(funcFile);
        mainFile.children?.push(funcId);
      }
    }
  });
  
  return files;
};

export const getLanguageFromFilename = (filename: string): string => {
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
    rs: 'rust'
  };
  
  return languageMap[extension || ''] || 'text';
};

export const generateExplanation = (component: CodeFile): string => {
  // In production, this would call an LLM API
  const explanations = [
    `This ${component.type} handles core business logic and implements key functionality.`,
    `Designed with separation of concerns in mind, this component provides clean abstraction.`,
    `Implements industry best practices for maintainability and testability.`,
    `Uses common design patterns to ensure scalable and readable code architecture.`
  ];
  
  return explanations[Math.floor(Math.random() * explanations.length)];
};