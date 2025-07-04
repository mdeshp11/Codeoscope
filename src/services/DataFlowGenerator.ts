import * as d3 from 'd3';
import { ArchitectureData, ComponentNode, Relationship } from '../types/architecture';

export class DataFlowGenerator {
  private simulation: any = null;
  private svg: any = null;
  private zoomHandler: any = null;
  
  async generateDataFlowDiagram(data: ArchitectureData, container: HTMLElement): Promise<void> {
    // Clear previous content
    d3.select(container).selectAll('*').remove();
    
    const { components, relationships } = data;
    
    // Set up dimensions
    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    
    // Create SVG
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', '#f9fafb');
    
    // Create definitions for arrows and patterns
    const defs = this.svg.append('defs');
    
    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#6b7280');
    
    // Create data flow nodes
    const nodes = this.createDataFlowNodes(components);
    const links = this.createDataFlowLinks(relationships, nodes);
    
    // Create force simulation
    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60));
    
    // Create container groups
    const g = this.svg.append('g');
    
    // Add zoom behavior
    this.zoomHandler = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    this.svg.call(this.zoomHandler as any);
    
    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#6b7280')
      .attr('stroke-width', (d: any) => Math.sqrt(d.weight) * 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');
    
    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', (event, d: any) => {
          if (!event.active) this.simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) this.simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);
    
    // Add node circles
    node.append('circle')
      .attr('r', (d: any) => this.getNodeRadius(d))
      .attr('fill', (d: any) => this.getNodeColor(d))
      .attr('stroke', (d: any) => this.getNodeStrokeColor(d))
      .attr('stroke-width', 2);
    
    // Add node labels
    node.append('text')
      .text((d: any) => d.name)
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#1f2937');
    
    // Add node type indicators
    node.append('text')
      .text((d: any) => this.getDataFlowIcon(d.flowType))
      .attr('x', 0)
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('fill', (d: any) => this.getNodeStrokeColor(d));
    
    // Add tooltips
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');
    
    node
      .on('mouseover', (event, d: any) => {
        tooltip.style('visibility', 'visible')
          .html(this.createTooltipContent(d));
      })
      .on('mousemove', (event) => {
        tooltip.style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden');
      });
    
    // Add link labels
    const linkLabels = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(links)
      .enter().append('text')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '10px')
      .attr('fill', '#6b7280')
      .text((d: any) => d.type);
    
    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      
      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      
      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);
    });
    
    // Add legend
    this.addLegend(this.svg, width, height);
    
    // Add controls
    this.addControls(container, this.svg, this.simulation, nodes, links);
  }
  
  // Method to zoom in programmatically
  public zoomIn(): void {
    if (this.svg && this.zoomHandler) {
      const currentTransform = d3.zoomTransform(this.svg.node());
      const newScale = currentTransform.k * 1.2;
      this.svg.transition().duration(300).call(this.zoomHandler.scaleTo, newScale);
    }
  }
  
  // Method to zoom out programmatically
  public zoomOut(): void {
    if (this.svg && this.zoomHandler) {
      const currentTransform = d3.zoomTransform(this.svg.node());
      const newScale = currentTransform.k * 0.8;
      this.svg.transition().duration(300).call(this.zoomHandler.scaleTo, newScale);
    }
  }
  
  // Method to reset zoom programmatically
  public resetZoom(): void {
    if (this.svg && this.zoomHandler) {
      this.svg.transition().duration(300).call(this.zoomHandler.transform, d3.zoomIdentity);
    }
  }
  
  private createDataFlowNodes(components: ComponentNode[]) {
    return components.map(component => ({
      id: component.id,
      name: component.name,
      type: component.type,
      layer: component.layer,
      complexity: component.complexity,
      lines: component.lines,
      file: component.file,
      dependencies: component.dependencies,
      exports: component.exports,
      flowType: this.determineFlowType(component),
      description: component.description
    }));
  }
  
  private createDataFlowLinks(relationships: Relationship[], nodes: any[]) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    return relationships
      .filter(rel => nodeMap.has(rel.from) && nodeMap.has(rel.to))
      .map(rel => ({
        source: rel.from,
        target: rel.to,
        type: rel.type,
        weight: rel.weight || 1,
        description: rel.description
      }));
  }
  
  private determineFlowType(component: ComponentNode): 'input' | 'process' | 'output' | 'storage' {
    // Determine flow type based on component characteristics
    if (component.type === 'config' || component.name.toLowerCase().includes('store')) {
      return 'storage';
    }
    
    if (component.layer === 'presentation' || component.name.toLowerCase().includes('input')) {
      return 'input';
    }
    
    if (component.layer === 'data' || component.name.toLowerCase().includes('output')) {
      return 'output';
    }
    
    return 'process';
  }
  
  private getNodeRadius(node: any): number {
    const baseRadius = 30;
    const complexityFactor = Math.min(20, node.complexity * 2);
    return baseRadius + complexityFactor;
  }
  
  private getNodeColor(node: any): string {
    const colors = {
      input: '#22c55e',
      process: '#3b82f6',
      output: '#f59e0b',
      storage: '#8b5cf6'
    };
    return colors[node.flowType] || colors.process;
  }
  
  private getNodeStrokeColor(node: any): string {
    const colors = {
      input: '#16a34a',
      process: '#2563eb',
      output: '#d97706',
      storage: '#7c3aed'
    };
    return colors[node.flowType] || colors.process;
  }
  
  private getDataFlowIcon(flowType: string): string {
    const icons = {
      input: '📥',
      process: '⚙️',
      output: '📤',
      storage: '💾'
    };
    return icons[flowType as keyof typeof icons] || '⚙️';
  }
  
  private createTooltipContent(node: any): string {
    return `
      <strong>${node.name}</strong><br/>
      Type: ${node.type}<br/>
      Flow: ${node.flowType}<br/>
      Layer: ${node.layer}<br/>
      Lines: ${node.lines}<br/>
      Complexity: ${node.complexity}<br/>
      Dependencies: ${node.dependencies.length}<br/>
      ${node.description ? `<br/>${node.description}` : ''}
    `;
  }
  
  private addLegend(svg: any, width: number, height: number) {
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 20)`);
    
    const legendData = [
      { type: 'input', color: '#22c55e', icon: '📥', label: 'Input' },
      { type: 'process', color: '#3b82f6', icon: '⚙️', label: 'Process' },
      { type: 'output', color: '#f59e0b', icon: '📤', label: 'Output' },
      { type: 'storage', color: '#8b5cf6', icon: '💾', label: 'Storage' }
    ];
    
    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`);
    
    legendItems.append('circle')
      .attr('r', 8)
      .attr('fill', d => d.color);
    
    legendItems.append('text')
      .attr('x', 15)
      .attr('y', 0)
      .attr('dominant-baseline', 'middle')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .text(d => d.label);
  }
  
  private addControls(container: HTMLElement, svg: any, simulation: any, nodes: any[], links: any[]) {
    const controls = d3.select(container)
      .append('div')
      .style('position', 'absolute')
      .style('top', '10px')
      .style('left', '10px')
      .style('background', 'rgba(255, 255, 255, 0.9)')
      .style('padding', '10px')
      .style('border-radius', '8px')
      .style('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.1)');
    
    // Restart simulation button
    controls.append('button')
      .text('Restart Layout')
      .style('margin-right', '10px')
      .style('padding', '5px 10px')
      .style('border', '1px solid #d1d5db')
      .style('border-radius', '4px')
      .style('background', 'white')
      .style('cursor', 'pointer')
      .on('click', () => {
        simulation.alpha(1).restart();
      });
    
    // Filter by flow type
    const flowTypes = ['all', 'input', 'process', 'output', 'storage'];
    const select = controls.append('select')
      .style('padding', '5px')
      .style('border', '1px solid #d1d5db')
      .style('border-radius', '4px')
      .on('change', function() {
        const selectedType = (this as HTMLSelectElement).value;
        
        svg.selectAll('.node')
          .style('opacity', (d: any) => 
            selectedType === 'all' || d.flowType === selectedType ? 1 : 0.2
          );
        
        svg.selectAll('.links line')
          .style('opacity', (d: any) => {
            const sourceVisible = selectedType === 'all' || d.source.flowType === selectedType;
            const targetVisible = selectedType === 'all' || d.target.flowType === selectedType;
            return sourceVisible && targetVisible ? 0.6 : 0.1;
          });
      });
    
    select.selectAll('option')
      .data(flowTypes)
      .enter().append('option')
      .attr('value', d => d)
      .text(d => d.charAt(0).toUpperCase() + d.slice(1));
  }
}