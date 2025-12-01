import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { postService, type AttendeeSummary } from "../services/postService";
import { connectionService } from "../services/connectionService";
import type { Post } from "../types/post";
import type { ConnectionRequest } from "../types/connection";

// Extended connection request type that includes sender information
interface ConnectionRequestWithSender extends ConnectionRequest {
  senderName?: string;
  senderPhoto?: { url?: string | null };
}

//const GOLD = "#F2E1C0";

export default function MyPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    userId: string;
    firstName: string;
    lastName: string;
    connectionsCount: number;
    requestsCount: number;
    postsCount: number;
    profilePhoto?: {
      url?: string | null;
    };
  } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequestWithSender[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState('');
  const [guestListModal, setGuestListModal] = useState<{
    open: boolean;
    loading: boolean;
    attendees: AttendeeSummary[];
    error: string;
    postTitle: string;
  }>({ open: false, loading: false, attendees: [], error: "", postTitle: "" });

  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isImageAttachment = (url?: string | null) => {
    if (!url) return false;
    const normalized = url.split("?")[0].toLowerCase();
    return (
      normalized.startsWith("data:image/") ||
      /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(normalized)
    );
  };

  const openAttachment = (url?: string | null) => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const loadBookmarkedPosts = async () => {
  if (!user?.userId) return;
  try {
    const bookmarked = await postService.getBookmarkedPosts(user.userId);
    setBookmarkedPosts(bookmarked);
  } catch (error) {
    console.error("Failed to load bookmarked posts:", error);
  }
};

  useEffect(() => {
    if (!user?.userId) return;
    (async () => {
      try {
        console.log('Loading profile for user:', user.userId);
        const res = await postService.getProfile(user.userId);
        console.log('Profile loaded:', res);
        setProfile({
          userId: res.userId,
          firstName: res.firstName,
          lastName: res.lastName,
          connectionsCount: res.connectionsCount,
          requestsCount: res.requestsCount,
          postsCount: res.postsCount,
          profilePhoto: res.profile?.profilePhoto,
        });
        setPosts(res.posts);
        
        // Load connection requests
        loadConnectionRequests();

        loadBookmarkedPosts();
      } catch (error) {
        console.error('Failed to load profile:', error);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.userId]);

  const loadConnectionRequests = async () => {
    if (!user?.userId) return;
    try {
      setRequestsLoading(true);
      const requests = await connectionService.getPendingRequests(user.userId);
      
      // Fetch sender information for each request
      const requestsWithSenders = await Promise.all(
        requests.map(async (request): Promise<ConnectionRequestWithSender> => {
          try {
            // Fetch sender's profile to get name and photo
            const senderProfile = await postService.getProfile(request.fromUserId);
            return {
              ...request,
              senderName: `${senderProfile.firstName} ${senderProfile.lastName}`,
              senderPhoto: senderProfile.profile?.profilePhoto,
            };
          } catch (error) {
            console.error(`Failed to load sender profile for ${request.fromUserId}:`, error);
            // If profile fetch fails, still include the request but without sender info
            return {
              ...request,
              senderName: "Unknown User",
            };
          }
        })
      );
      
      setConnectionRequests(requestsWithSenders);
    } catch (error) {
      console.error('Failed to load connection requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const onDelete = async (postId?: string) => {
    if (!postId) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await postService.remove(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const onEdit = (p: Post) => {
    navigate("/MakePost", { state: { post: p } }); // we'll reuse MakeAPost for editing
  };

  const handleUnbookmark = async (postId: string) => {
  if (!user?.userId) return;

  try {
    await postService.unbookmarkPost(user.userId, postId);
    setBookmarkedPosts((prev) => prev.filter((p) => p.id !== postId));
  } catch (err) {
    console.error("Failed to unbookmark:", err);
    alert("Failed to unbookmark. Please try again.");
  }
};

  const handleAcceptRequest = async (requestId: string) => {
    if (!user?.userId) return;
    try {
      await connectionService.acceptConnectionRequest(requestId, user.userId);
      // Reload requests to update the list
      loadConnectionRequests();
      // Reload profile to update connection count
      await reloadProfile();
    } catch (error) {
      console.error('Failed to accept request:', error);
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user?.userId) return;
    try {
      await connectionService.rejectConnectionRequest(requestId, user.userId);
      // Reload requests to update the list
      loadConnectionRequests();
      // Reload profile to update counts
      await reloadProfile();
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request. Please try again.');
    }
  };

  const reloadProfile = async () => {
    if (!user?.userId) return;
    try {
      const res = await postService.getProfile(user.userId);
      setProfile({
        userId: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        connectionsCount: res.connectionsCount,
        requestsCount: res.requestsCount,
        postsCount: res.postsCount,
      });
    } catch (error) {
      console.error('Failed to reload profile:', error);
    }
  };

  const openGuestList = async (post: Post) => {
    if (!user?.userId || !post.id) return;
    setGuestListModal({ open: true, loading: true, attendees: [], error: "", postTitle: post.title });
    try {
      const attendees = await postService.getRsvps(post.id, user.userId);
      setGuestListModal((prev) => ({ ...prev, loading: false, attendees }));
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Unable to load guest list.";
      setGuestListModal((prev) => ({ ...prev, loading: false, error: message }));
    }
  };

  const closeGuestList = () => {
    setGuestListModal({ open: false, loading: false, attendees: [], error: "", postTitle: "" });
  };

  if (!user?.userId) {
    return <div className="container py-5">You’re not logged in.</div>;
  }

  return (
    <div className="bg-white" style={{ minHeight: "100vh" }}>
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
        <h1 className="h6 text-light mb-0">My Page</h1>
      </header>

      <Sidebar isOpen={navOpen} onClose={() => setNavOpen(false)} />

      <main className="container py-4">
        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <>
            {/* Profile block */}
            <div className="d-flex align-items-start gap-4 mb-4">
              {/* avatar */}
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  border: "6px solid #000",
                  background: "#efefef",
                  overflow: "hidden",
                }}
              >
                {profile?.profilePhoto?.url ? (
                  <img 
                    src={profile.profilePhoto.url} 
                    alt={`${profile.firstName} ${profile.lastName}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span className="text-muted" style={{ fontSize: '36px' }}>
                    {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h2 className="h4 mb-1">
                  {profile?.firstName} {profile?.lastName}
                </h2>
                <div className="text-muted small">
                  {posts.length} posts
                  <br />
                  <span className="fw-semibold">Connections: {profile?.connectionsCount ?? 0}</span>
                  <br />
                  {profile?.requestsCount ?? 0} requests
                </div>
                <Link
                  to="/edit-profile"
                  className="d-inline-flex align-items-center gap-2 mt-2 text-decoration-none"
                  style={{ color: "#000" }}
                >
                  <span className="small">✎</span>
                  <span className="small">Edit Profile</span>
                </Link>
              </div>
            </div>

            {/* Connection Requests Section */}
            <div className="mb-4">
              <h3 className="h5 fw-bold mb-3">Connection Requests ({connectionRequests.length})</h3>
              
              {requestsLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="ms-2">Loading requests...</span>
                </div>
              ) : connectionRequests.length === 0 ? (
                <div className="text-muted py-3">
                  <p className="mb-0">No pending connection requests.</p>
                </div>
              ) : (
                <div className="row g-3">
                  {connectionRequests.map((request) => (
                    <div key={request.id} className="col-12 col-md-6">
                      <div className="p-3 border border-2" style={{ borderColor: "#000" }}>
                        <div className="d-flex align-items-start gap-3 mb-3">
                          {/* Sender Avatar */}
                          <div
                            className="d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: "50%",
                              border: "2px solid #000",
                              background: "#efefef",
                              overflow: "hidden",
                            }}
                          >
                            {request.senderPhoto?.url ? (
                              <img 
                                src={request.senderPhoto.url} 
                                alt={request.senderName || "Sender"}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span className="text-muted" style={{ fontSize: '18px' }}>
                                {request.senderName?.charAt(0) || "?"}
                              </span>
                            )}
                          </div>
                          
                          {/* Sender Info */}
                          <div className="flex-grow-1">
                            <h6 className="mb-1">
                              {request.senderName || "Connection Request"}
                            </h6>
                            <small className="text-muted">{timeAgo(request.createdAt)}</small>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="mb-1"><strong>Message:</strong></p>
                          <p className="small mb-0 text-muted">{request.message}</p>
                        </div>
                        
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            Accept
                          </button>
                          <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Posts header */}
            <h3 className="h5 fw-bold mb-3">My Posts</h3>

            {/* Posts grid */}
            <div className="row g-3">
              {posts.map((p) => {
                const hasImagePreview = isImageAttachment(p.imageUrl);
                return (
                  <div key={p.id} className="col-12 col-md-4">
                    <div
                      className="p-2 border border-2"
                      style={{ borderColor: "#000" }}
                    >
                      <div className="d-flex justify-content-between small">
                        <span className="text-muted">
                          {p.category}
                          {p.category === "Events" && p.eventDate ? ` • ${formatEventDateTime(p.eventDate, p.eventTime)}` : ""}
                        </span>
                        <span className="text-muted">{timeAgo(p.createdAt)}</span>
                      </div>
                      <hr className="my-1" />
                      <hr className="mt-0 mb-2" />
                      <div className="fw-bold">{p.title}</div>
                      <div className="d-flex gap-2 mt-2">
                        {p.imageUrl ? (
                          hasImagePreview ? (
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              style={{
                                width: 90,
                                height: 60,
                                objectFit: "cover",
                                border: "1px solid #000",
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-dark"
                              style={{ minWidth: 120 }}
                              onClick={() => openAttachment(p.imageUrl)}
                            >
                              View attachment
                            </button>
                          )
                        ) : null}
                        <p className="small mb-0">{p.description}</p>
                      </div>

                      <div className="d-flex justify-content-between align-items-center gap-3 mt-3">
                        {p.category === "Events" ? (
                          <button
                            className="btn btn-outline-dark btn-sm"
                            onClick={() => openGuestList(p)}
                            style={{ minWidth: 120 }}
                          >
                            Guest list
                            {(() => {
                              const count = p.rsvpCount ?? p.rsvpUserIds?.length ?? 0;
                              return count ? ` (${count})` : "";
                            })()}
                          </button>
                        ) : (
                          <span />
                        )}
                        <div className="d-flex justify-content-end align-items-center gap-3">
                          <button
                            className="btn btn-link p-0"
                            onClick={() => onEdit(p)}
                            title="Edit"
                          >
                            <span style={{ fontSize: 20, color: "#000" }}>🖉</span>
                          </button>
                          <button
                            className="btn btn-link p-0"
                            onClick={() => onDelete(p.id)}
                            title="Delete"
                          >
                            <span style={{ fontSize: 20, color: "#000" }}>🗑️</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
              );
            })}

              {/* New Post tile */}
              <div className="col-12 col-md-4">
                <button
                  type="button"
                  onClick={() => navigate("/makepost")}
                  className="post-card new-post-card w-100"
                  aria-label="Create a new post"
                >
                  <span className="new-post-plus" aria-hidden />
                  <span className="new-post-label">New Post</span>
                </button>
              </div>
            </div>
            {/* Bookmarked Posts */}
            <h3 className="h5 fw-bold mb-3 mt-4">Bookmarked Posts</h3>
            <div className="row g-3">
              {bookmarkedPosts.length === 0 ? (
                <div className="col-12">
                  <p className="text-muted small mb-0">
                    You haven&apos;t bookmarked any posts yet.
                  </p>
                </div>
              ) : (
                bookmarkedPosts.map((p) => {
                  const hasImagePreview = isImageAttachment(p.imageUrl);
                  return (
                    <div key={p.id} className="col-12 col-md-4">
                      <div className="p-2 border border-2" style={{ borderColor: "#000" }}>
                        <div className="d-flex justify-content-end mt-2">
                          <button
                            className="btn btn-link p-0"
                            title="Remove bookmark"
                            onClick={() => handleUnbookmark(p.id!)}
                          >
                            <span style={{ fontSize: 20, color: "#000" }}>★</span>
                          </button>
                        </div>
                        <div className="d-flex justify-content-between small">
                          <span className="text-muted">
                            {p.category}
                            {p.category === "Events" && p.eventDate ? ` • ${formatEventDateTime(p.eventDate, p.eventTime)}` : ""}
                          </span>
                          <span className="text-muted">{timeAgo(p.createdAt)}</span>
                        </div>
                        <hr className="my-1" />
                        <hr className="mt-0 mb-2" />
                        <div className="fw-bold">{p.title}</div>
                        <div className="d-flex gap-2 mt-2">
                          {p.imageUrl ? (
                            hasImagePreview ? (
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                style={{
                                  width: 90,
                                  height: 60,
                                  objectFit: "cover",
                                  border: "1px solid #000",
                                }}
                              />
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark"
                                style={{ minWidth: 120 }}
                                onClick={() => openAttachment(p.imageUrl)}
                              >
                                View attachment
                              </button>
                            )
                          ) : null}
                          <p className="small mb-0">{p.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      {guestListModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="d-flex align-items-center justify-content-center"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1050,
            padding: "16px",
          }}
        >
          <div
            className="bg-white border border-2"
            style={{ borderColor: "#000", maxWidth: 480, width: "100%", borderRadius: 8 }}
          >
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
              <div>
                <div className="fw-bold">Guest list</div>
                <div className="small text-muted">{guestListModal.postTitle}</div>
              </div>
              <button className="btn btn-sm btn-outline-dark" onClick={closeGuestList}>
                Close
              </button>
            </div>

            <div className="p-3" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {guestListModal.loading ? (
                <div className="text-center text-muted">Loading attendees…</div>
              ) : guestListModal.error ? (
                <div className="alert alert-danger mb-0">{guestListModal.error}</div>
              ) : guestListModal.attendees.length === 0 ? (
                <div className="text-muted">No RSVPs yet.</div>
              ) : (
                <ul className="list-unstyled mb-0">
                  {guestListModal.attendees.map((a) => (
                    <li key={a.id} className="py-2 border-bottom">
                      <div className="fw-semibold">
                        {a.firstName} {a.lastName}
                      </div>
                      <div className="small text-muted">RSVP’d</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const h = Math.floor(diff / (1000 * 60 * 60));
  if (h < 24) return `${h} hours ago`;
  const dys = Math.floor(h / 24);
  return `${dys} days ago`;
}

function formatEventDateTime(date?: string | null, time?: string | null) {
  if (!date) return "";
  const displayTime = time ? time.slice(0, 5) : "";
  return displayTime ? `${date} @ ${displayTime}` : date;
}
