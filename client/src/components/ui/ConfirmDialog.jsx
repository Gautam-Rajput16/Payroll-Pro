import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed? This action cannot be undone.', 
  confirmText = 'Confirm',
  isDanger = true
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={!loading ? onClose : undefined} title={title} size="sm">
      <div className="flex items-start mb-6">
        {isDanger && (
          <div className="flex-shrink-0 mr-4 bg-red-100 p-2 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        )}
        <div className="text-sm text-gray-600 pt-1">
          {message}
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button 
          variant="secondary" 
          onClick={onClose} 
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant={isDanger ? 'danger' : 'primary'} 
          onClick={handleConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
