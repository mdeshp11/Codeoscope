import { CodeFile } from '../types';

export const processUploadedFiles = async (files: FileList | File[], projectName: string): Promise<CodeFile[]> => {
  const processedFiles: CodeFile[] = [];
  const fileMap = new Map<string, CodeFile>();
  
  // Convert FileList to Array if needed
  const fileArray = Array.from(files);
  
  // First pass: create all file objects with full recursive structure
  for (const file of fileArray) {
    const path = getFilePath(file);
    const pathParts = path.split('/').filter(part => part.length > 0);
    const fileName = pathParts[pathParts.length - 1];
    
    // Skip hidden files and common build/dependency directories
    if (shouldSkipFile(path)) continue;
    
    const content = await readFileContent(file);
    const language = getLanguageFromFilename(fileName);
    
    const codeFile: CodeFile = {
      id: generateId(),
      name: fileName,
      path: path,
      type: 'file',
      content,
      language,
      size: file.size,
      children: []
    };
    
    fileMap.set(path, codeFile);
    processedFiles.push(codeFile);
  }
  
  // Second pass: create comprehensive folder structure
  const folderMap = new Map<string, CodeFile>();
  
  // Create all necessary parent folders
  for (const file of processedFiles) {
    const pathParts = file.path.split('/').filter(part => part.length > 0);
    
    // Create folders for each level of the path
    for (let i = 0; i < pathParts.length - 1; i++) {
      const folderPath = pathParts.slice(0, i + 1).join('/');
      
      if (!folderMap.has(folderPath)) {
        const folderFile: CodeFile = {
          id: generateId(),
          name: pathParts[i],
          path: folderPath,
          type: 'folder',
          children: []
        };
        
        folderMap.set(folderPath, folderFile);
      }
    }
  }
  
  // Third pass: build complete hierarchical structure
  const allFiles = [...Array.from(folderMap.values()), ...processedFiles];
  const rootFiles: CodeFile[] = [];
  
  // Create parent-child relationships
  for (const file of allFiles) {
    const pathParts = file.path.split('/').filter(part => part.length > 0);
    
    if (pathParts.length === 1) {
      // Root level file/folder
      rootFiles.push(file);
    } else {
      // Find parent folder and add as child
      const parentPath = pathParts.slice(0, -1).join('/');
      const parent = folderMap.get(parentPath);
      
      if (parent && parent.children) {
        parent.children.push(file);
      }
    }
  }
  
  // Fourth pass: recursively sort all levels
  const sortFiles = (files: CodeFile[]): CodeFile[] => {
    return files.sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      // Alphabetical sorting within same type
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
  };
  
  const sortRecursively = (files: CodeFile[]): CodeFile[] => {
    const sorted = sortFiles(files);
    sorted.forEach(file => {
      if (file.children && file.children.length > 0) {
        file.children = sortRecursively(file.children);
      }
    });
    return sorted;
  };
  
  return sortRecursively(rootFiles);
};

const getFilePath = (file: File): string => {
  // For modern browsers with webkitRelativePath (folder upload)
  if ('webkitRelativePath' in file && file.webkitRelativePath) {
    return file.webkitRelativePath;
  }
  
  // For drag and drop with full path support
  if ('fullPath' in file && (file as any).fullPath) {
    return (file as any).fullPath.startsWith('/') ? (file as any).fullPath.slice(1) : (file as any).fullPath;
  }
  
  // Fallback to just filename
  return file.name;
};

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string || '');
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Only read text files to avoid memory issues with binary files
    if (isTextFile(file.name)) {
      reader.readAsText(file);
    } else {
      resolve(`// Binary file: ${file.name} (${formatFileSize(file.size)})\n// Content not displayed to preserve memory`);
    }
  });
};

const shouldSkipFile = (path: string): boolean => {
  const skipPatterns = [
    /^\./, // Hidden files starting with dot
    /\/\./,  // Hidden files in subdirectories
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    /coverage/,
    /\.next/,
    /\.nuxt/,
    /\.vscode/,
    /\.idea/,
    /\.DS_Store/,
    /package-lock\.json/,
    /yarn\.lock/,
    /\.log$/,
    /\.tmp$/,
    /\.cache/,
    /\.env$/,
    /\.env\./,
    /thumbs\.db$/i,
    /desktop\.ini$/i
  ];
  
  return skipPatterns.some(pattern => pattern.test(path));
};

const isTextFile = (filename: string): boolean => {
  const textExtensions = [
    // Programming languages
    'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs',
    'h', 'hpp', 'hxx', 'cc', 'cxx', 'swift', 'kt', 'scala', 'clj', 'hs', 'elm', 'dart',
    'lua', 'pl', 'r', 'matlab', 'm', 'vb', 'pas', 'asm', 's',
    
    // Web technologies
    'html', 'htm', 'css', 'scss', 'sass', 'less', 'vue', 'svelte', 'jsx', 'tsx',
    
    // Data formats
    'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'properties',
    
    // Documentation
    'md', 'txt', 'rst', 'adoc', 'tex', 'rtf',
    
    // Configuration
    'dockerfile', 'makefile', 'cmake', 'gradle', 'maven', 'ant',
    'gitignore', 'gitattributes', 'editorconfig', 'eslintrc', 'prettierrc',
    
    // Scripts
    'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
    
    // Database
    'sql', 'graphql', 'gql',
    
    // Other
    'log', 'csv', 'tsv', 'env', 'lock'
  ];
  
  const extension = filename.split('.').pop()?.toLowerCase();
  
  // Check for files without extensions that are typically text
  const textFilenames = [
    'readme', 'license', 'changelog', 'contributing', 'authors', 'contributors',
    'makefile', 'dockerfile', 'gemfile', 'rakefile', 'procfile'
  ];
  
  const baseFilename = filename.toLowerCase().split('.')[0];
  
  return textExtensions.includes(extension || '') || textFilenames.includes(baseFilename);
};

const getLanguageFromFilename = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  const languageMap: { [key: string]: string } = {
    // JavaScript/TypeScript
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    mjs: 'javascript',
    cjs: 'javascript',
    
    // Python
    py: 'python',
    pyw: 'python',
    pyx: 'python',
    
    // Java/JVM
    java: 'java',
    kt: 'kotlin',
    scala: 'scala',
    clj: 'clojure',
    
    // C/C++
    c: 'c',
    cpp: 'cpp',
    cxx: 'cpp',
    cc: 'cpp',
    h: 'c',
    hpp: 'cpp',
    hxx: 'cpp',
    
    // C#
    cs: 'csharp',
    
    // Web
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    
    // Other languages
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    dart: 'dart',
    lua: 'lua',
    pl: 'perl',
    r: 'r',
    
    // Data/Config
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    ini: 'ini',
    
    // Documentation
    md: 'markdown',
    rst: 'restructuredtext',
    tex: 'latex',
    
    // Scripts
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',
    ps1: 'powershell',
    bat: 'batch',
    cmd: 'batch',
    
    // Database
    sql: 'sql',
    graphql: 'graphql',
    gql: 'graphql',
    
    // Framework specific
    vue: 'vue',
    svelte: 'svelte',
    
    // Build tools
    cmake: 'cmake',
    make: 'makefile',
    gradle: 'gradle'
  };
  
  return languageMap[extension || ''] || 'text';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const generateId = (): string => {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};