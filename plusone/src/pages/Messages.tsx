import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTemplate from "../components/PageTemplate";
import { connectionService, type UserProfile } from "../services/connectionService";
import { messageService } from "../services/messageService";
import { postService } from "../services/postService";
import type {
  ChatMessage,
  ConversationSummary,
} from "../types/message";
import "../styles/Messages.css";

type StoredUser = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  messengerId?: string;
};

const DEFAULT_AVATAR =
  "https://avatars.dicebear.com/api/initials/PlusOne.svg?scale=110&background=%23f5f5f5";

export default function Messages() {
  const navigate = useNavigate();
  const user = useMemo<StoredUser | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [composerValue, setComposerValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);

  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [messengerIdInput, setMessengerIdInput] = useState("");
  const [pickerLoading, setPickerLoading] = useState(false);
  const [actorMessengerId, setActorMessengerId] = useState<string | null>(
    user?.messengerId ?? null
  );

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const selectedConversation = useMemo(
    () =>
      conversations.find((c) => c.conversationId === selectedConversationId) ??
      null,
    [conversations, selectedConversationId]
  );

  useEffect(() => {
    if (!user?.userId) {
      return;
    }
    if (user.messengerId) {
      setActorMessengerId(user.messengerId);
      return;
    }

    postService
      .getProfile(user.userId)
      .then((profile) => {
        if (profile?.messengerId) {
          setActorMessengerId(profile.messengerId);
          localStorage.setItem(
            "user",
            JSON.stringify({ ...user, messengerId: profile.messengerId })
          );
        } else {
          setError("We couldn't find your messenger ID. Please log out and back in.");
        }
      })
      .catch(() =>
        setError("We couldn't load your messenger ID. Please log out and back in.")
      );
  }, [user?.userId, user?.messengerId, user]);

  useEffect(() => {
    if (!user?.userId) {
      return;
    }

    setUsersLoading(true);
    setPickerError(null);
    connectionService
      .getRecentUsers(user.userId)
      .then(setAvailableUsers)
      .catch((err) =>
        setPickerError(err instanceof Error ? err.message : "Failed to load people")
      )
      .finally(() => setUsersLoading(false));
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId) {
      navigate("/login", { replace: true });
      return;
    }
    if (!actorMessengerId) {
      setConversationsLoading(false);
      setError("Messenger ID missing. Please log out and back in to refresh it.");
      return;
    }

    (async () => {
      setConversationsLoading(true);
      setError(null);
      try {
        const data = await messageService.listConversations(
          actorMessengerId,
          user.userId
        );
        setConversations(data);
        if (data.length) {
          setSelectedConversationId((current) => current ?? data[0].conversationId);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load conversations"
        );
      } finally {
        setConversationsLoading(false);
      }
    })();
  }, [actorMessengerId, navigate, user?.userId]);

  useEffect(() => {
    if (!user?.userId || !actorMessengerId || !selectedConversationId) return;

    (async () => {
      setThreadLoading(true);
      setThreadError(null);
      try {
        const data = await messageService.fetchMessages(
          actorMessengerId,
          selectedConversationId,
          user.userId
        );
        setMessages(data);
        await messageService.markConversationRead(
          actorMessengerId,
          selectedConversationId,
          user.userId
        );
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId === selectedConversationId
              ? { ...c, hasUnread: false }
              : c
          )
        );
      } catch (err) {
        setThreadError(
          err instanceof Error ? err.message : "Failed to load messages"
        );
      } finally {
        setThreadLoading(false);
      }
    })();
  }, [actorMessengerId, selectedConversationId, user?.userId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user?.userId) {
    return null;
  }

  const handleSelectConversation = (conversationId: string) => {
    if (selectedConversationId === conversationId) return;
    setMessages([]);
    setSelectedConversationId(conversationId);
  };

  const handleSend = async () => {
    if (
      !user?.userId ||
      !actorMessengerId ||
      !selectedConversation ||
      !composerValue.trim() ||
      sending
    ) {
      return;
    }
    setSending(true);
    try {
      const payload = {
        conversationId: selectedConversation.conversationId,
        recipientMessengerId: selectedConversation.otherMessengerId,
        body: composerValue.trim(),
      };
      const newMessage = await messageService.sendMessage(
        actorMessengerId,
        payload,
        user.userId
      );
      setMessages((prev) => [...prev, newMessage]);
      setComposerValue("");
      setConversations((prev) => {
        const updated = prev.filter(
          (c) => c.conversationId !== selectedConversation.conversationId
        );
        const refreshed: ConversationSummary = {
          ...selectedConversation,
          lastMessagePreview: payload.body,
          lastMessageAt: newMessage.sentAt,
          hasUnread: false,
        };
        return [refreshed, ...updated];
      });
    } catch (err) {
      setThreadError(
        err instanceof Error ? err.message : "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  const openConversationWithUser = async (targetMessengerId: string) => {
    if (!user?.userId || !actorMessengerId) return;
    try {
      const conversation = await messageService.openConversation(
        actorMessengerId,
        targetMessengerId,
        user.userId
      );
      setConversations((prev) => {
        const filtered = prev.filter(
          (c) => c.conversationId !== conversation.conversationId
        );
        return [conversation, ...filtered];
      });
      setSelectedConversationId(conversation.conversationId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not open conversation"
      );
    }
  };

  const handleMessengerIdSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!user?.userId || !actorMessengerId || pickerLoading) return;
    const normalized = messengerIdInput.trim().toLowerCase();
    if (!normalized) return;
    setPickerError(null);
    setPickerLoading(true);
    try {
      const profile = await connectionService.getUserByMessengerId(normalized);
      if (!profile?.userId || !profile.messengerId) {
        throw new Error("No user found for that messenger ID");
      }
      if (profile.messengerId === actorMessengerId) {
        throw new Error("You already are this user");
      }
      await openConversationWithUser(profile.messengerId);
      setMessengerIdInput("");
    } catch (err) {
      setPickerError(
        err instanceof Error ? err.message : "Unable to find that messenger ID"
      );
    } finally {
      setPickerLoading(false);
    }
  };

  const renderConversationAvatar = (conversation: ConversationSummary) => {
    const url = conversation.otherUserPhotoUrl || DEFAULT_AVATAR;
    return (
      <img
        src={url}
        alt={conversation.otherUserName}
        className="conversation-avatar"
      />
    );
  };

  const renderMessageBubble = (message: ChatMessage) => {
    const isMe = message.senderMessengerId === actorMessengerId;
    return (
      <div
        key={message.id}
        className={`bubble-row ${isMe ? "me" : "them"}`}
      >
        {!isMe && (
          <img
            src={message.senderProfilePicUrl || DEFAULT_AVATAR}
            alt={message.senderName}
            className="conversation-avatar"
            style={{ width: 36, height: 36 }}
          />
        )}
        <div className={`bubble ${isMe ? "me" : "them"}`}>
          <div style={{ fontSize: 14, marginBottom: 4, opacity: 0.75 }}>
            {isMe ? "You" : message.senderName}
          </div>
          <div>{message.body}</div>
        </div>
      </div>
    );
  };

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <PageTemplate title="Messages">
      <div className="messages-layout">
        <aside className="messages-sidebar">
          <header>
            <form
              className="messages-search-form"
              onSubmit={handleMessengerIdSubmit}
              autoComplete="off"
            >
              <input
                type="text"
                className="form-control"
                placeholder="Enter Messenger ID (e.g., janedoe-ab12)"
                value={messengerIdInput}
                onChange={(e) => setMessengerIdInput(e.target.value)}
                disabled={pickerLoading || !actorMessengerId}
              />
              <button
                type="submit"
                className="btn btn-dark"
                disabled={
                  !messengerIdInput.trim() || pickerLoading || !actorMessengerId
                }
              >
                {pickerLoading ? "…" : "Go"}
              </button>
            </form>
            <p className="text-muted small mt-2 mb-1">
              Messenger IDs appear on every user's My Page.
            </p>
            {availableUsers.length > 0 && (
              <div className="small">
                <div className="fw-semibold mb-1">Recently viewed</div>
                <div className="d-flex flex-wrap gap-2">
                  {availableUsers.slice(0, 4).map((person) => (
                    <button
                      key={person.userId}
                      type="button"
                      className="btn btn-outline-dark btn-sm"
                      onClick={() =>
                        person.messengerId &&
                        setMessengerIdInput(person.messengerId)
                      }
                      disabled={!person.messengerId}
                    >
                      {person.firstName} {person.lastName}
                      {person.messengerId ? ` (${person.messengerId})` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {usersLoading && (
              <p className="text-center small mt-2 mb-0">Loading people…</p>
            )}
            {pickerError && (
              <div className="alert alert-danger small mb-0 mt-2">
                {pickerError}
              </div>
            )}
          </header>

          <div className="conversation-list">
            {conversationsLoading && (
              <p className="text-center small m-3">Loading conversations…</p>
            )}
            {!conversationsLoading && conversations.length === 0 && (
              <p className="text-center small m-3">
                No conversations yet. Pick someone above to start one.
              </p>
            )}
            {conversations.map((conversation) => (
              <div
                key={conversation.conversationId}
                className={`conversation-item ${
                  selectedConversationId === conversation.conversationId
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleSelectConversation(conversation.conversationId)
                }
              >
                {renderConversationAvatar(conversation)}
                <div style={{ flex: 1 }}>
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">
                      {conversation.otherUserName}
                    </span>
                    <small>
                      {conversation.lastMessageAt
                        ? formatTimestamp(conversation.lastMessageAt)
                        : ""}
                    </small>
                  </div>
                  <div className="conversation-preview">
                    {conversation.lastMessagePreview || "Say hello!"}
                  </div>
                  {conversation.hasUnread && (
                    <span className="badge bg-dark mt-1">New</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="messages-thread">
          {selectedConversation ? (
            <>
              <header>
                <div>
                  <div className="fw-bold">
                    {selectedConversation.otherUserName}
                  </div>
                  <div className="text-muted small">
                    Conversation with {selectedConversation.otherUserName}
                  </div>
                </div>
                <small className="text-muted">
                  {selectedConversation.lastMessageAt
                    ? formatTimestamp(selectedConversation.lastMessageAt)
                    : ""}
                </small>
              </header>
              <div className="message-scroll">
                {threadError && (
                  <div className="alert alert-danger">{threadError}</div>
                )}
                {threadLoading && (
                  <p className="text-center text-muted">Loading…</p>
                )}
                {!threadLoading && messages.length === 0 && (
                  <div className="empty-thread">
                    This conversation is empty. Start by saying hello 👋
                  </div>
                )}
                {messages.map((message) => renderMessageBubble(message))}
                <div ref={threadEndRef} />
              </div>
              <div className="composer">
                <textarea
                  value={composerValue}
                  onChange={(e) => setComposerValue(e.target.value)}
                  placeholder="Message in progress"
                  disabled={!selectedConversation || sending || !actorMessengerId}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!composerValue.trim() || sending || !actorMessengerId}
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-thread">
              Select a conversation or start a new one from the left column.
            </div>
          )}
        </section>
      </div>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </PageTemplate>
  );
}
