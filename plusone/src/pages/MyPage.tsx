import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { postService } from "../services/postService";
import { connectionService } from "../services/connectionService";
import type { Post } from "../types/post";
import type { ConnectionRequest } from "../types/connection";

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
  } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

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
        });
        setPosts(res.posts);
        
        // Load connection requests
        loadConnectionRequests();
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
      setConnectionRequests(requests);
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

  if (!user?.userId) {
    return <div className="container py-5">You’re not logged in.</div>;
  }

  return (
    <div className="bg-white" style={{ minHeight: "100vh" }}>
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
              {/* avatar placeholder */}
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  border: "6px solid #000",
                  background: "#efefef",
                }}
              />
              <div>
                <h2 className="h4 mb-1">
                  {profile?.firstName} {profile?.lastName}
                </h2>
                <div className="text-muted small">
                  {posts.length} posts
                  <br />
                  {profile?.connectionsCount ?? 0} connections
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
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">Connection Request</h6>
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
              {posts.map((p) => (
                <div key={p.id} className="col-12 col-md-4">
                  <div
                    className="p-2 border border-2"
                    style={{ borderColor: "#000" }}
                  >
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted">
                        {p.category}
                        {p.category === "Events" && p.eventDate ? ` • ${p.eventDate}` : ""}
                      </span>
                      <span className="text-muted">{timeAgo(p.createdAt)}</span>
                    </div>
                    <hr className="my-1" />
                    <hr className="mt-0 mb-2" />
                    <div className="fw-bold">{p.title}</div>
                    <div className="d-flex gap-2 mt-2">
                      {p.imageUrl ? (
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
                      ) : null}
                      <p className="small mb-0">{p.description}</p>
                    </div>

                    <div className="d-flex justify-content-end align-items-center gap-3 mt-2">
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
              ))}

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
          </>
        )}
      </main>
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
