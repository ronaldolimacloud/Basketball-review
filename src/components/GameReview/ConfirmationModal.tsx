import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: 'text-red-400',
      button: 'bg-red-600 hover:bg-red-700',
      border: 'border-red-500/20'
    },
    warning: {
      icon: 'text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      border: 'border-yellow-500/20'
    },
    info: {
      icon: 'text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700',
      border: 'border-blue-500/20'
    }
  };

  const currentStyles = typeStyles[type];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 border border-zinc-700 ${currentStyles.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${currentStyles.icon}`} />
            <h3 className="text-lg font-semibold text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-zinc-300 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-zinc-300"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors text-white font-medium ${currentStyles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};