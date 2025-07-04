import React, { useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import { Project, CodeFile } from '../types';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  files: CodeFile[];
}

const ExportPanel: React.FC<ExportPanelProps> = ({ isOpen, onClose, project, files }) => {
  const [exportFormat, setExportFormat] = useState<'markdown' | 'pdf'>('markdown');
  const [includeCode, setIncludeCode] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);

  if (!isOpen || !project) return null;

  const generateMarkdown = () => {
    let markdown = `# ${project.name}\n\n`;
    markdown += `${project.description}\n\n`;
    markdown += `Generated on: ${new Date().toLocaleDateString()}\n\n---\n\n`;

    files.forEach(file => {
      if (file.type === 'file') {
        markdown += `## ${file.name}\n\n`;
        
        if (includeExplanations && file.explanation) {
          markdown += `**Purpose:** ${file.explanation}\n\n`;
        }

        if (includeCode) {
          markdown += `\`\`\`${file.language}\n${file.content}\n\`\`\`\n\n`;
        }

        if (includeNotes && file.notes && file.notes.length > 0) {
          markdown += `**Notes:**\n`;
          file.notes.forEach(note => {
            markdown += `- ${note.content}`;
            if (note.line) markdown += ` (Line ${note.line})`;
            markdown += `\n`;
          });
          markdown += `\n`;
        }

        markdown += `---\n\n`;
      }
    });

    return markdown;
  };

  const handleExport = () => {
    const content = generateMarkdown();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-analysis.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Analysis
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="markdown"
                  checked={exportFormat === 'markdown'}
                  onChange={() => setExportFormat('markdown')}
                  className="mr-2"
                />
                <FileText className="w-4 h-4 mr-2" />
                <span className="text-gray-300">Markdown (.md)</span>
              </label>
              <label className="flex items-center text-gray-500">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  disabled
                  className="mr-2"
                />
                <Download className="w-4 h-4 mr-2" />
                <span>PDF (Coming Soon)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Include in Export
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeCode}
                  onChange={(e) => setIncludeCode(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-300">Source Code</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeExplanations}
                  onChange={(e) => setIncludeExplanations(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-300">AI Explanations</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-300">User Notes</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;