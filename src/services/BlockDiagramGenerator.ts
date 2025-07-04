import { ArchitectureData, ComponentNode } from '../types/architecture';

export class BlockDiagramGenerator {
  private svg: string = '';
  private width: number = 1200;
  private height: number = 800;
  private blockWidth: number = 180;
  private blockHeight: number = 120;
  private padding: number = 20;
  private zoomLevel: number = 1;

  async generateBlockDiagram(data: ArchitectureData): Promise<string> {
    const { components, relationships } = data;
    
    // Create a simplified block diagram using SVG
    this.width = 1200;
    this.height = 800;
    this.blockWidth = 180;
    this.blockHeight = 120;
    this.padding = 20;
    
    // Group components by layer
    const layerGroups = this.groupComponentsByLayer(components);
    const layers = Object.keys(layerGroups);
    
    this.svg = `
      <svg width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}" xmlns="http://www.w3.org/2000/svg" id="block-diagram-svg">
        <defs>
          <style>
            .block-title { font-family: Inter, sans-serif; font-size: 14px; font-weight: 600; fill: #1f2937; }
            .block-subtitle { font-family: Inter, sans-serif; font-size: 11px; fill: #6b7280; }
            .block-stats { font-family: Inter, sans-serif; font-size: 10px; fill: #9ca3af; }
            .layer-title { font-family: Inter, sans-serif; font-size: 16px; font-weight: 700; fill: #374151; }
            .connection-line { stroke: #6b7280; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
          </style>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
          </marker>
        </defs>
        
        <!-- Background -->
        <rect width="${this.width}" height="${this.height}" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
    `;
    
    // Calculate layout
    const layerHeight = (this.height - this.padding * 2) / layers.length;
    const positions = new Map<string, { x: number; y: number }>();
    
    layers.forEach((layer, layerIndex) => {
      const layerComponents = layerGroups[layer];
      const componentsPerRow = Math.ceil(Math.sqrt(layerComponents.length));
      const rowHeight = layerHeight / Math.ceil(layerComponents.length / componentsPerRow);
      
      // Layer background
      const layerY = this.padding + layerIndex * layerHeight;
      const layerColor = this.getLayerColor(layer);
      
      this.svg += `
        <rect x="${this.padding}" y="${layerY}" width="${this.width - this.padding * 2}" height="${layerHeight - 10}" 
              fill="${layerColor.background}" stroke="${layerColor.border}" stroke-width="1" rx="8"/>
        <text x="${this.padding + 15}" y="${layerY + 25}" class="layer-title">${layer.toUpperCase()} LAYER</text>
      `;
      
      // Position components within layer
      layerComponents.forEach((component, index) => {
        const row = Math.floor(index / componentsPerRow);
        const col = index % componentsPerRow;
        const x = this.padding + 40 + col * (this.blockWidth + 20);
        const y = layerY + 40 + row * (this.blockHeight + 15);
        
        positions.set(component.id, { x, y });
        
        // Draw component block
        const blockColor = this.getComponentColor(component);
        const complexity = this.getComplexityIndicator(component.complexity);
        
        this.svg += `
          <g transform="translate(${x}, ${y})">
            <!-- Block background -->
            <rect width="${this.blockWidth}" height="${this.blockHeight}" fill="${blockColor.background}" 
                  stroke="${blockColor.border}" stroke-width="2" rx="6"/>
            
            <!-- Component icon -->
            <circle cx="20" cy="20" r="8" fill="${blockColor.border}"/>
            <text x="20" y="25" text-anchor="middle" class="block-stats">${this.getComponentIcon(component.type)}</text>
            
            <!-- Component name -->
            <text x="35" y="25" class="block-title">${this.truncateText(component.name, 18)}</text>
            
            <!-- Component type -->
            <text x="35" y="40" class="block-subtitle">${component.type}</text>
            
            <!-- File path -->
            <text x="10" y="60" class="block-stats">${this.truncateText(component.file, 25)}</text>
            
            <!-- Statistics -->
            <text x="10" y="80" class="block-stats">Lines: ${component.lines}</text>
            <text x="10" y="95" class="block-stats">Complexity: ${component.complexity} ${complexity}</text>
            <text x="10" y="110" class="block-stats">Dependencies: ${component.dependencies.length}</text>
            
            <!-- Complexity indicator -->
            <rect x="${this.blockWidth - 25}" y="10" width="15" height="15" fill="${complexity}" rx="2"/>
          </g>
        `;
      });
    });
    
    // Draw connections
    relationships.forEach(rel => {
      const fromPos = positions.get(rel.from);
      const toPos = positions.get(rel.to);
      
      if (fromPos && toPos) {
        const fromX = fromPos.x + this.blockWidth / 2;
        const fromY = fromPos.y + this.blockHeight;
        const toX = toPos.x + this.blockWidth / 2;
        const toY = toPos.y;
        
        // Create curved connection
        const midY = (fromY + toY) / 2;
        
        this.svg += `
          <path d="M ${fromX} ${fromY} Q ${fromX} ${midY} ${toX} ${toY}" 
                class="connection-line" opacity="0.7"/>
        `;
      }
    });
    
    this.svg += `
      <script>
        (function() {
          const svg = document.getElementById('block-diagram-svg');
          let currentZoom = 1;
          
          // Add zoom functionality
          function zoomIn() {
            currentZoom = Math.min(currentZoom + 0.2, 3);
            applyZoom();
          }
          
          function zoomOut() {
            currentZoom = Math.max(currentZoom - 0.2, 0.2);
            applyZoom();
          }
          
          function resetZoom() {
            currentZoom = 1;
            applyZoom();
          }
          
          function applyZoom() {
            svg.style.transform = \`scale(\${currentZoom})\`;
            svg.style.transformOrigin = 'top left';
          }
          
          // Expose functions to parent window
          if (window.parent) {
            window.parent.blockDiagramZoomIn = zoomIn;
            window.parent.blockDiagramZoomOut = zoomOut;
            window.parent.blockDiagramResetZoom = resetZoom;
          }
        })();
      </script>
    `;
    
    this.svg += '</svg>';
    
    return this.svg;
  }
  
  // Method to apply zoom programmatically
  public applyZoom(zoomLevel: number): void {
    this.zoomLevel = zoomLevel;
  }
  
  private groupComponentsByLayer(components: ComponentNode[]) {
    return components.reduce((groups, component) => {
      if (!groups[component.layer]) {
        groups[component.layer] = [];
      }
      groups[component.layer].push(component);
      return groups;
    }, {} as Record<string, ComponentNode[]>);
  }
  
  private getLayerColor(layer: string) {
    const colors = {
      presentation: { background: '#dbeafe', border: '#3b82f6' },
      business: { background: '#f3e8ff', border: '#8b5cf6' },
      data: { background: '#dcfce7', border: '#22c55e' },
      infrastructure: { background: '#fed7aa', border: '#f97316' },
      external: { background: '#fecaca', border: '#ef4444' }
    };
    return colors[layer as keyof typeof colors] || colors.business;
  }
  
  private getComponentColor(component: ComponentNode) {
    const colors = {
      class: { background: '#e0f2fe', border: '#0891b2' },
      function: { background: '#fef3c7', border: '#f59e0b' },
      module: { background: '#e7e5e4', border: '#78716c' },
      service: { background: '#ecfdf5', border: '#10b981' },
      component: { background: '#ede9fe', border: '#7c3aed' },
      config: { background: '#fef2f2', border: '#dc2626' }
    };
    return colors[component.type] || colors.module;
  }
  
  private getComponentIcon(type: ComponentNode['type']): string {
    const icons = {
      class: 'C',
      function: 'F',
      module: 'M',
      service: 'S',
      component: 'R',
      config: '⚙'
    };
    return icons[type] || 'M';
  }
  
  private getComplexityIndicator(complexity: number): string {
    if (complexity <= 2) return '#22c55e'; // Green
    if (complexity <= 5) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }
  
  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }
}