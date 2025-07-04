import React, { useState } from 'react';
import { X, Plus, MessageSquare } from 'lucide-react';
import { Note } from '../types';

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  line?: number;
  onSaveNote: (content: string, line?: number) => void;
  existingNotes: Note[];
}

const NotesPanel: React.FC<NotesPanelProps> = ({ 
  isOpen, 
  onClose, 
  line, 
  onSaveNote, 
  existingNotes 
}) => {
  const [noteContent, setNoteContent] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!noteContent.trim()) return;
    onSaveNote(noteContent, line);
    setNoteContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Add Note
            {line && <span className="text-sm text-gray-400">(Line {line})</span>}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Add your note or insight about this code..."
            className="w-full h-32 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!noteContent.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesPanel;