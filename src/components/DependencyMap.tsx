import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { X, Filter, Search, Download, ZoomIn, ZoomOut, RotateCcw, Layers, GitBranch, Database, Share2, Maximize2, Eye, EyeOff } from 'lucide-react';
import { ArchitectureData, ComponentNode, Relationship } from '../types/architecture';

interface DependencyMapProps {
  data: ArchitectureData;
  onClose: () => void;
}

type FilterType = 'all' | 'javascript' | 'typescript' | 'python' | 'cpp' | 'config';
type ViewMode = 'dependencies' | 'components' | 'layers' | 'files';

const DependencyMap: React.FC<DependencyMapProps> = ({ data, onClose }) => {
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('dependencies');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<ComponentNode | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    nodes: 0,
    edges: 0,
    clusters: 0
  });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!networkRef.current) return;

    const { nodes, edges } = prepareNetworkData();
    
    const nodesDataSet = new DataSet(nodes);
    const edgesDataSet = new DataSet(edges);

    const options = {
      nodes: {
        shape: 'dot',
        size: 16,
        font: {
          size: 12,
          color: '#333333',
          face: 'Inter, system-ui, sans-serif'
        },
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.1)',
          size: 5,
          x: 2,
          y: 2
        },
        chosen: {
          node: (values: any, id: string, selected: boolean, hovering: boolean) => {
            values.shadow = true;
            values.shadowColor = 'rgba(59, 130, 246, 0.5)';
            values.shadowSize = 10;
          }
        }
      },
      edges: {
        width: 2,
        color: {
          color: '#94a3b8',
          highlight: '#3b82f6',
          hover: '#6366f1'
        },
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.8,
            type: 'arrow'
          }
        },
        smooth: {
          enabled: true,
          type: 'dynamic',
          roundness: 0.5
        },
        font: {
          size: 10,
          color: '#64748b',
          strokeWidth: 2,
          strokeColor: '#ffffff'
        }
      },
      layout: {
        improvedLayout: true,
        clusterThreshold: 150,
        hierarchical: viewMode === 'layers' ? {
          enabled: true,
          levelSeparation: 150,
          nodeSpacing: 100,
          treeSpacing: 200,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true,
          direction: 'UD',
          sortMethod: 'directed'
        } : false
      },
      physics: {
        enabled: true,
        stabilization: {
          enabled: true,
          iterations: 100,
          updateInterval: 25
        },
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.1
        }
      },
      interaction: {
        hover: true,
        hoverConnectedEdges: true,
        selectConnectedEdges: false,
        tooltipDelay: 300,
        zoomView: true,
        dragView: true
      },
      configure: {
        enabled: false
      }
    };

    networkInstance.current = new Network(
      networkRef.current,
      { nodes: nodesDataSet, edges: edgesDataSet },
      options
    );

    // Event listeners
    networkInstance.current.on('selectNode', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const component = data.components.find(c => c.id === nodeId);
        setSelectedNode(component || null);
      }
    });

    networkInstance.current.on('deselectNode', () => {
      setSelectedNode(null);
    });

    networkInstance.current.on('hoverNode', (params) => {
      const component = data.components.find(c => c.id === params.node);
      if (component) {
        const tooltip = createTooltip(component);
        // You could implement a custom tooltip here
      }
    });

    // Update stats
    setNetworkStats({
      nodes: nodes.length,
      edges: edges.length,
      clusters: new Set(nodes.map(n => n.group)).size
    });

    // Update zoom state when user zooms with mouse
    networkInstance.current.on('zoom', (params) => {
      setZoom(networkInstance.current?.getScale() || 1);
    });

    return () => {
      if (networkInstance.current) {
        networkInstance.current.destroy();
        networkInstance.current = null;
      }
    };
  }, [data, filter, viewMode, searchTerm, showLabels]);

  const prepareNetworkData = () => {
    let filteredComponents = data.components;
    let filteredRelationships = data.relationships;

    // Apply language filter
    if (filter !== 'all') {
      const languageMap: Record<FilterType, string[]> = {
        javascript: ['javascript', 'js', 'jsx'],
        typescript: ['typescript', 'ts', 'tsx'],
        python: ['python', 'py'],
        cpp: ['cpp', 'c', 'h', 'hpp'],
        config: ['json', 'yaml', 'yml', 'toml', 'ini'],
        all: []
      };

      const targetLanguages = languageMap[filter];
      if (targetLanguages.length > 0) {
        filteredComponents = filteredComponents.filter(component => {
          const fileExt = component.file.split('.').pop()?.toLowerCase();
          return targetLanguages.some(lang => 
            fileExt === lang || component.file.includes(`.${lang}`)
          );
        });
      }
    }

    // Apply search filter
    if (searchTerm) {
      filteredComponents = filteredComponents.filter(component =>
        component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const componentIds = new Set(filteredComponents.map(c => c.id));
    filteredRelationships = filteredRelationships.filter(rel =>
      componentIds.has(rel.from) && componentIds.has(rel.to)
    );

    // Prepare nodes
    const nodes = filteredComponents.map(component => {
      const nodeColor = getNodeColor(component);
      const nodeSize = getNodeSize(component);
      const nodeShape = getNodeShape(component);

      return {
        id: component.id,
        label: showLabels ? component.name : '',
        title: createTooltip(component),
        color: nodeColor,
        size: nodeSize,
        shape: nodeShape,
        group: component.layer,
        level: getNodeLevel(component),
        font: {
          size: Math.max(10, Math.min(16, component.name.length > 15 ? 10 : 14)),
          color: getTextColor(nodeColor.background)
        }
      };
    });

    // Prepare edges
    const edges = filteredRelationships.map(rel => {
      const edgeColor = getEdgeColor(rel.type);
      const edgeWidth = getEdgeWidth(rel.weight);

      return {
        id: `${rel.from}-${rel.to}`,
        from: rel.from,
        to: rel.to,
        label: rel.description || rel.type,
        color: edgeColor,
        width: edgeWidth,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.8
          }
        },
        title: `${rel.type}: ${rel.description || 'No description'}`
      };
    });

    return { nodes, edges };
  };

  const getNodeColor = (component: ComponentNode) => {
    const layerColors = {
      presentation: { background: '#dbeafe', border: '#3b82f6' },
      business: { background: '#f3e8ff', border: '#8b5cf6' },
      data: { background: '#dcfce7', border: '#22c55e' },
      infrastructure: { background: '#fed7aa', border: '#f97316' },
      external: { background: '#fecaca', border: '#ef4444' }
    };

    const typeColors = {
      class: { background: '#e0f2fe', border: '#0891b2' },
      function: { background: '#fef3c7', border: '#f59e0b' },
      module: { background: '#e7e5e4', border: '#78716c' },
      service: { background: '#ecfdf5', border: '#10b981' },
      component: { background: '#ede9fe', border: '#7c3aed' },
      config: { background: '#fef2f2', border: '#dc2626' }
    };

    return viewMode === 'layers' 
      ? layerColors[component.layer] || layerColors.business
      : typeColors[component.type] || typeColors.module;
  };

  const getNodeSize = (component: ComponentNode) => {
    const baseSize = 16;
    const complexityMultiplier = Math.min(2, component.complexity / 5);
    const linesMultiplier = Math.min(1.5, component.lines / 100);
    
    return baseSize + (complexityMultiplier * 8) + (linesMultiplier * 4);
  };

  const getNodeShape = (component: ComponentNode) => {
    const shapes = {
      class: 'box',
      function: 'ellipse',
      module: 'diamond',
      service: 'star',
      component: 'triangle',
      config: 'square'
    };
    return shapes[component.type] || 'dot';
  };

  const getNodeLevel = (component: ComponentNode) => {
    const levels = {
      presentation: 1,
      business: 2,
      data: 3,
      infrastructure: 4,
      external: 5
    };
    return levels[component.layer] || 2;
  };

  const getEdgeColor = (type: Relationship['type']) => {
    const colors = {
      imports: '#64748b',
      calls: '#3b82f6',
      extends: '#8b5cf6',
      implements: '#06b6d4',
      uses: '#10b981',
      configures: '#f59e0b'
    };
    return colors[type] || '#64748b';
  };

  const getEdgeWidth = (weight: number) => {
    return Math.max(1, Math.min(5, weight * 2));
  };

  const getTextColor = (backgroundColor: string) => {
    // Simple contrast calculation
    return backgroundColor.includes('f') ? '#1f2937' : '#ffffff';
  };

  const createTooltip = (component: ComponentNode) => {
    return `
      <div style="max-width: 300px; padding: 8px;">
        <strong>${component.name}</strong><br/>
        <em>${component.type} • ${component.layer}</em><br/>
        <small>File: ${component.file}</small><br/>
        <small>Lines: ${component.lines} • Complexity: ${component.complexity}</small><br/>
        ${component.description ? `<p style="margin-top: 8px; font-size: 12px;">${component.description}</p>` : ''}
      </div>
    `;
  };

  const handleZoomIn = () => {
    if (networkInstance.current) {
      const scale = networkInstance.current.getScale();
      networkInstance.current.moveTo({ scale: scale * 1.2 });
      setZoom(scale * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (networkInstance.current) {
      const scale = networkInstance.current.getScale();
      networkInstance.current.moveTo({ scale: scale * 0.8 });
      setZoom(scale * 0.8);
    }
  };

  const handleResetView = () => {
    if (networkInstance.current) {
      networkInstance.current.fit();
      setZoom(networkInstance.current.getScale());
    }
  };

  const handleDownload = () => {
    if (networkInstance.current) {
      const canvas = networkInstance.current.getCanvas();
      const link = document.createElement('a');
      link.download = `dependency-map-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const getFilterIcon = (filterType: FilterType) => {
    const icons = {
      all: <Layers className="w-4 h-4" />,
      javascript: <GitBranch className="w-4 h-4" />,
      typescript: <GitBranch className="w-4 h-4" />,
      python: <Database className="w-4 h-4" />,
      cpp: <Database className="w-4 h-4" />,
      config: <Database className="w-4 h-4" />
    };
    return icons[filterType];
  };

  const getViewModeIcon = (mode: ViewMode) => {
    const icons = {
      dependencies: <GitBranch className="w-4 h-4" />,
      components: <Layers className="w-4 h-4" />,
      layers: <Database className="w-4 h-4" />,
      files: <Database className="w-4 h-4" />
    };
    return icons[mode];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Interactive Dependency Map
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {data.metadata.repositoryUrl.split('/').pop()} • {networkStats.nodes} nodes • {networkStats.edges} connections
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Download as PNG"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Toggle fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            {/* View Mode Selector */}
            <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              {(['dependencies', 'components', 'layers', 'files'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {getViewModeIcon(mode)}
                  <span className="capitalize">{mode}</span>
                </button>
              ))}
            </div>

            {/* Language Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Languages</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="cpp">C/C++</option>
              <option value="config">Config Files</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Toggle Labels */}
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showLabels
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Labels</span>
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              <button
                onClick={handleZoomOut}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetView}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg"
                title="Reset view"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Network Visualization */}
          <div className="flex-1 relative">
            <div
              ref={networkRef}
              className="w-full h-full bg-gray-50 dark:bg-gray-900"
              style={{ minHeight: '400px' }}
            />
          </div>

          {/* Side Panel */}
          {selectedNode && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Component Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono">{selectedNode.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {selectedNode.type}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Layer
                  </label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {selectedNode.layer}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    File
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono text-sm break-all">
                    {selectedNode.file}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lines
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedNode.lines}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Complexity
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedNode.complexity}</p>
                  </div>
                </div>

                {selectedNode.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <p className="text-gray-900 dark:text-white text-sm leading-relaxed">
                      {selectedNode.description}
                    </p>
                  </div>
                )}

                {selectedNode.dependencies.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dependencies
                    </label>
                    <div className="space-y-1">
                      {selectedNode.dependencies.slice(0, 5).map((dep, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded mr-1 mb-1"
                        >
                          {dep}
                        </span>
                      ))}
                      {selectedNode.dependencies.length > 5 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{selectedNode.dependencies.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {selectedNode.exports.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exports
                    </label>
                    <div className="space-y-1">
                      {selectedNode.exports.slice(0, 5).map((exp, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded mr-1 mb-1"
                        >
                          {exp}
                        </span>
                      ))}
                      {selectedNode.exports.length > 5 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{selectedNode.exports.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{networkStats.nodes}</span> components • 
            <span className="font-medium ml-1">{networkStats.edges}</span> relationships • 
            <span className="ml-1">{networkStats.clusters} layers</span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Presentation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Business</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Data</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Infrastructure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DependencyMap;