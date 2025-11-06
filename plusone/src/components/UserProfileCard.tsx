import { useState, useEffect } from 'react';
import { connectionService } from '../services/connectionService';
import ConnectPopup from './ConnectPopup';

interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profile: {
    gender?: string | null;
    age?: number | null;
    location: {
      city: string;
      state: string;
      country: string;
    };
    job: {
      title: string;
      companiesName: string;
    };
    interests: string[];
    profilePhoto: {
      url?: string;
    };
  };
  createdAt: string;
}

interface UserProfileCardProps {
  user: UserProfile;
  currentUserId: string;
  onConnectionUpdate: () => void;
}

export default function UserProfileCard({ user, currentUserId, onConnectionUpdate }: UserProfileCardProps) {
  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECT');
  const [showConnectPopup, setShowConnectPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConnectionStatus();
  }, [user.userId, currentUserId]);

  const loadConnectionStatus = async () => {
    try {
      const status = await connectionService.getConnectionStatus(currentUserId, user.userId);
      setConnectionStatus(status);
    } catch (error) {
      console.error('Failed to load connection status:', error);
      // Set a default status if API call fails
      setConnectionStatus('CONNECT');
    }
  };

  const handleConnectClick = () => {
    if (connectionStatus === 'CONNECT') {
      setShowConnectPopup(true);
    }
  };

  const handleConnectionSuccess = () => {
    setConnectionStatus('PENDING');
    onConnectionUpdate();
  };

  const getButtonText = () => {
    switch (connectionStatus) {
      case 'FRIENDS':
        return 'Friends';
      case 'PENDING':
        return 'Pending';
      default:
        return 'Connect';
    }
  };

  const getButtonClass = () => {
    switch (connectionStatus) {
      case 'FRIENDS':
        return 'btn btn-success';
      case 'PENDING':
        return 'btn btn-warning';
      default:
        return 'btn btn-primary';
    }
  };

  const getInterestColor = (index: number) => {
    const colors = ['#007bff', '#6f42c1', '#28a745', '#fd7e14'];
    return colors[index % colors.length];
  };

  return (
    <>
      <div className="col-12 col-md-4 mb-4">
        <div className="card h-100" style={{ border: '2px solid #000' }}>
          <div className="card-body d-flex flex-column">
            {/* Avatar */}
            <div className="text-center mb-3">
              <div 
                className="mx-auto rounded-circle d-flex align-items-center justify-content-center"
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: '#f8f9fa',
                  border: '3px solid #000'
                }}
              >
                {user.profile.profilePhoto?.url ? (
                  <img 
                    src={user.profile.profilePhoto.url} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="rounded-circle"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span className="text-muted" style={{ fontSize: '24px' }}>
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                )}
              </div>
            </div>

            {/* Name */}
            <h5 className="card-title text-center mb-3">
              {user.firstName} {user.lastName}
            </h5>

            {/* Connect Button */}
            <div className="text-center mb-3">
              <button
                className={`${getButtonClass()} px-4`}
                onClick={handleConnectClick}
                disabled={connectionStatus !== 'CONNECT'}
                style={{ 
                  borderRadius: '20px',
                  backgroundColor: connectionStatus === 'FRIENDS' ? '#28a745' : 
                                 connectionStatus === 'PENDING' ? '#ffc107' : '#007bff',
                  border: 'none',
                  color: connectionStatus === 'PENDING' ? '#000' : '#fff'
                }}
              >
                {getButtonText()}
              </button>
            </div>

            {/* Interests */}
            {user.profile.interests && user.profile.interests.length > 0 && (
              <div className="mt-auto">
                <div className="d-flex flex-wrap gap-1 justify-content-center">
                  {user.profile.interests.slice(0, 3).map((interest, index) => (
                    <span
                      key={index}
                      className="badge rounded-pill"
                      style={{ 
                        backgroundColor: getInterestColor(index),
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                  {user.profile.interests.length > 3 && (
                    <span className="badge rounded-pill bg-secondary">
                      +{user.profile.interests.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {<ConnectPopup
        isOpen={showConnectPopup}
        onClose={() => setShowConnectPopup(false)}
        targetUser={{
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName
        }}
        currentUserId={currentUserId}
        onSuccess={handleConnectionSuccess}
      />}
    </>
  );
}
