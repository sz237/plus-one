import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import UserProfileCard from "../components/UserProfileCard";
import { connectionService } from "../services/connectionService";
import { postService } from "../services/postService";
import type { Post } from "../types/post";

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

interface EventPost extends Post {
  author?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

function Home() {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [sameCityUsers, setSameCityUsers] = useState<UserProfile[]>([]);
  const [sameCityError, setSameCityError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventPosts, setEventPosts] = useState<EventPost[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  // Load users on mount
  useEffect(() => {
    if (user?.userId) {
      loadUsers();
      loadEventPosts();
    }
  }, [user?.userId]);

  // Refresh when navigating to this page (detect route changes)
  const prevPathRef = useRef<string>('');
  useEffect(() => {
    if (location.pathname === '/home' && user?.userId) {
      // Check if we just navigated to this page (pathname changed to /home)
      const justNavigated = prevPathRef.current !== '/home' && location.pathname === '/home';
      if (prevPathRef.current) { // Only update after first render
        prevPathRef.current = location.pathname;
      } else {
        prevPathRef.current = location.pathname;
      }
      
      // Check if connections changed
      const connectionChanged = localStorage.getItem('connectionChanged');
      if (connectionChanged === 'true') {
        localStorage.removeItem('connectionChanged');
        loadUsers();
        loadEventPosts();
      } else if (justNavigated) {
        // Also reload when just navigated here to ensure fresh data
        loadUsers();
        loadEventPosts();
      }
    }
  }, [location.pathname, user?.userId]);

  // Also check when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      const connectionChanged = localStorage.getItem('connectionChanged');
      if (connectionChanged === 'true' && user?.userId) {
        localStorage.removeItem('connectionChanged');
        loadUsers();
        loadEventPosts();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.userId]);

  const loadEventPosts = async () => {
    if (!user?.userId) return;
    
    try {
      setEventsLoading(true);
      setEventsError('');
      
      // Get all friends
      const friendsList = await connectionService.getFriends(user.userId);
      
      if (!friendsList || friendsList.length === 0) {
        setEventPosts([]);
        return;
      }
      
      // Fetch posts from all friends in parallel
      const allPostsPromises = friendsList.map(async (friend) => {
        try {
          const posts = await postService.list(friend.userId);
          return posts.map(post => ({
            ...post,
            // Use existing author if available, otherwise use friend info
            author: (post as any).author || {
              id: friend.userId,
              firstName: friend.firstName,
              lastName: friend.lastName
            }
          }));
        } catch (err) {
          console.error(`Error loading posts for ${friend.userId}:`, err);
          return [];
        }
      });
      
      const allPostsArrays = await Promise.all(allPostsPromises);
      const allPosts = allPostsArrays.flat();
      
      // Filter for Events category only
      const eventsOnly = allPosts.filter(post => post.category === "Events") as EventPost[];
      
      // Sort by createdAt (newest first)
      eventsOnly.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setEventPosts(eventsOnly);
    } catch (err: any) {
      console.error('Error loading event posts:', err);
      setEventsError('Failed to load event posts');
      setEventPosts([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      setSameCityError("");
      
      let suggestionsLoaded = false;
      let friendsLoaded = false;
      let sameCityLoaded = false;
      
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

      try {
        const cityUsers = await connectionService.getSameCityUsers(user.userId);
        setSameCityUsers(cityUsers || []);
        sameCityLoaded = true;
      } catch (err: any) {
        console.error('Error loading same-city users:', err);
        setSameCityUsers([]);
        setSameCityError('Could not load people near you.');
      }
      
      // Only show error if both failed
      if (!suggestionsLoaded && !friendsLoaded && !sameCityLoaded) {
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
    loadEventPosts();
  };

  const formatEventDateTime = (date?: string | null, time?: string | null) => {
    if (!date) return "";
    const dateStr = new Date(date).toLocaleDateString();
    const timeStr = time ? time.slice(0, 5) : "";
    return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white" style={{ minHeight: "100vh" }}>
      {/* top black header with hamburger */}
      <header
        className="d-flex align-items-center"
        style={{ height: 65, background: "#000", paddingLeft: 12, gap: 8, position: "relative", zIndex: 1055 }}
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
            <div className="row">
              {/* Main area - reserved for events */}
              <div className="col-12 col-lg-8">
                <div
                  style={{
                    maxHeight: "calc(100vh - 200px)",
                    overflowY: "auto",
                    paddingRight: "8px"
                  }}
                >
                  {eventsLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading events...</span>
                      </div>
                      <p className="mt-2 text-muted small">Loading events...</p>
                    </div>
                  ) : eventsError ? (
                    <div className="alert alert-warning" role="alert">
                      {eventsError}
                    </div>
                  ) : eventPosts.length === 0 ? (
                    <div className="text-center py-5">
                      <p className="text-muted">No events from your connections yet.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {eventPosts.map((post) => {
                        const authorName = post.author
                          ? `${post.author.firstName} ${post.author.lastName}`
                          : "Unknown";
                        const image = post.coverImageUrl || post.imageUrl;
                        
                        return (
                          <div
                            key={post.id}
                            className="p-3"
                            style={{
                              border: "2px solid #000",
                              borderRadius: "4px"
                            }}
                          >
                            {image && (
                              <img
                                src={image}
                                alt={post.title}
                                className="mb-3"
                                style={{
                                  width: "100%",
                                  maxHeight: "300px",
                                  objectFit: "cover",
                                  border: "2px solid #000",
                                  borderRadius: "4px"
                                }}
                              />
                            )}
                            <h4 className="mb-2 fw-bold">{post.title}</h4>
                            <div className="small text-muted mb-2">
                              <div>
                                Posted by <strong>{authorName}</strong>
                              </div>
                              {post.createdAt && (
                                <div>{formatTimeAgo(post.createdAt)}</div>
                              )}
                              {post.eventDate && (
                                <div className="mt-1">
                                  <strong>Event:</strong> {formatEventDateTime(post.eventDate, post.eventTime)}
                                </div>
                              )}
                            </div>
                            {post.description && (
                              <p className="mb-2" style={{ whiteSpace: "pre-wrap" }}>
                                {post.description}
                              </p>
                            )}
                            {post.rsvpCount !== undefined && post.rsvpCount > 0 && (
                              <div className="small text-muted">
                                {post.rsvpCount} {post.rsvpCount === 1 ? "person" : "people"} RSVP'd
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right sidebar with two boxes */}
              <div className="col-12 col-lg-4 mt-3 mt-lg-0">
                {/* Suggested Users Box - first box */}
                <div
                  className="border border-2 p-3 mb-3"
                  style={{ borderColor: "#000", maxHeight: 420, overflowY: "auto" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h3 className="h6 mb-0">People you might want to connect with</h3>
                    {suggestedUsers.length > 0 && (
                      <span className="badge text-bg-light" style={{ border: "1px solid #000" }}>
                        {suggestedUsers.length}
                      </span>
                    )}
                  </div>
                  {suggestedUsers.length === 0 ? (
                    <p className="text-muted small">You are already friends with everyone on the platform.</p>
                  ) : (
                    <div>
                      {suggestedUsers.map((userProfile) => (
                        <UserProfileCard
                          key={userProfile.userId}
                          user={userProfile}
                          currentUserId={user.userId}
                          onConnectionUpdate={handleConnectionUpdate}
                          compact={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-4 mt-3 mt-lg-0">
                  <div
                    className="border border-2 p-3 h-100"
                    style={{ borderColor: "#000", maxHeight: 420, overflowY: "auto" }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h3 className="h6 mb-0">Near you</h3>
                      {sameCityUsers.length > 0 && (
                        <span className="badge text-bg-light" style={{ border: "1px solid #000" }}>
                          {sameCityUsers.length}
                        </span>
                      )}
                    </div>
                    {sameCityError ? (
                      <div className="text-danger small mb-0">{sameCityError}</div>
                    ) : sameCityUsers.length === 0 ? (
                      <div className="text-muted small">No other users in your city yet.</div>
                    ) : (
                      sameCityUsers.map((u) => (
                        <div key={u.userId} className="d-flex align-items-start justify-content-between py-2 border-bottom">
                          <div>
                            <div className="fw-semibold small">
                              {u.firstName} {u.lastName}
                            </div>
                            <div className="text-muted small">
                              {u.profile?.job?.title || "—"}
                              {u.profile?.job?.companiesName ? ` @ ${u.profile.job.companiesName}` : ""}
                            </div>
                          </div>
                          <button
                            className="btn btn-outline-dark btn-sm"
                            onClick={async () => {
                              try {
                                await connectionService.createConnectionRequest(user.userId, {
                                  toUserId: u.userId,
                                  message: "",
                                });
                                setSameCityUsers((prev) =>
                                  prev.filter((candidate) => candidate.userId !== u.userId)
                                );
                                handleConnectionUpdate();
                              } catch (err) {
                                console.error("Failed to send request", err);
                              }
                            }}
                          >
                            Connect
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  {sameCityError ? (
                    <div className="text-danger small mb-0">{sameCityError}</div>
                  ) : sameCityUsers.length === 0 ? (
                    <div className="text-muted small">No other users in your city yet.</div>
                  ) : (
                    sameCityUsers.map((u) => (
                      <div key={u.userId} className="d-flex align-items-start justify-content-between py-2 border-bottom">
                        <div>
                          <div className="fw-semibold small">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-muted small">
                            {u.profile?.job?.title || "—"}
                            {u.profile?.job?.companiesName ? ` @ ${u.profile.job.companiesName}` : ""}
                          </div>
                        </div>
                        <button
                          className="btn btn-outline-dark btn-sm"
                          onClick={async () => {
                            try {
                              await connectionService.createConnectionRequest(user.userId, {
                                toUserId: u.userId,
                                message: "",
                              });
                              handleConnectionUpdate();
                            } catch (err) {
                              console.error("Failed to send request", err);
                            }
                          }}
                        >
                          Connect
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
                      isFriend={true}
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
