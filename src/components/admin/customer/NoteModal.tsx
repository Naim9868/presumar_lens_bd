// src/components/admin/customer/NoteModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  X,
  FileText,
  User,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { CustomerNote } from '@/types/customer';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => Promise<void> | void;
  onUpdate?: (noteId: string, text: string) => Promise<void> | void;
  onDelete?: (noteId: string) => Promise<void> | void;
  customerName?: string;
  existingNotes: CustomerNote[];
}

export default function NoteModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  customerName,
  existingNotes,
}: NoteModalProps) {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNote('');
      setEditingId(null);
      setEditingText('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      await onSave(note);
      setNote('');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add note');
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (n: CustomerNote) => {
    if (!n.noteId) return;
    setEditingId(n.noteId);
    setEditingText(n.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const saveEdit = async (noteId: string) => {
    if (!onUpdate) return;
    const trimmed = editingText.trim();
    if (!trimmed) {
      setError('Note text cannot be empty');
      return;
    }
    setBusyId(noteId);
    setError(null);
    try {
      await onUpdate(noteId, trimmed);
      cancelEdit();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update note');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!onDelete) return;
    if (
      !confirm(
        'Delete this note? This action cannot be undone.'
      )
    ) {
      return;
    }
    setBusyId(noteId);
    setError(null);
    try {
      await onDelete(noteId);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete note');
    } finally {
      setBusyId(null);
    }
  };

  if (!isOpen) return null;

  const formatDate = (date: Date | string) => {
    try {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    } catch {
      return '—';
    }
  };

  // Sort newest first
  const sortedNotes = [...(existingNotes || [])].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col">
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
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Existing Notes */}
          {sortedNotes.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {sortedNotes.map((n) => {
                const id = n.noteId ?? `${n.createdAt}-${n.text}`;
                const isEditing = editingId === n.noteId;
                const isBusy = busyId === n.noteId;
                return (
                  <div
                    key={id}
                    className="p-3 bg-gray-50 rounded-lg group"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isBusy}
                            className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => n.noteId && saveEdit(n.noteId)}
                            disabled={isBusy || !editingText.trim()}
                            className="px-2.5 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            {isBusy ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {n.text}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {n.createdBy || 'Admin'}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(n.createdAt)}
                            </span>
                          </div>
                          {(onUpdate || onDelete) && n.noteId && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {onUpdate && (
                                <button
                                  type="button"
                                  onClick={() => startEdit(n)}
                                  disabled={isBusy}
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                                  aria-label="Edit note"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(n.noteId!)}
                                  disabled={isBusy}
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                  aria-label="Delete note"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {sortedNotes.length === 0 && (
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