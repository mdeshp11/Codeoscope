import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Download, ZoomIn, ZoomOut, RotateCcw, Layers, GitBranch, Database, Share2, Maximize2, BarChart3, Workflow, Network } from 'lucide-react';
import { ArchitectureData } from '../types/architecture';
import { MermaidGenerator } from '../services/MermaidGenerator';
import { BlockDiagramGenerator } from '../services/BlockDiagramGenerator';
import { DataFlowGenerator } from '../services/DataFlowGenerator';

interface ArchitectureDiagramProps {
  data: ArchitectureData;
  onClose: () => void;
}

type DiagramType = 'system' | 'block' | 'dataflow' | 'component' | 'c4';

const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ data, onClose }) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const blockDiagramRef = useRef<HTMLDivElement>(null);
  const dataFlowRef = useRef<HTMLDivElement>(null);
  const [diagramType, setDiagramType] = useState<DiagramType>('system');
  const [selectedBoundary, setSelectedBoundary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [blockZoom, setBlockZoom] = useState(1);
  const [dataFlowZoom, setDataFlowZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mermaidGenerator = new MermaidGenerator();
  const blockGenerator = new BlockDiagramGenerator();
  const dataFlowGenerator = new DataFlowGenerator();

  useEffect(() => {
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }, []);

  useEffect(() => {
    renderDiagram();
  }, [diagramType, selectedBoundary, data]);

  const renderDiagram = async () => {
    if (!diagramRef.current && !blockDiagramRef.current && !dataFlowRef.current) return;

    setIsLoading(true);
    
    try {
      if (diagramType === 'block') {
        await renderBlockDiagram();
      } else if (diagramType === 'dataflow') {
        await renderDataFlowDiagram();
      } else {
        await renderMermaidDiagram();
      }
    } catch (error) {
      console.error('Failed to render diagram:', error);
      
      const targetRef = diagramType === 'block' ? blockDiagramRef : 
                       diagramType === 'dataflow' ? dataFlowRef : diagramRef;
      
      if (targetRef.current) {
        targetRef.current.innerHTML = `
          <div class="flex items-center justify-center h-64 text-red-600">
            <div class="text-center">
              <p class="font-medium">Failed to render diagram</p>
              <p class="text-sm mt-1">${error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </div>
        `;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderMermaidDiagram = async () => {
    if (!diagramRef.current) return;

    let mermaidCode = '';
    
    switch (diagramType) {
      case 'system':
        mermaidCode = mermaidGenerator.generateSystemOverview(data);
        break;
      case 'component':
        mermaidCode = mermaidGenerator.generateComponentDiagram(data, selectedBoundary);
        break;
      case 'c4':
        mermaidCode = mermaidGenerator.generateC4Diagram(data);
        break;
    }

    // Clear previous diagram
    diagramRef.current.innerHTML = '';
    
    // Generate unique ID for this diagram
    const diagramId = `mermaid-${Date.now()}`;
    
    // Render new diagram
    const { svg } = await mermaid.render(diagramId, mermaidCode);
    
    if (diagramRef.current) {
      diagramRef.current.innerHTML = svg;
      
      // Apply zoom
      const svgElement = diagramRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.transform = `scale(${zoom})`;
        svgElement.style.transformOrigin = 'top left';
      }
    }
  };

  const renderBlockDiagram = async () => {
    if (!blockDiagramRef.current) return;

    try {
      const blockDiagram = await blockGenerator.generateBlockDiagram(data);
      blockDiagramRef.current.innerHTML = blockDiagram;
      
      // Apply zoom to the SVG
      const svgElement = blockDiagramRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.transform = `scale(${blockZoom})`;
        svgElement.style.transformOrigin = 'top left';
        svgElement.style.transition = 'transform 0.3s ease';
      }
    } catch (error) {
      console.error('Failed to render block diagram:', error);
      blockDiagramRef.current.innerHTML = `
        <div class="flex items-center justify-center h-64 text-red-600">
          <div class="text-center">
            <p class="font-medium">Failed to render block diagram</p>
            <p class="text-sm mt-1">${error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      `;
    }
  };

  const renderDataFlowDiagram = async () => {
    if (!dataFlowRef.current) return;

    try {
      await dataFlowGenerator.generateDataFlowDiagram(data, dataFlowRef.current);
      
      // Apply zoom to the SVG
      const svgElement = dataFlowRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.transform = `scale(${dataFlowZoom})`;
        svgElement.style.transformOrigin = 'top left';
        svgElement.style.transition = 'transform 0.3s ease';
      }
    } catch (error) {
      console.error('Failed to render data flow diagram:', error);
      dataFlowRef.current.innerHTML = `
        <div class="flex items-center justify-center h-64 text-red-600">
          <div class="text-center">
            <p class="font-medium">Failed to render data flow diagram</p>
            <p class="text-sm mt-1">${error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      `;
    }
  };

  const handleZoomIn = () => {
    if (diagramType === 'block') {
      setBlockZoom(prev => Math.min(prev + 0.2, 3));
    } else if (diagramType === 'dataflow') {
      setDataFlowZoom(prev => Math.min(prev + 0.2, 3));
    } else {
      setZoom(prev => Math.min(prev + 0.2, 3));
    }
  };

  const handleZoomOut = () => {
    if (diagramType === 'block') {
      setBlockZoom(prev => Math.max(prev - 0.2, 0.2));
    } else if (diagramType === 'dataflow') {
      setDataFlowZoom(prev => Math.max(prev - 0.2, 0.2));
    } else {
      setZoom(prev => Math.max(prev - 0.2, 0.2));
    }
  };

  const handleResetZoom = () => {
    if (diagramType === 'block') {
      setBlockZoom(1);
    } else if (diagramType === 'dataflow') {
      setDataFlowZoom(1);
    } else {
      setZoom(1);
    }
  };

  const handleDownload = () => {
    const activeRef = diagramType === 'block' ? blockDiagramRef :
                     diagramType === 'dataflow' ? dataFlowRef : diagramRef;
    
    if (!activeRef.current) return;

    const svgElement = activeRef.current.querySelector('svg');
    if (!svgElement) return;

    // Create a canvas to convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `architecture-${diagramType}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
        }
      });
      
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const handleShare = async () => {
    const activeRef = diagramType === 'block' ? blockDiagramRef :
                     diagramType === 'dataflow' ? dataFlowRef : diagramRef;
    
    if (!activeRef.current) return;

    const svgElement = activeRef.current.querySelector('svg');
    if (!svgElement) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      
      if (navigator.share) {
        const file = new File([svgBlob], `architecture-${diagramType}.svg`, { type: 'image/svg+xml' });
        await navigator.share({
          title: `${data.metadata.repositoryUrl.split('/').pop()} Architecture`,
          text: `System architecture diagram (${diagramType})`,
          files: [file]
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share:', error);
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

  const getDiagramIcon = (type: DiagramType) => {
    const icons = {
      system: <Layers className="w-4 h-4" />,
      component: <GitBranch className="w-4 h-4" />,
      block: <BarChart3 className="w-4 h-4" />,
      dataflow: <Workflow className="w-4 h-4" />,
      c4: <Database className="w-4 h-4" />
    };
    return icons[type];
  };

  const getDiagramTitle = (type: DiagramType) => {
    const titles = {
      system: 'System Architecture',
      component: 'Component View',
      block: 'Block Diagram',
      dataflow: 'Data Flow Diagram',
      c4: 'C4 Model'
    };
    return titles[type];
  };

  const getDiagramDescription = (type: DiagramType) => {
    const descriptions = {
      system: 'High-level system overview showing major components and their relationships',
      component: 'Detailed component view with internal structure and dependencies',
      block: 'Modular block diagram showing components with attributes and interconnections',
      dataflow: 'Interactive data flow visualization showing data movement between components',
      c4: 'C4 model diagram showing system context, containers, and components'
    };
    return descriptions[type];
  };

  const getCurrentZoom = () => {
    if (diagramType === 'block') {
      return blockZoom;
    } else if (diagramType === 'dataflow') {
      return dataFlowZoom;
    } else {
      return zoom;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {getDiagramTitle(diagramType)}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {data.metadata.repositoryUrl.split('/').pop()} • {data.metadata.totalComponents} components
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getDiagramDescription(diagramType)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Share diagram"
            >
              <Share2 className="w-5 h-5" />
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
              ✕
            </button>
          </div>
        </div>

        {/* Tabbed Interface */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            {/* Diagram Type Tabs */}
            <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              {(['system', 'block', 'dataflow', 'component', 'c4'] as DiagramType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setDiagramType(type)}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                    diagramType === type
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {getDiagramIcon(type)}
                  <span className="capitalize">{type === 'c4' ? 'C4' : type}</span>
                </button>
              ))}
            </div>

            {/* Boundary Selector for Component View */}
            {diagramType === 'component' && data.boundaries.length > 0 && (
              <select
                value={selectedBoundary}
                onChange={(e) => setSelectedBoundary(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Components</option>
                {data.boundaries.map((boundary) => (
                  <option key={boundary.id} value={boundary.id}>
                    {boundary.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Zoom Controls - Now for all diagram types */}
            <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              <button
                onClick={handleZoomOut}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white border-x border-gray-200 dark:border-gray-600">
                {Math.round(getCurrentZoom() * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg"
                title="Reset zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Diagram Content */}
        <div className="flex-1 overflow-auto bg-white dark:bg-gray-900 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Generating {diagramType} diagram...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mermaid Diagrams */}
              {!['block', 'dataflow'].includes(diagramType) && (
                <div 
                  ref={diagramRef}
                  className="w-full h-full flex items-center justify-center"
                  style={{ 
                    minHeight: '400px',
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center'
                  }}
                />
              )}

              {/* Block Diagram */}
              {diagramType === 'block' && (
                <div 
                  ref={blockDiagramRef}
                  className="w-full h-full flex items-center justify-center"
                  style={{ 
                    minHeight: '400px',
                    overflow: 'auto'
                  }}
                />
              )}

              {/* Data Flow Diagram */}
              {diagramType === 'dataflow' && (
                <div 
                  ref={dataFlowRef}
                  className="w-full h-full"
                  style={{ 
                    minHeight: '400px',
                    overflow: 'auto'
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{data.metadata.totalComponents}</span> components • 
            <span className="font-medium ml-1">{data.relationships.length}</span> relationships • 
            <span className="ml-1">Generated {new Date(data.metadata.analysisDate).toLocaleString()}</span>
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

export default ArchitectureDiagram;