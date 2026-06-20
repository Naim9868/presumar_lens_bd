// src/components/admin/NoteModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, FileText, User, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  customerName?: string;
  existingNotes: {
    text: string;
    createdBy: string;
    createdAt: Date;
  }[];
}

export default function NoteModal({
  isOpen,
  onClose,
  onSave,
  customerName,
  existingNotes,
}: NoteModalProps) {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNote('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setIsSaving(true);
    try {
      await onSave(note);
      setNote('');
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    try {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    } catch {
      return '—';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Customer Notes
              </h3>
              <p className="text-sm text-gray-500">
                {customerName || 'Customer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Existing Notes */}
          {existingNotes && existingNotes.length > 0 && (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {existingNotes.map((note, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{note.text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {note.createdBy || 'Admin'}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {existingNotes && existingNotes.length === 0 && (
            <div className="text-center py-6">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No notes yet</p>
            </div>
          )}

          {/* Add Note Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Add Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Write a note about this customer..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSaving || !note.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {isSaving ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}