// components/admin/BulkActionModal.tsx
'use client';

import { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface BulkActionModalProps {
  selectedCount: number;
  onAction: (action: string) => void;
  onClear: () => void;
}

export function BulkActionModal({ selectedCount, onAction, onClear }: BulkActionModalProps) {
  const [selectedAction, setSelectedAction] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const actions = [
    { id: 'confirm', label: 'Confirm Orders', color: 'green', icon: CheckCircle },
    { id: 'process', label: 'Start Processing', color: 'blue', icon: CheckCircle },
    { id: 'ship', label: 'Mark as Shipped', color: 'purple', icon: CheckCircle },
    { id: 'deliver', label: 'Mark as Delivered', color: 'emerald', icon: CheckCircle },
    { id: 'cancel', label: 'Cancel Orders', color: 'red', icon: AlertCircle },
  ];
  
  const handleAction = () => {
    if (selectedAction) {
      onAction(selectedAction);
      setIsOpen(false);
      setSelectedAction('');
    }
  };
  
  return (
    <>
      {selectedCount > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedCount} order{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setIsOpen(true);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Bulk Actions</option>
              {actions.map(action => (
                <option key={action.id} value={action.id}>
                  {action.label}
                </option>
              ))}
            </select>
            <button
              onClick={onClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      
      {isOpen && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Bulk Action
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {actions.find(a => a.id === selectedAction)?.label.toLowerCase()} {selectedCount} order{selectedCount !== 1 ? 's' : ''}?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedAction('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}