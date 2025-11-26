import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Send, Loader2, Calendar, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { 
  getPartnershipMessages, 
  postPartnershipMessage,
  getPartnershipMeetings,
  createPartnershipMeeting,
  acceptPartnershipMeeting
} from "../../services/api";

const ACTIVE_POLL_INTERVAL_MS = 5000;

const normalizeChatMessage = (msg) => ({
  id: msg.id,
  text: msg.message || msg.text || "",
  createdAt: msg.created_at || msg.timestamp || new Date().toISOString(),
  senderId: msg.sender_user_id ?? msg.senderId ?? null,
  senderName: msg.sender_name || msg.senderName || "Partner",
  senderRole: msg.sender_role || msg.senderRole || "partner",
});

const ChatDrawer = ({
  open,
  onClose,
  partnershipId,
  partnerName,
  partnerSubtitle,
  partnerAvatar,
  currentUserId,
  currentUserRole = "ngo",
}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  
  // Meeting state
  const [meetings, setMeetings] = useState([]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingTime, setMeetingTime] = useState("");
  const [creatingMeeting, setCreatingMeeting] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  const fetchMessages = useCallback(async ({ showSpinner = false } = {}) => {
    if (!partnershipId) return;
    try {
      if (showSpinner) {
        setLoading(true);
      }
      const response = await getPartnershipMessages(partnershipId, { limit: 200 });
      const payload = Array.isArray(response?.messages)
        ? response.messages
        : response?.data?.messages || [];
      setMessages(payload.map(normalizeChatMessage));
      setError(null);
    } catch (err) {
      console.error("Failed to load chat messages", err);
      setError(err.message || "Failed to load messages");
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [partnershipId]);

  useEffect(() => {
    if (!open || !partnershipId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const load = async (withSpinner = false) => {
      if (cancelled) return;
      await fetchMessages({ showSpinner: withSpinner });
    };

    load(true);
    const interval = setInterval(load, ACTIVE_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [open, partnershipId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = async () => {
    if (!canSend || !partnershipId) return;
    try {
      setSending(true);
      const response = await postPartnershipMessage(partnershipId, { message: input.trim() });
      const payload = response?.message || response?.data?.message;
      const newMessage = payload ? normalizeChatMessage(payload) : null;
      if (newMessage) {
        setMessages((prev) => [...prev, newMessage]);
      } else {
        // fallback to refetch
        fetchMessages();
      }
      setInput("");
      setError(null);
    } catch (err) {
      console.error("Failed to send message", err);
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // Meeting functions
  const fetchMeetings = useCallback(async () => {
    if (!partnershipId) return;
    try {
      const response = await getPartnershipMeetings(partnershipId);
      const payload = Array.isArray(response?.meetings)
        ? response.meetings
        : response?.data?.meetings || [];
      setMeetings(payload);
    } catch (err) {
      console.error("Failed to load meetings", err);
    }
  }, [partnershipId]);

  useEffect(() => {
    if (open && partnershipId) {
      fetchMeetings();
      const interval = setInterval(fetchMeetings, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [open, partnershipId, fetchMeetings]);

  const handleCreateMeeting = async () => {
    if (!meetingTime || !partnershipId) return;
    try {
      setCreatingMeeting(true);
      const scheduledDateTime = new Date(meetingTime).toISOString();
      await createPartnershipMeeting(partnershipId, { scheduled_time: scheduledDateTime });
      setShowMeetingModal(false);
      setMeetingTime("");
      fetchMeetings();
      fetchMessages(); // Refresh to show meeting in messages
    } catch (err) {
      console.error("Failed to create meeting", err);
      setError(err.message || "Failed to create meeting");
    } finally {
      setCreatingMeeting(false);
    }
  };

  const handleAcceptMeeting = async (meetingId) => {
    if (!partnershipId) return;
    try {
      await acceptPartnershipMeeting(partnershipId, meetingId);
      fetchMeetings();
      fetchMessages();
    } catch (err) {
      console.error("Failed to accept meeting", err);
      setError(err.message || "Failed to accept meeting");
    }
  };

  // Timer component
  const MeetingTimer = ({ scheduledTime }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isEnded, setIsEnded] = useState(false);
    const meetingDate = new Date(scheduledTime);
    const endTime = new Date(meetingDate.getTime() + 10 * 60 * 1000); // Add 10 minutes

    useEffect(() => {
      const updateTimer = () => {
        const now = new Date();

        // Check if meeting has ended (10 minutes after scheduled time)
        if (now > endTime) {
          setIsEnded(true);
          setTimeLeft("Meeting ended");
          return;
        }

        const diff = meetingDate - now;

        if (diff <= 0) {
          setTimeLeft("Meeting started");
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }, [meetingDate, endTime]);

    return (
      <span className={`font-semibold ${isEnded ? 'text-slate-500' : 'text-indigo-600'}`}>
        {timeLeft}
      </span>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wide">Chat with</p>
            <h3 className="text-lg font-semibold text-slate-800">{partnerName || "Partner"}</h3>
            {partnerSubtitle && (
              <p className="text-xs text-slate-500 mt-1">{partnerSubtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMeetingModal(true)}
              className="p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 transition-colors text-indigo-600"
              title="Schedule Meeting"
            >
              <Calendar size={18} />
            </button>
            {partnerAvatar && (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-600">
                {partnerAvatar}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {/* Display Meetings */}
          {meetings.length > 0 && (
            <div className="space-y-3 mb-4">
              {meetings.map((meeting) => {
                const scheduledDate = new Date(meeting.scheduled_time);
                const isPending = meeting.status === 'pending';
                const isAccepted = meeting.status === 'accepted';
                const isEnded = meeting.status === 'ended';
                const isOrganizer = meeting.organizer_user_id === currentUserId;
                
                // Check if meeting has ended (10 minutes after scheduled time)
                const endTime = new Date(scheduledDate.getTime() + 10 * 60 * 1000);
                const meetingHasEnded = new Date() > endTime && isAccepted;
                
                return (
                  <div
                    key={meeting.id}
                    className={`rounded-xl p-4 border-2 ${
                      isEnded || meetingHasEnded
                        ? 'bg-slate-50 border-slate-300'
                        : isAccepted
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar size={16} className={isEnded || meetingHasEnded ? 'text-slate-500' : 'text-indigo-600'} />
                          <span className={`text-sm font-semibold ${isEnded || meetingHasEnded ? 'text-slate-600' : 'text-slate-800'}`}>
                            {isPending ? 'Meeting Invitation' : isEnded || meetingHasEnded ? 'Meeting Ended' : 'Scheduled Meeting'}
                          </span>
                          {isAccepted && !isEnded && !meetingHasEnded && <CheckCircle size={16} className="text-emerald-600" />}
                        </div>
                        <p className={`text-xs mb-1 ${isEnded || meetingHasEnded ? 'text-slate-500' : 'text-slate-600'}`}>
                          {scheduledDate.toLocaleString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {isAccepted && !isEnded && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <Clock size={14} className={meetingHasEnded ? 'text-slate-400' : 'text-indigo-500'} />
                            <MeetingTimer scheduledTime={meeting.scheduled_time} />
                          </div>
                        )}
                        {isAccepted && meeting.meeting_link && !isEnded && !meetingHasEnded && (
                          <a
                            href={meeting.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            <ExternalLink size={14} />
                            Join Meeting
                          </a>
                        )}
                        {(isEnded || meetingHasEnded) && (
                          <p className="mt-2 text-xs text-slate-500 italic">
                            Meeting link expired (ended 10 minutes after scheduled time)
                          </p>
                        )}
                      </div>
                      {isPending && !isOrganizer && (
                        <button
                          onClick={() => handleAcceptMeeting(meeting.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 flex items-center gap-1"
                        >
                          <CheckCircle size={14} />
                          Accept
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              <Loader2 className="animate-spin mr-2" />
              Loading messages...
            </div>
          ) : messages.length === 0 && meetings.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
              <span>No messages yet</span>
              <span>Start the conversation!</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 max-w-[80%] shadow-sm ${
                      isOwn
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white text-slate-700 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line break-words">{msg.text}</p>
                    <div
                      className={`text-[10px] mt-1 ${
                        isOwn ? "text-indigo-100" : "text-slate-400"
                      }`}
                    >
                      {msg.senderName}
                      {" • "}
                      {new Date(msg.createdAt).toLocaleString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t bg-white p-4 space-y-2">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Write a message... (press Enter to send, Shift+Enter for new line)"
            className="w-full border rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex items-center justify-end">
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="px-4 py-2 rounded-2xl bg-indigo-600 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send
            </button>
          </div>
        </div>

        {/* Meeting Modal */}
        {showMeetingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMeetingModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Schedule Meeting</h3>
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Meeting Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Select a date and time for the meeting
                  </p>
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMeetingModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMeeting}
                    disabled={!meetingTime || creatingMeeting}
                    className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {creatingMeeting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Calendar size={16} />
                        Schedule Meeting
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDrawer;

