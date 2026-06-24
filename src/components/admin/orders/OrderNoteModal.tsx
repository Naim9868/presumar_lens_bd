'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Order } from '@/types/order';

interface Props {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}

export default function OrderNoteModal({ isOpen, order, onClose, onSubmit }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!isOpen) setText(''); }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try { await onSubmit(text.trim()); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add Note</h2>
            <p className="text-xs text-gray-400 mt-0.5">Order #{order.orderId}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Existing notes */}
          {order.notes?.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Previous Notes</p>
              {order.notes.map((note) => (
                <div key={note._id} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-sm text-gray-700 leading-relaxed">{note.text}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock className="w-3 h-3 text-gray-300" />
                    <span className="text-[11px] text-gray-400">
                      {format(new Date(note.createdAt), 'dd MMM yyyy, h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New note */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">New Note</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add an internal note about this order..."
              rows={4}
              className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!text.trim() || loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {loading ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  );
}