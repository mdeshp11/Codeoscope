export interface UploadButtonConfig {
  // Button selectors or elements
  analyzeButton?: HTMLElement | string;
  analyzeFilesButton?: HTMLElement | string;
  
  // Upload input selectors or elements
  fileInput?: HTMLElement | string;
  folderInput?: HTMLElement | string;
  
  // Callback functions for custom handling
  onFileUploadStart?: () => void;
  onFolderUploadStart?: () => void;
  onUploadComplete?: () => void;
  onUploadError?: (error: Error) => void;
}

export class UploadButtonVisibilityHandler {
  private config: UploadButtonConfig;
  private fileInputElement: HTMLInputElement | null = null;
  private folderInputElement: HTMLInputElement | null = null;
  private analyzeButtonElement: HTMLElement | null = null;
  private analyzeFilesButtonElement: HTMLElement | null = null;
  private isInitialized = false;

  constructor(config: UploadButtonConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize(): void {
    try {
      // Get file input element
      if (this.config.fileInput) {
        this.fileInputElement = this.getElement(this.config.fileInput) as HTMLInputElement;
      }

      // Get folder input element
      if (this.config.folderInput) {
        this.folderInputElement = this.getElement(this.config.folderInput) as HTMLInputElement;
      }

      // Get analyze button elements
      if (this.config.analyzeButton) {
        this.analyzeButtonElement = this.getElement(this.config.analyzeButton);
      }

      if (this.config.analyzeFilesButton) {
        this.analyzeFilesButtonElement = this.getElement(this.config.analyzeFilesButton);
      }

      this.attachEventListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize UploadButtonVisibilityHandler:', error);
      if (this.config.onUploadError) {
        this.config.onUploadError(error as Error);
      }
    }
  }

  private getElement(selector: HTMLElement | string): HTMLElement | null {
    if (typeof selector === 'string') {
      return document.querySelector(selector);
    }
    return selector;
  }

  private attachEventListeners(): void {
    // File input event listener
    if (this.fileInputElement) {
      this.fileInputElement.addEventListener('change', this.handleFileInputChange.bind(this));
    }

    // Folder input event listener
    if (this.folderInputElement) {
      this.folderInputElement.addEventListener('change', this.handleFolderInputChange.bind(this));
    }
  }

  private handleFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      // Hide the purple "Analyze" button immediately
      this.hideAnalyzeButton();
      
      // Trigger callback
      if (this.config.onFileUploadStart) {
        this.config.onFileUploadStart();
      }

      // Simulate upload process completion after a delay
      this.simulateUploadProcess('files', files.length);
    }
  }

  private handleFolderInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      // Hide the pink "Analyze Files" button immediately
      this.hideAnalyzeFilesButton();
      
      // Trigger callback
      if (this.config.onFolderUploadStart) {
        this.config.onFolderUploadStart();
      }

      // Simulate upload process completion after a delay
      this.simulateUploadProcess('folder', files.length);
    }
  }

  private hideAnalyzeButton(): void {
    if (this.analyzeButtonElement) {
      this.analyzeButtonElement.style.display = 'none';
      this.analyzeButtonElement.style.visibility = 'hidden';
      this.analyzeButtonElement.setAttribute('data-upload-hidden', 'true');
    }
  }

  private hideAnalyzeFilesButton(): void {
    if (this.analyzeFilesButtonElement) {
      this.analyzeFilesButtonElement.style.display = 'none';
      this.analyzeFilesButtonElement.style.visibility = 'hidden';
      this.analyzeFilesButtonElement.setAttribute('data-upload-hidden', 'true');
    }
  }

  private showAnalyzeButton(): void {
    if (this.analyzeButtonElement) {
      this.analyzeButtonElement.style.display = '';
      this.analyzeButtonElement.style.visibility = '';
      this.analyzeButtonElement.removeAttribute('data-upload-hidden');
    }
  }

  private showAnalyzeFilesButton(): void {
    if (this.analyzeFilesButtonElement) {
      this.analyzeFilesButtonElement.style.display = '';
      this.analyzeFilesButtonElement.style.visibility = '';
      this.analyzeFilesButtonElement.removeAttribute('data-upload-hidden');
    }
  }

  private simulateUploadProcess(type: 'files' | 'folder', fileCount: number): void {
    // Simulate upload time based on file count (minimum 1 second, maximum 5 seconds)
    const uploadTime = Math.min(Math.max(fileCount * 100, 1000), 5000);

    setTimeout(() => {
      this.handleUploadComplete(type);
    }, uploadTime);
  }

  private handleUploadComplete(type: 'files' | 'folder'): void {
    // Show the appropriate button after upload completion
    if (type === 'files') {
      this.showAnalyzeButton();
    } else {
      this.showAnalyzeFilesButton();
    }

    // Trigger completion callback
    if (this.config.onUploadComplete) {
      this.config.onUploadComplete();
    }
  }

  // Public methods for manual control
  public hideButtonsManually(buttonType: 'analyze' | 'analyzeFiles' | 'both'): void {
    switch (buttonType) {
      case 'analyze':
        this.hideAnalyzeButton();
        break;
      case 'analyzeFiles':
        this.hideAnalyzeFilesButton();
        break;
      case 'both':
        this.hideAnalyzeButton();
        this.hideAnalyzeFilesButton();
        break;
    }
  }

  public showButtonsManually(buttonType: 'analyze' | 'analyzeFiles' | 'both'): void {
    switch (buttonType) {
      case 'analyze':
        this.showAnalyzeButton();
        break;
      case 'analyzeFiles':
        this.showAnalyzeFilesButton();
        break;
      case 'both':
        this.showAnalyzeButton();
        this.showAnalyzeFilesButton();
        break;
    }
  }

  public updateConfig(newConfig: Partial<UploadButtonConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.cleanup();
    this.initialize();
  }

  public cleanup(): void {
    // Remove event listeners
    if (this.fileInputElement) {
      this.fileInputElement.removeEventListener('change', this.handleFileInputChange.bind(this));
    }

    if (this.folderInputElement) {
      this.folderInputElement.removeEventListener('change', this.handleFolderInputChange.bind(this));
    }

    // Reset button visibility
    this.showAnalyzeButton();
    this.showAnalyzeFilesButton();

    this.isInitialized = false;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  // Static utility methods for quick setup
  static createForModal(modalSelector: string = '.upload-modal'): UploadButtonVisibilityHandler {
    return new UploadButtonVisibilityHandler({
      fileInput: `${modalSelector} input[type="file"]:not([webkitdirectory])`,
      folderInput: `${modalSelector} input[webkitdirectory]`,
      analyzeButton: `${modalSelector} .analyze-button, ${modalSelector} [data-analyze-button]`,
      analyzeFilesButton: `${modalSelector} .analyze-files-button, ${modalSelector} [data-analyze-files-button]`
    });
  }

  static createForHeader(): UploadButtonVisibilityHandler {
    return new UploadButtonVisibilityHandler({
      analyzeButton: 'header .analyze-button, header [data-analyze-button]',
      analyzeFilesButton: 'header .analyze-files-button, header [data-analyze-files-button]'
    });
  }
}

// Enhanced version with CSS class-based hiding for better performance
export class CSSUploadButtonHandler extends UploadButtonVisibilityHandler {
  private static readonly HIDDEN_CLASS = 'upload-hidden';
  private static readonly UPLOADING_CLASS = 'upload-in-progress';

  constructor(config: UploadButtonConfig) {
    super(config);
    this.injectCSS();
  }

  private injectCSS(): void {
    const styleId = 'upload-button-handler-styles';
    
    // Check if styles already exist
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .${CSSUploadButtonHandler.HIDDEN_CLASS} {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 0.3s ease-in-out;
      }
      
      .${CSSUploadButtonHandler.UPLOADING_CLASS} {
        opacity: 0.6 !important;
        pointer-events: none !important;
        cursor: not-allowed !important;
        transition: opacity 0.2s ease-in-out;
      }
      
      .${CSSUploadButtonHandler.UPLOADING_CLASS}::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 16px;
        height: 16px;
        margin: -8px 0 0 -8px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: upload-spinner 1s linear infinite;
      }
      
      @keyframes upload-spinner {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(style);
  }

  protected hideAnalyzeButton(): void {
    if (this.analyzeButtonElement) {
      this.analyzeButtonElement.classList.add(CSSUploadButtonHandler.HIDDEN_CLASS);
      this.analyzeButtonElement.setAttribute('data-upload-hidden', 'true');
    }
  }

  protected hideAnalyzeFilesButton(): void {
    if (this.analyzeFilesButtonElement) {
      this.analyzeFilesButtonElement.classList.add(CSSUploadButtonHandler.HIDDEN_CLASS);
      this.analyzeFilesButtonElement.setAttribute('data-upload-hidden', 'true');
    }
  }

  protected showAnalyzeButton(): void {
    if (this.analyzeButtonElement) {
      this.analyzeButtonElement.classList.remove(CSSUploadButtonHandler.HIDDEN_CLASS);
      this.analyzeButtonElement.classList.remove(CSSUploadButtonHandler.UPLOADING_CLASS);
      this.analyzeButtonElement.removeAttribute('data-upload-hidden');
    }
  }

  protected showAnalyzeFilesButton(): void {
    if (this.analyzeFilesButtonElement) {
      this.analyzeFilesButtonElement.classList.remove(CSSUploadButtonHandler.HIDDEN_CLASS);
      this.analyzeFilesButtonElement.classList.remove(CSSUploadButtonHandler.UPLOADING_CLASS);
      this.analyzeFilesButtonElement.removeAttribute('data-upload-hidden');
    }
  }

  public setUploadingState(buttonType: 'analyze' | 'analyzeFiles' | 'both'): void {
    switch (buttonType) {
      case 'analyze':
        if (this.analyzeButtonElement) {
          this.analyzeButtonElement.classList.add(CSSUploadButtonHandler.UPLOADING_CLASS);
        }
        break;
      case 'analyzeFiles':
        if (this.analyzeFilesButtonElement) {
          this.analyzeFilesButtonElement.classList.add(CSSUploadButtonHandler.UPLOADING_CLASS);
        }
        break;
      case 'both':
        if (this.analyzeButtonElement) {
          this.analyzeButtonElement.classList.add(CSSUploadButtonHandler.UPLOADING_CLASS);
        }
        if (this.analyzeFilesButtonElement) {
          this.analyzeFilesButtonElement.classList.add(CSSUploadButtonHandler.UPLOADING_CLASS);
        }
        break;
    }
  }
}

// React Hook for easy integration
export function useUploadButtonHandler(config: UploadButtonConfig) {
  const [handler, setHandler] = React.useState<UploadButtonVisibilityHandler | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const newHandler = new CSSUploadButtonHandler(config);
    setHandler(newHandler);
    setIsReady(newHandler.isReady());

    return () => {
      newHandler.cleanup();
    };
  }, []);

  const hideButtons = React.useCallback((buttonType: 'analyze' | 'analyzeFiles' | 'both') => {
    handler?.hideButtonsManually(buttonType);
  }, [handler]);

  const showButtons = React.useCallback((buttonType: 'analyze' | 'analyzeFiles' | 'both') => {
    handler?.showButtonsManually(buttonType);
  }, [handler]);

  return {
    handler,
    isReady,
    hideButtons,
    showButtons
  };
}