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
  const [users, setUsers] = useState<UserProfile[]>([]);
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
      loadRecentUsers();
    }
  }, [user?.userId]);

  const loadRecentUsers = async () => {
    try {
      setLoading(true);
      const recentUsers = await connectionService.getRecentUsers(user.userId);
      setUsers(recentUsers);
    } catch (err: any) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionUpdate = () => {
    // Refresh the users list to update connection statuses
    loadRecentUsers();
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
        
        <div className="row">
          <div className="col-12">
            <h2 className="h5 mb-3">Connect with Other Vanderbilt Alumni</h2>
            <p className="text-muted mb-4">
              Discover and connect with fellow Vanderbilt graduates in your area.
            </p>
          </div>
        </div>

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
        ) : users.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No users found. Be the first to join!</p>
          </div>
        ) : (
          <div className="row">
            {users.map((userProfile) => (
              <UserProfileCard
                key={userProfile.userId}
                user={userProfile}
                currentUserId={user.userId}
                onConnectionUpdate={handleConnectionUpdate}
              />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default Home;
