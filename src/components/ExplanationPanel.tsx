import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, BookOpen, Settings, FileText } from 'lucide-react';
import { CodeFile } from '../types';

interface ExplanationPanelProps {
  file: CodeFile | null;
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ file }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['explanation']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (!file) {
    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-6">
        <div className="text-center text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No explanations available</p>
          <p className="text-xs mt-1">Select a code component to see insights</p>
        </div>
      </div>
    );
  }

  const Section: React.FC<{
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ id, title, icon, children }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="border border-gray-700 rounded-lg mb-4">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-750 rounded-t-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-white">{title}</span>
          </div>
          {isExpanded ? 
            <ChevronUp className="w-4 h-4 text-gray-400" /> : 
            <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </button>
        {isExpanded && (
          <div className="p-4 border-t border-gray-700 text-gray-300 text-sm">
            {children}
          </div>
        )}
      </div>
    );
  };

  const mockTradeoffs = [
    'Memory usage increases with cache size',
    'Potential cache invalidation complexity',
    'Better performance vs API call frequency'
  ];

  const mockDependencies = ['apiClient', 'cache', 'Map'];

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Insights
        </h3>

        <Section
          id="explanation"
          title="Purpose & Function"
          icon={<BookOpen className="w-4 h-4 text-blue-400" />}
        >
          <p className="leading-relaxed">
            {file.explanation || 'This component implements core functionality with clean separation of concerns and follows established design patterns.'}
          </p>
        </Section>

        <Section
          id="design"
          title="Design Patterns"
          icon={<Settings className="w-4 h-4 text-green-400" />}
        >
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-white mb-1">Pattern Used</h4>
              <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded">
                {file.type === 'class' ? 'Service Pattern' : 'Functional Pattern'}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Why This Approach?</h4>
              <p className="text-xs">
                This pattern provides clean separation of concerns and makes the code more maintainable and testable.
              </p>
            </div>
          </div>
        </Section>

        <Section
          id="tradeoffs"
          title="Trade-offs"
          icon={<FileText className="w-4 h-4 text-yellow-400" />}
        >
          <ul className="space-y-2">
            {mockTradeoffs.map((tradeoff, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                <span className="text-xs">{tradeoff}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="dependencies"
          title="Dependencies"
          icon={<Settings className="w-4 h-4 text-purple-400" />}
        >
          <div className="flex flex-wrap gap-2">
            {mockDependencies.map((dep, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-900 text-purple-300 text-xs rounded"
              >
                {dep}
              </span>
            ))}
          </div>
        </Section>

        {file.notes && file.notes.length > 0 && (
          <Section
            id="notes"
            title="Your Notes"
            icon={<FileText className="w-4 h-4 text-orange-400" />}
          >
            <div className="space-y-2">
              {file.notes.map((note) => (
                <div key={note.id} className="p-2 bg-gray-750 rounded text-xs">
                  <p>{note.content}</p>
                  {note.line && (
                    <span className="text-gray-500 mt-1 block">Line {note.line}</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default ExplanationPanel;