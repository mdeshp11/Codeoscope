export interface CodeFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  size?: number;
  children?: CodeFile[];
  explanation?: string;
  notes?: Note[];
  isExpanded?: boolean;
  repoInfo?: {
    owner: string;
    repo: string;
    branch: string;
  };
}

export interface Note {
  id: string;
  content: string;
  line?: number;
  timestamp: number;
  author: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  files: CodeFile[];
  createdAt: number;
  updatedAt: number;
  totalFiles: number;
  totalLines: number;
}

export interface UploadProgress {
  current: number;
  total: number;
  fileName: string;
}