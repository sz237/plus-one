import { useState } from 'react';
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
      onSuccess();
      onClose();
      setMessage('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send connection request');
    } finally {
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
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
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
                disabled={isLoading || !message.trim()}
              >
                {isLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
