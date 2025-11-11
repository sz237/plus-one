import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import UserProfileCard from "../components/UserProfileCard";
import { connectionService } from "../services/connectionService";

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

function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (user?.userId) {
      loadUsers();
    }
  }, [user?.userId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      let suggestionsLoaded = false;
      let friendsLoaded = false;
      
      // Load suggestions and friends separately so one failure doesn't block the other
      try {
        const suggestions = await connectionService.getSuggestedUsers(user.userId);
        setSuggestedUsers(suggestions || []);
        suggestionsLoaded = true;
      } catch (err: any) {
        console.error('Error loading suggested users:', err);
        console.error('Error details:', err.response?.data || err.message);
        setSuggestedUsers([]);
      }
      
      try {
        const friendsList = await connectionService.getFriends(user.userId);
        setFriends(friendsList || []);
        friendsLoaded = true;
      } catch (err: any) {
        console.error('Error loading friends:', err);
        console.error('Error details:', err.response?.data || err.message);
        setFriends([]);
      }
      
      // Only show error if both failed
      if (!suggestionsLoaded && !friendsLoaded) {
        setError('Failed to load users. Please try refreshing the page.');
      }
    } catch (err: any) {
      console.error('Unexpected error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionUpdate = () => {
    // Refresh the users list to update connection statuses
    loadUsers();
  };

  return (
    <div className="bg-white" style={{ minHeight: "100vh" }}>
      {/* top black header with hamburger */}
      <header
        className="d-flex align-items-center"
        style={{ height: 65, background: "#000", paddingLeft: 12, gap: 8 }}
      >
        <button
          aria-label="Toggle navigation"
          aria-expanded={navOpen}
          aria-pressed={navOpen}
          onClick={() => setNavOpen((o) => !o)}
          className="btn btn-link p-0 m-0"
          style={{
            lineHeight: 0,
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className={`hamburger ${navOpen ? "open" : ""}`}>
            <span className="line" />
            <span className="line" />
            <span className="line" />
          </div>
        </button>
      </header>

      {/* slide-in sidebar */}
      <Sidebar isOpen={navOpen} onClose={() => setNavOpen(false)} />

      {/* page content */}
      <main className="container py-4">
      <h1 className="h4 mb-4">
          Hi {user?.firstName || "User"}, Welcome to PlusOne!
        </h1>
        
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading users...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <>
            {/* Suggested Users Section */}
            <div className="mb-5">
              <h2 className="h5 mb-3">People you might want to connect with</h2>
              {suggestedUsers.length === 0 ? (
                <p className="text-muted">You are already friends with everyone on the platform.</p>
              ) : (
                <div className="row">
                  {suggestedUsers.map((userProfile) => (
                    <UserProfileCard
                      key={userProfile.userId}
                      user={userProfile}
                      currentUserId={user.userId}
                      onConnectionUpdate={handleConnectionUpdate}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Friends Section */}
            {friends.length > 0 && (
              <div className="mb-5">
                <h2 className="h5 mb-3">Your Connections</h2>
                <div className="row">
                  {friends.map((userProfile) => (
                    <UserProfileCard
                      key={userProfile.userId}
                      user={userProfile}
                      currentUserId={user.userId}
                      onConnectionUpdate={handleConnectionUpdate}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}

export default Home;
