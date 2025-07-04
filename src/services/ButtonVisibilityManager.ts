export interface ButtonState {
  id: string;
  element: HTMLElement | null;
  isVisible: boolean;
  revealOrder: number;
  revealDelay: number;
}

export interface AnalysisState {
  isAnalysisComplete: boolean;
  isReviewComplete: boolean;
  hasUserInteracted: boolean;
  analysisStartTime?: number;
  reviewStartTime?: number;
}

export class ButtonVisibilityManager {
  private static instance: ButtonVisibilityManager;
  private buttons: Map<string, ButtonState> = new Map();
  private analysisState: AnalysisState = {
    isAnalysisComplete: false,
    isReviewComplete: false,
    hasUserInteracted: false
  };
  private listeners: Set<(state: AnalysisState) => void> = new Set();
  private revealTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.injectStyles();
    this.setupGlobalListeners();
  }

  static getInstance(): ButtonVisibilityManager {
    if (!ButtonVisibilityManager.instance) {
      ButtonVisibilityManager.instance = new ButtonVisibilityManager();
    }
    return ButtonVisibilityManager.instance;
  }

  private injectStyles(): void {
    const styleId = 'button-visibility-manager-styles';
    
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .btn-hidden-analysis {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        transform: translateY(10px) scale(0.95) !important;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      
      .btn-revealing {
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
        transform: translateY(0) scale(1) !important;
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
      }
      
      .btn-reveal-glow {
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
        animation: reveal-pulse 2s ease-in-out !important;
      }
      
      @keyframes reveal-pulse {
        0%, 100% { 
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
          transform: scale(1.02);
        }
      }
      
      .btn-sequential-reveal {
        animation: sequential-reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
      }
      
      @keyframes sequential-reveal {
        0% {
          opacity: 0;
          transform: translateY(20px) scale(0.9);
        }
        60% {
          transform: translateY(-5px) scale(1.05);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .analysis-complete-indicator {
        position: relative;
      }
      
      .analysis-complete-indicator::after {
        content: '';
        position: absolute;
        top: -2px;
        right: -2px;
        width: 8px;
        height: 8px;
        background: linear-gradient(45deg, #10b981, #34d399);
        border-radius: 50%;
        animation: success-pulse 2s infinite;
      }
      
      @keyframes success-pulse {
        0%, 100% { 
          opacity: 1;
          transform: scale(1);
        }
        50% { 
          opacity: 0.7;
          transform: scale(1.2);
        }
      }
      
      .new-project-highlight {
        position: relative;
        overflow: hidden;
      }
      
      .new-project-highlight::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: shimmer 2s infinite;
      }
      
      @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
      }
      
      /* Ensure Analyze Files button is always visible */
      button[title*="Upload and analyze"] {
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
        transform: none !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  private setupGlobalListeners(): void {
    // Listen for analysis completion events
    document.addEventListener('analysisComplete', this.handleAnalysisComplete.bind(this));
    document.addEventListener('reviewComplete', this.handleReviewComplete.bind(this));
    document.addEventListener('userInteraction', this.handleUserInteraction.bind(this));
    
    // Listen for new project button clicks
    document.addEventListener('click', this.handleGlobalClick.bind(this));
  }

  // Register buttons for management (excluding Analyze Files button)
  registerButton(config: {
    id: string;
    selector: string;
    revealOrder: number;
    revealDelay?: number;
  }): void {
    // Skip registering the Analyze Files button - it should always be visible
    if (config.id === 'analyze-files' || config.selector.includes('Upload and analyze')) {
      return;
    }

    const element = document.querySelector(config.selector) as HTMLElement;
    
    if (element) {
      const buttonState: ButtonState = {
        id: config.id,
        element,
        isVisible: false,
        revealOrder: config.revealOrder,
        revealDelay: config.revealDelay || 0
      };
      
      this.buttons.set(config.id, buttonState);
      this.hideButton(config.id);
      
      console.log(`Registered button: ${config.id} with reveal order: ${config.revealOrder}`);
    } else {
      console.warn(`Button element not found for selector: ${config.selector}`);
    }
  }

  // Register multiple buttons at once
  registerButtons(configs: Array<{
    id: string;
    selector: string;
    revealOrder: number;
    revealDelay?: number;
  }>): void {
    configs.forEach(config => this.registerButton(config));
  }

  // Hide a specific button (except Analyze Files)
  hideButton(buttonId: string): void {
    if (buttonId === 'analyze-files') return; // Never hide Analyze Files button
    
    const button = this.buttons.get(buttonId);
    if (button?.element) {
      button.element.classList.add('btn-hidden-analysis');
      button.element.classList.remove('btn-revealing', 'btn-reveal-glow', 'btn-sequential-reveal');
      button.isVisible = false;
    }
  }

  // Hide all registered buttons (except Analyze Files)
  hideAllButtons(): void {
    this.buttons.forEach((_, buttonId) => {
      if (buttonId !== 'analyze-files') {
        this.hideButton(buttonId);
      }
    });
    console.log('All buttons hidden for analysis review (except Analyze Files)');
  }

  // Show a specific button with animation
  showButton(buttonId: string, withGlow: boolean = false): void {
    const button = this.buttons.get(buttonId);
    if (button?.element) {
      button.element.classList.remove('btn-hidden-analysis');
      button.element.classList.add('btn-revealing', 'btn-sequential-reveal');
      
      if (withGlow) {
        button.element.classList.add('btn-reveal-glow');
        // Remove glow after animation
        setTimeout(() => {
          button.element?.classList.remove('btn-reveal-glow');
        }, 2000);
      }
      
      button.isVisible = true;
      console.log(`Revealed button: ${buttonId}`);
    }
  }

  // Sequentially reveal all buttons (except Analyze Files which stays visible)
  revealButtonsSequentially(): void {
    if (this.revealTimeout) {
      clearTimeout(this.revealTimeout);
    }

    const sortedButtons = Array.from(this.buttons.values())
      .filter(button => button.id !== 'analyze-files') // Exclude Analyze Files from sequential reveal
      .sort((a, b) => a.revealOrder - b.revealOrder);

    console.log('Starting sequential button reveal...');
    
    sortedButtons.forEach((button, index) => {
      const baseDelay = index * 300; // 300ms between each button
      const totalDelay = baseDelay + button.revealDelay;
      
      setTimeout(() => {
        this.showButton(button.id, index === 0); // First button gets glow effect
        
        // Dispatch custom event for each button reveal
        document.dispatchEvent(new CustomEvent('buttonRevealed', {
          detail: { buttonId: button.id, order: button.revealOrder }
        }));
      }, totalDelay);
    });

    // Mark reveal as complete
    setTimeout(() => {
      this.analysisState.isReviewComplete = true;
      this.notifyListeners();
      
      document.dispatchEvent(new CustomEvent('allButtonsRevealed', {
        detail: { totalButtons: sortedButtons.length }
      }));
      
      console.log('Sequential button reveal completed');
    }, sortedButtons.length * 300 + 500);
  }

  // Handle analysis completion
  private handleAnalysisComplete(): void {
    this.analysisState.isAnalysisComplete = true;
    this.analysisState.analysisStartTime = Date.now();
    this.hideAllButtons(); // This will hide all buttons except Analyze Files
    this.highlightNewProjectButton();
    this.notifyListeners();
    
    console.log('Analysis completed - buttons hidden (except Analyze Files), waiting for review completion');
  }

  // Handle review completion
  private handleReviewComplete(): void {
    this.analysisState.isReviewComplete = true;
    this.analysisState.reviewStartTime = Date.now();
    this.notifyListeners();
    
    console.log('Review completed - ready for button reveal');
  }

  // Handle user interaction
  private handleUserInteraction(): void {
    this.analysisState.hasUserInteracted = true;
    this.notifyListeners();
  }

  // Handle global clicks to detect New Project button
  private handleGlobalClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Check if clicked element is the New Project button
    if (this.isNewProjectButton(target)) {
      this.handleNewProjectClick();
    }
  }

  private isNewProjectButton(element: HTMLElement): boolean {
    // Check various ways the New Project button might be identified
    const buttonText = element.textContent?.toLowerCase().trim();
    const isNewProjectText = buttonText === 'upload your project';
    const hasNewProjectClass = element.classList.contains('new-project-btn');
    const hasNewProjectData = element.hasAttribute('data-new-project');
    
    // Check parent elements as well (in case of nested elements)
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const parentText = parent.textContent?.toLowerCase().trim();
      if (parentText === 'upload your project' || parent.classList.contains('new-project-btn')) {
        return true;
      }
      parent = parent.parentElement;
    }
    
    return isNewProjectText || hasNewProjectClass || hasNewProjectData;
  }

  private handleNewProjectClick(): void {
    console.log('Upload your Project button clicked - initiating sequential reveal');
    
    // Only reveal if analysis is complete and user has reviewed
    if (this.analysisState.isAnalysisComplete) {
      this.removeNewProjectHighlight();
      this.revealButtonsSequentially();
      
      // Dispatch event for other components to listen to
      document.dispatchEvent(new CustomEvent('newProjectInitiated', {
        detail: { 
          analysisState: this.analysisState,
          buttonCount: this.buttons.size
        }
      }));
    }
  }

  // Highlight the New Project button
  private highlightNewProjectButton(): void {
    const newProjectButtons = document.querySelectorAll('button');
    newProjectButtons.forEach(button => {
      if (this.isNewProjectButton(button)) {
        button.classList.add('new-project-highlight');
        button.classList.add('analysis-complete-indicator');
      }
    });
  }

  // Remove New Project button highlight
  private removeNewProjectHighlight(): void {
    const newProjectButtons = document.querySelectorAll('button');
    newProjectButtons.forEach(button => {
      button.classList.remove('new-project-highlight');
      button.classList.remove('analysis-complete-indicator');
    });
  }

  // Subscribe to state changes
  subscribe(listener: (state: AnalysisState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.analysisState));
  }

  // Public methods for manual control
  public triggerAnalysisComplete(): void {
    document.dispatchEvent(new CustomEvent('analysisComplete'));
  }

  public triggerReviewComplete(): void {
    document.dispatchEvent(new CustomEvent('reviewComplete'));
  }

  public resetState(): void {
    this.analysisState = {
      isAnalysisComplete: false,
      isReviewComplete: false,
      hasUserInteracted: false
    };
    
    // Show all buttons except keep Analyze Files always visible
    this.buttons.forEach((_, buttonId) => {
      if (buttonId !== 'analyze-files') {
        this.showButton(buttonId);
      }
    });
    
    this.removeNewProjectHighlight();
    this.notifyListeners();
    
    console.log('Button visibility state reset (Analyze Files remains visible)');
  }

  // Get current state
  public getState(): AnalysisState {
    return { ...this.analysisState };
  }

  public getButtonStates(): ButtonState[] {
    return Array.from(this.buttons.values());
  }

  // Cleanup
  public cleanup(): void {
    if (this.revealTimeout) {
      clearTimeout(this.revealTimeout);
    }
    
    this.buttons.clear();
    this.listeners.clear();
    this.removeNewProjectHighlight();
    
    // Remove event listeners
    document.removeEventListener('analysisComplete', this.handleAnalysisComplete.bind(this));
    document.removeEventListener('reviewComplete', this.handleReviewComplete.bind(this));
    document.removeEventListener('userInteraction', this.handleUserInteraction.bind(this));
    document.removeEventListener('click', this.handleGlobalClick.bind(this));
  }
}

// React Hook for easy integration
export function useButtonVisibilityManager() {
  const [manager] = React.useState(() => ButtonVisibilityManager.getInstance());
  const [analysisState, setAnalysisState] = React.useState<AnalysisState>(manager.getState());

  React.useEffect(() => {
    const unsubscribe = manager.subscribe(setAnalysisState);
    return unsubscribe;
  }, [manager]);

  const registerButton = React.useCallback((config: {
    id: string;
    selector: string;
    revealOrder: number;
    revealDelay?: number;
  }) => {
    manager.registerButton(config);
  }, [manager]);

  const registerButtons = React.useCallback((configs: Array<{
    id: string;
    selector: string;
    revealOrder: number;
    revealDelay?: number;
  }>) => {
    manager.registerButtons(configs);
  }, [manager]);

  return {
    manager,
    analysisState,
    registerButton,
    registerButtons,
    triggerAnalysisComplete: manager.triggerAnalysisComplete.bind(manager),
    triggerReviewComplete: manager.triggerReviewComplete.bind(manager),
    resetState: manager.resetState.bind(manager)
  };
}