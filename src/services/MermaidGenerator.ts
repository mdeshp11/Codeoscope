import { ArchitectureData, ComponentNode, SystemBoundary, Relationship } from '../types/architecture';

export class MermaidGenerator {
  generateC4Diagram(data: ArchitectureData): string {
    const { components, boundaries, relationships } = data;
    
    let mermaid = 'graph TB\n';
    
    // Add subgraphs for boundaries first
    boundaries.forEach(boundary => {
      mermaid += `    subgraph ${boundary.id}["${boundary.name}"]\n`;
      
      boundary.components.forEach(componentId => {
        const component = components.find(c => c.id === componentId);
        if (component) {
          const nodeLabel = this.formatNodeLabel(component);
          mermaid += `        ${component.id}["${nodeLabel}"]\n`;
        }
      });
      
      mermaid += '    end\n\n';
    });
    
    // Add standalone components (not in boundaries)
    const boundaryComponentIds = new Set(boundaries.flatMap(b => b.components));
    components.forEach(component => {
      if (!boundaryComponentIds.has(component.id)) {
        const nodeLabel = this.formatNodeLabel(component);
        mermaid += `    ${component.id}["${nodeLabel}"]\n`;
      }
    });
    
    mermaid += '\n';
    
    // Add relationships
    relationships.forEach(rel => {
      const arrow = this.getArrowType(rel.type);
      const label = rel.description ? `|${rel.description}|` : '';
      mermaid += `    ${rel.from} ${arrow}${label} ${rel.to}\n`;
    });
    
    mermaid += '\n';
    
    // Apply styles at the end
    mermaid += '    classDef presentation fill:#e1f5fe,stroke:#01579b,stroke-width:2px\n';
    mermaid += '    classDef business fill:#f3e5f5,stroke:#4a148c,stroke-width:2px\n';
    mermaid += '    classDef data fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px\n';
    mermaid += '    classDef infrastructure fill:#fff3e0,stroke:#e65100,stroke-width:2px\n';
    mermaid += '    classDef external fill:#ffebee,stroke:#b71c1c,stroke-width:2px\n\n';
    
    // Apply class assignments
    components.forEach(component => {
      mermaid += `    class ${component.id} ${component.layer}\n`;
    });
    
    return mermaid;
  }

  generateSystemOverview(data: ArchitectureData): string {
    const { components, boundaries } = data;
    
    let mermaid = 'graph LR\n';
    
    // System boundary
    mermaid += `    subgraph system["${data.metadata.repositoryUrl.split('/').pop()} System"]\n`;
    
    boundaries.forEach(boundary => {
      const componentCount = boundary.components.length;
      mermaid += `        ${boundary.id}["${boundary.name}<br/>${componentCount} components"]\n`;
    });
    
    mermaid += '    end\n\n';
    
    // External dependencies
    const externalDeps = this.getExternalDependencies(components);
    externalDeps.forEach(dep => {
      mermaid += `    ${dep.id}["${dep.name}"]\n`;
      mermaid += `    ${dep.id} --> system\n`;
    });
    
    mermaid += '\n';
    
    // Apply styles at the end
    mermaid += '    classDef system fill:#e3f2fd,stroke:#1976d2,stroke-width:3px\n';
    mermaid += '    classDef container fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px\n';
    mermaid += '    classDef external fill:#ffebee,stroke:#d32f2f,stroke-width:2px\n\n';
    
    // Apply class assignments
    boundaries.forEach(boundary => {
      mermaid += `    class ${boundary.id} container\n`;
    });
    
    externalDeps.forEach(dep => {
      mermaid += `    class ${dep.id} external\n`;
    });
    
    mermaid += '    class system system\n';
    
    return mermaid;
  }

  generateComponentDiagram(data: ArchitectureData, boundaryId?: string): string {
    const { components, relationships } = data;
    
    let targetComponents = components;
    if (boundaryId) {
      const boundary = data.boundaries.find(b => b.id === boundaryId);
      if (boundary) {
        targetComponents = components.filter(c => boundary.components.includes(c.id));
      }
    }
    
    let mermaid = 'graph TD\n';
    
    // Add components first
    targetComponents.forEach(component => {
      const nodeLabel = this.formatDetailedNodeLabel(component);
      mermaid += `    ${component.id}["${nodeLabel}"]\n`;
    });
    
    mermaid += '\n';
    
    // Add relationships between target components
    const targetComponentIds = new Set(targetComponents.map(c => c.id));
    relationships.forEach(rel => {
      if (targetComponentIds.has(rel.from) && targetComponentIds.has(rel.to)) {
        const arrow = this.getArrowType(rel.type);
        const label = rel.description ? `|${rel.description}|` : '';
        mermaid += `    ${rel.from} ${arrow}${label} ${rel.to}\n`;
      }
    });
    
    mermaid += '\n';
    
    // Apply styles at the end
    mermaid += '    classDef class fill:#e1f5fe,stroke:#01579b,stroke-width:2px\n';
    mermaid += '    classDef function fill:#f3e5f5,stroke:#4a148c,stroke-width:2px\n';
    mermaid += '    classDef module fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px\n';
    mermaid += '    classDef service fill:#fff3e0,stroke:#e65100,stroke-width:2px\n';
    mermaid += '    classDef component fill:#ede9fe,stroke:#7c3aed,stroke-width:2px\n';
    mermaid += '    classDef config fill:#ffebee,stroke:#b71c1c,stroke-width:2px\n\n';
    
    // Apply class assignments
    targetComponents.forEach(component => {
      mermaid += `    class ${component.id} ${component.type}\n`;
    });
    
    return mermaid;
  }

  generateDataFlowDiagram(data: ArchitectureData): string {
    const { components, relationships } = data;
    
    let mermaid = 'flowchart TD\n';
    
    // Identify entry points (components with no incoming relationships)
    const hasIncoming = new Set(relationships.map(r => r.to));
    const entryPoints = components.filter(c => !hasIncoming.has(c.id) && c.type !== 'config');
    
    // Identify exit points (components with no outgoing relationships)
    const hasOutgoing = new Set(relationships.map(r => r.from));
    const exitPoints = components.filter(c => !hasOutgoing.has(c.id) && c.type !== 'config');
    
    // Add entry points
    entryPoints.forEach(component => {
      mermaid += `    ${component.id}["📥 ${component.name}"]\n`;
    });
    
    // Add processing components
    const processingComponents = components.filter(c => 
      hasIncoming.has(c.id) && hasOutgoing.has(c.id)
    );
    processingComponents.forEach(component => {
      mermaid += `    ${component.id}["⚙️ ${component.name}"]\n`;
    });
    
    // Add exit points
    exitPoints.forEach(component => {
      mermaid += `    ${component.id}["📤 ${component.name}"]\n`;
    });
    
    // Add storage components
    const storageComponents = components.filter(c => 
      c.type === 'config' || c.name.toLowerCase().includes('store') || 
      c.name.toLowerCase().includes('database') || c.name.toLowerCase().includes('cache')
    );
    storageComponents.forEach(component => {
      mermaid += `    ${component.id}["💾 ${component.name}"]\n`;
    });
    
    mermaid += '\n';
    
    // Add data flow relationships
    relationships.forEach(rel => {
      if (rel.type === 'calls' || rel.type === 'uses') {
        mermaid += `    ${rel.from} --> ${rel.to}\n`;
      }
    });
    
    mermaid += '\n';
    
    // Apply styles at the end
    mermaid += '    classDef input fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px\n';
    mermaid += '    classDef process fill:#e3f2fd,stroke:#1565c0,stroke-width:2px\n';
    mermaid += '    classDef output fill:#fff3e0,stroke:#ef6c00,stroke-width:2px\n';
    mermaid += '    classDef storage fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px\n\n';
    
    // Apply class assignments
    entryPoints.forEach(component => {
      mermaid += `    class ${component.id} input\n`;
    });
    
    processingComponents.forEach(component => {
      mermaid += `    class ${component.id} process\n`;
    });
    
    exitPoints.forEach(component => {
      mermaid += `    class ${component.id} output\n`;
    });
    
    storageComponents.forEach(component => {
      mermaid += `    class ${component.id} storage\n`;
    });
    
    return mermaid;
  }

  private formatNodeLabel(component: ComponentNode): string {
    const icon = this.getComponentIcon(component.type);
    const complexity = component.complexity > 5 ? '🔴' : component.complexity > 2 ? '🟡' : '🟢';
    return `${icon} ${component.name}\\n${component.type} ${complexity}`;
  }

  private formatDetailedNodeLabel(component: ComponentNode): string {
    const icon = this.getComponentIcon(component.type);
    const complexity = component.complexity > 5 ? '🔴' : component.complexity > 2 ? '🟡' : '🟢';
    return `${icon} ${component.name}\\n${component.type}\\n${component.lines} lines ${complexity}`;
  }

  private getComponentIcon(type: ComponentNode['type']): string {
    const icons = {
      class: '🏗️',
      function: '⚡',
      module: '📦',
      service: '🔧',
      component: '🧩',
      config: '⚙️',
      external: '🌐'
    };
    return icons[type] || '📄';
  }

  private getArrowType(relationshipType: Relationship['type']): string {
    const arrows = {
      imports: '-->',
      calls: '-.->',
      extends: '==>',
      implements: '==>',
      uses: '-->',
      configures: '-->'
    };
    return arrows[relationshipType] || '-->';
  }

  private getExternalDependencies(components: ComponentNode[]) {
    const externalDeps = new Set<string>();
    
    components.forEach(component => {
      component.dependencies.forEach(dep => {
        if (!components.find(c => c.name === dep || c.exports.includes(dep))) {
          externalDeps.add(dep);
        }
      });
    });
    
    return Array.from(externalDeps).map(dep => ({
      id: `ext_${dep.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: dep
    }));
  }
}