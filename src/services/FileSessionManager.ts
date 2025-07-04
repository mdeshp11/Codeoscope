export interface StoredFile {
  id: string;
  name: string;
  content: string;
  language: string;
  size: number;
  uploadedAt: number;
  lastAnalyzed?: number;
}

export interface FileUploadState {
  files: StoredFile[];
  isAnalyzing: boolean;
  lastUploadTime?: number;
}

export class FileSessionManager {
  private static instance: FileSessionManager;
  private files: Map<string, StoredFile> = new Map();
  private listeners: Set<(state: FileUploadState) => void> = new Set();

  private constructor() {}

  static getInstance(): FileSessionManager {
    if (!FileSessionManager.instance) {
      FileSessionManager.instance = new FileSessionManager();
    }
    return FileSessionManager.instance;
  }

  // Subscribe to state changes
  subscribe(listener: (state: FileUploadState) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners of state changes
  private notifyListeners(): void {
    const state: FileUploadState = {
      files: Array.from(this.files.values()),
      isAnalyzing: false,
      lastUploadTime: this.getLastUploadTime()
    };
    
    this.listeners.forEach(listener => listener(state));
  }

  // Add files to session storage
  addFiles(files: File[]): Promise<StoredFile[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const storedFiles: StoredFile[] = [];
        
        for (const file of files) {
          // Validate file
          if (!this.isValidFile(file)) {
            console.warn(`Skipping invalid file: ${file.name}`);
            continue;
          }

          // Check if file already exists
          const existingFile = this.findFileByNameAndSize(file.name, file.size);
          if (existingFile) {
            console.warn(`File already exists: ${file.name}`);
            continue;
          }

          // Read file content
          const content = await this.readFileContent(file);
          const language = this.getLanguageFromFilename(file.name);

          const storedFile: StoredFile = {
            id: this.generateFileId(),
            name: file.name,
            content,
            language,
            size: file.size,
            uploadedAt: Date.now()
          };

          this.files.set(storedFile.id, storedFile);
          storedFiles.push(storedFile);
        }

        this.notifyListeners();
        resolve(storedFiles);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get all stored files
  getFiles(): StoredFile[] {
    return Array.from(this.files.values()).sort((a, b) => b.uploadedAt - a.uploadedAt);
  }

  // Get file by ID
  getFile(id: string): StoredFile | undefined {
    return this.files.get(id);
  }

  // Check if any files are stored
  hasFiles(): boolean {
    return this.files.size > 0;
  }

  // Get total file count
  getFileCount(): number {
    return this.files.size;
  }

  // Clear all files
  clearFiles(): void {
    this.files.clear();
    this.notifyListeners();
  }

  // Remove specific file
  removeFile(id: string): boolean {
    const removed = this.files.delete(id);
    if (removed) {
      this.notifyListeners();
    }
    return removed;
  }

  // Mark file as analyzed
  markFileAnalyzed(id: string): void {
    const file = this.files.get(id);
    if (file) {
      file.lastAnalyzed = Date.now();
      this.notifyListeners();
    }
  }

  // Get files summary
  getFilesSummary(): {
    totalFiles: number;
    totalSize: number;
    languages: string[];
    oldestUpload?: number;
    newestUpload?: number;
  } {
    const files = this.getFiles();
    
    if (files.length === 0) {
      return {
        totalFiles: 0,
        totalSize: 0,
        languages: []
      };
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const languages = [...new Set(files.map(file => file.language))];
    const uploadTimes = files.map(file => file.uploadedAt);

    return {
      totalFiles: files.length,
      totalSize,
      languages,
      oldestUpload: Math.min(...uploadTimes),
      newestUpload: Math.max(...uploadTimes)
    };
  }

  // Private helper methods
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isValidFile(file: File): boolean {
    const maxSize = 1024 * 1024; // 1MB
    const supportedExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
      '.php', '.rb', '.go', '.rs', '.html', '.css', '.json', '.md', '.vue',
      '.svelte', '.scala', '.kt', '.swift', '.dart', '.lua', '.pl', '.r'
    ];

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return file.size <= maxSize && supportedExtensions.includes(extension);
  }

  private findFileByNameAndSize(name: string, size: number): StoredFile | undefined {
    return Array.from(this.files.values()).find(file => 
      file.name === name && file.size === size
    );
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsText(file);
    });
  }

  private getLanguageFromFilename(filename: string): string {
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
      json: 'json',
      md: 'markdown',
      vue: 'vue',
      svelte: 'svelte',
      scala: 'scala',
      kt: 'kotlin',
      swift: 'swift',
      dart: 'dart',
      lua: 'lua',
      pl: 'perl',
      r: 'r'
    };
    return languageMap[extension || ''] || 'text';
  }

  private getLastUploadTime(): number | undefined {
    const files = this.getFiles();
    return files.length > 0 ? Math.max(...files.map(f => f.uploadedAt)) : undefined;
  }
}