import { useState, useEffect } from 'react';
import { connectionService } from '../services/connectionService';

interface CreateConnectionRequest {
  toUserId: string;
  message: string;
}

interface ConnectPopupProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    userId: string;
    firstName: string;
    lastName: string;
  };
  currentUserId: string;
  onSuccess: () => void;
}

export default function ConnectPopup({ isOpen, onClose, targetUser, currentUserId, onSuccess }: ConnectPopupProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMessage('');
      setError('');
      setIsLoading(false);
      setIsClosing(false);
      setShowSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const request: CreateConnectionRequest = {
        toUserId: targetUser.userId,
        message: message.trim()
      };

      await connectionService.createConnectionRequest(currentUserId, request);
      
      // Show success message
      setIsLoading(false);
      setShowSuccess(true);
      setMessage('');
      setError('');
      
      // Update connection status immediately
      onSuccess();
      
      // Close modal after showing success briefly
      setTimeout(() => {
        setIsClosing(true);
        onClose();
        setShowSuccess(false);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send connection request');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Connect with {targetUser.firstName} {targetUser.lastName}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {!showSuccess && (
                <div className="mb-3">
                  <label htmlFor="message" className="form-label">
                    Why do you want to connect? <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="message"
                    className="form-control"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g., I'm looking for trustworthy accommodations, or for a specific event, or for casual hanging out, or for a job..."
                    required
                  />
                  <div className="form-text">
                    Let them know why you'd like to connect!
                  </div>
                </div>
              )}
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {showSuccess && (
                <div className="alert alert-success d-flex align-items-center" role="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-check-circle-fill me-2" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 2.384 6.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                  <span>Connection request sent successfully!</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !message.trim() || isClosing || showSuccess}
              >
                {isLoading ? 'Sending...' : showSuccess ? 'Sent!' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
