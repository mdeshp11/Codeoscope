export interface ComponentNode {
  id: string;
  name: string;
  type: 'class' | 'function' | 'module' | 'service' | 'component' | 'config' | 'external';
  file: string;
  dependencies: string[];
  exports: string[];
  imports: string[];
  description?: string;
  layer: 'presentation' | 'business' | 'data' | 'infrastructure' | 'external';
  complexity: number;
  lines: number;
}

export interface SystemBoundary {
  id: string;
  name: string;
  components: string[];
  type: 'system' | 'container' | 'component';
  description?: string;
}

export interface ArchitectureData {
  components: ComponentNode[];
  boundaries: SystemBoundary[];
  relationships: Relationship[];
  metadata: {
    totalFiles: number;
    totalComponents: number;
    analysisDate: string;
    repositoryUrl: string;
    mainLanguages: string[];
  };
}

export interface Relationship {
  from: string;
  to: string;
  type: 'imports' | 'calls' | 'extends' | 'implements' | 'uses' | 'configures';
  description?: string;
  weight: number;
}

export interface AnalysisProgress {
  stage: 'fetching' | 'parsing' | 'analyzing' | 'generating' | 'complete';
  progress: number;
  currentFile?: string;
  message: string;
}