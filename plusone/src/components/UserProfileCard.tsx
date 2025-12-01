import { useState, useEffect } from 'react';
import { connectionService } from '../services/connectionService';
import ConnectPopup from './ConnectPopup';

// Tooltip component for showing all interests
function InterestsTooltip({ interests, show }: { interests: string[]; show: boolean }) {
  if (!show || interests.length <= 3) return null;

  return (
    <div
      className="interests-tooltip"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '8px',
        backgroundColor: '#fff',
        border: '2px solid #000',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '200px',
        maxWidth: '300px',
        maxHeight: '300px',
        overflowY: 'auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <div className="fw-bold mb-2" style={{ fontSize: '0.875rem' }}>
        All Interests:
      </div>
      <div className="d-flex flex-wrap gap-1">
        {interests.map((interest, index) => {
          const colors = ['#007bff', '#6f42c1', '#28a745', '#fd7e14'];
          const color = colors[index % colors.length];
          return (
            <span
              key={index}
              className="badge rounded-pill"
              style={{
                backgroundColor: color,
                color: 'white',
                fontSize: '0.7rem',
              }}
            >
              {interest}
            </span>
          );
        })}
      </div>
      {/* Tooltip arrow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid #000',
        }}
      />
    </div>
  );
}

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
  isFriend?: boolean; // Optional prop to indicate this user is already a friend
}

export default function UserProfileCard({ user, currentUserId, onConnectionUpdate, isFriend = false }: UserProfileCardProps) {
  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECT');
  const [showConnectPopup, setShowConnectPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInterestsTooltip, setShowInterestsTooltip] = useState(false);

  useEffect(() => {
    // If isFriend prop is true, set status directly without API call
    if (isFriend) {
      setConnectionStatus('FRIENDS');
    } else {
      loadConnectionStatus();
    }
  }, [user.userId, currentUserId, isFriend]);

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
              <div 
                className="mt-auto"
                style={{ position: 'relative' }}
                onMouseEnter={() => {
                  if (user.profile.interests && user.profile.interests.length > 3) {
                    setShowInterestsTooltip(true);
                  }
                }}
                onMouseLeave={() => setShowInterestsTooltip(false)}
              >
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
                    <span 
                      className="badge rounded-pill bg-secondary"
                      style={{ cursor: 'help' }}
                    >
                      +{user.profile.interests.length - 3}
                    </span>
                  )}
                </div>
                <InterestsTooltip 
                  interests={user.profile.interests} 
                  show={showInterestsTooltip}
                />
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
