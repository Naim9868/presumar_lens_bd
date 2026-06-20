// src/components/admin/SMSModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface SMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string, customerIds?: string[]) => void;
  mode: 'single' | 'bulk';
  customerCount: number;
  customerName?: string;
}

export default function SMSModal({
  isOpen,
  onClose,
  onSend,
  mode,
  customerCount,
  customerName,
}: SMSModalProps) {
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const MAX_CHARS = 160; // Standard SMS character limit
  const MAX_MULTIPART = 918; // 6 parts of 153 chars

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setCharCount(0);
      setError('');
    }
  }, [isOpen]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessage(text);
    setCharCount(text.length);
    
    if (text.length > MAX_MULTIPART) {
      setError(`Message exceeds ${MAX_MULTIPART} characters. Please shorten it.`);
    } else {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (message.length > MAX_MULTIPART) {
      setError(`Message exceeds ${MAX_MULTIPART} characters`);
      return;
    }

    setIsSending(true);
    try {
      await onSend(message);
      setMessage('');
      setCharCount(0);
      onClose();
    } catch (error) {
      setError('Failed to send SMS. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const parts = Math.ceil(charCount / MAX_CHARS);
  const remaining = MAX_MULTIPART - charCount;
  const isMultiPart = charCount > MAX_CHARS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {mode === 'bulk' ? 'Send Bulk SMS' : 'Send SMS'}
              </h3>
              <p className="text-sm text-gray-500">
                {mode === 'bulk' 
                  ? `Sending to ${customerCount} customers`
                  : customerName ? `Sending to ${customerName}` : 'Send SMS to customer'
                }
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Recipient info */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            {mode === 'bulk' ? (
              <Users className="w-4 h-4 text-gray-500" />
            ) : (
              <MessageSquare className="w-4 h-4 text-gray-500" />
            )}
            <span className="text-sm text-gray-600">
              {mode === 'bulk' 
                ? `${customerCount} customer${customerCount > 1 ? 's' : ''} will receive this SMS`
                : `SMS will be sent to ${customerName || 'customer'}`
              }
            </span>
          </div>

          {/* Message input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={handleMessageChange}
              rows={6}
              placeholder="Type your message here..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
            />
            
            {/* Character counter */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${
                  charCount > MAX_MULTIPART ? 'text-red-500' :
                  isMultiPart ? 'text-amber-500' : 'text-gray-500'
                }`}>
                  {charCount} / {MAX_MULTIPART} characters
                </span>
                {isMultiPart && (
                  <span className="text-xs text-amber-500 font-medium">
                    ({parts} SMS parts)
                  </span>
                )}
              </div>
              {remaining <= 20 && remaining > 0 && (
                <span className="text-xs text-amber-500 font-medium">
                  {remaining} characters remaining
                </span>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Preview hint */}
            {message && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <p className="text-sm text-gray-700">{message}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !message.trim() || charCount > MAX_MULTIPART}
              className="px-6 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Send SMS
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}