import { useState, useEffect, useRef } from "react";
import {
  Send,
  Image as ImageIcon,
  MessageSquare,
  Users,
  User,
  Search,
  ArrowLeft,
  X,
  Loader2,
  UserPlus,
  Plus,
  CheckCheck,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Wifi,
  WifiOff,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  getChatRooms,
  getRoomMessages,
  sendMessage,
  startDirectChat,
  getFamilyMembersForChat,
} from "../api/chatService";

export default function ChatPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("group");
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [wsConnected, setWsConnected] = useState(false);

  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getAuthToken = () => {
    return (
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      user?.access_token ||
      user?.token ||
      ""
    );
  };

  const fetchRooms = async (autoSelect = false) => {
    try {
      const data = await getChatRooms();
      setRooms(data || []);
      if (autoSelect || (!activeRoom && data?.length > 0)) {
        const defaultGroup = data.find((r) => r.room_type === "group") || data[0];
        setActiveRoom((prev) => prev || defaultGroup);
      }
    } catch (err) {
      console.error("Error loading chat rooms:", err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms(true);
  }, []);

  useEffect(() => {
    if (!activeRoom) return;

    let isSubscribed = true;

    getRoomMessages(activeRoom.id)
      .then((data) => {
        if (isSubscribed) setMessages(data || []);
      })
      .catch((err) => console.error("Failed to load message history:", err));

    const token = getAuthToken();

    const connectWebSocket = () => {
      if (!token) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const wsUrl = `${protocol}//${host}:8000/ws/chat/${activeRoom.id}/?token=${encodeURIComponent(
        token
      )}`;

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isSubscribed) setWsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const newMsg = JSON.parse(event.data);
          if (isSubscribed) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            fetchRooms(false);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      socket.onclose = (event) => {
        if (isSubscribed) {
          setWsConnected(false);
          if (event.code !== 1000) {
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
          }
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket.close();
      };
    };

    connectWebSocket();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000);
        wsRef.current = null;
      }
    };
  }, [activeRoom?.id, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOpenNewChatModal = async () => {
    setNewChatModalOpen(true);
    setLoadingMembers(true);
    try {
      const data = await getFamilyMembersForChat();
      setFamilyMembers(data || []);
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSelectMemberForDM = async (memberUserId) => {
    try {
      const targetRoom = await startDirectChat(memberUserId);
      setNewChatModalOpen(false);
      await fetchRooms();
      setActiveTab("direct");
      setActiveRoom(targetRoom);
    } catch (err) {
      console.error("Failed to initiate direct chat:", err);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imageFile) || sending || !activeRoom) return;

    if (imageFile) {
      setSending(true);
      try {
        const newMsg = await sendMessage(activeRoom.id, {
          content: text.trim(),
          image: imageFile,
        });
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setText("");
        clearImage();
        fetchRooms(false);
      } catch (err) {
        console.error("Failed to upload image message:", err);
      } finally {
        setSending(false);
      }
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content: text.trim() }));
      setText("");
    } else {
      setSending(true);
      try {
        const newMsg = await sendMessage(activeRoom.id, { content: text.trim() });
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setText("");
        fetchRooms(false);
      } catch (err) {
        console.error("Failed to send message via HTTP fallback:", err);
      } finally {
        setSending(false);
      }
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesTab = r.room_type === activeTab;
    const matchesSearch = r.display_name?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#eef2f5] flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Chat Viewport */}
      <main className="flex-1 p-0 sm:p-4 md:p-5 flex justify-center items-center">
        <div className="w-full max-w-7xl h-[calc(100vh-4rem)] sm:h-[calc(100vh-6.5rem)] bg-white sm:rounded-2xl shadow-xl overflow-hidden flex relative border border-stone-200/80">
          
          {/* Left Side: WhatsApp Chat List */}
          <div
            className={`w-full md:w-96 lg:w-[410px] border-r border-[#e9edef] flex flex-col shrink-0 bg-white ${
              activeRoom ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-[#f0f2f5] border-b border-[#e9edef] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-sm shadow-xs ring-2 ring-white">
                  {user?.first_name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#111b21] leading-snug">
                    {user?.first_name} {user?.last_name}
                  </h2>
                  <span className="text-[11px] font-medium text-[#00a884] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a884]"></span>
                    Active Now
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[#54656f]">
                <button
                  type="button"
                  onClick={handleOpenNewChatModal}
                  className="p-2 hover:bg-[#e9edef] rounded-full transition-colors cursor-pointer"
                  title="New Direct Chat"
                >
                  <Plus size={20} />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-[#e9edef] rounded-full transition-colors cursor-pointer"
                >
                  <MoreVertical size={19} />
                </button>
              </div>
            </div>

            {/* Group vs Direct Toggle Bar */}
            <div className="p-2 bg-[#f0f2f5] border-b border-[#e9edef]">
              <div className="flex bg-[#e9edef] p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("group");
                    const groupRoom = rooms.find((r) => r.room_type === "group");
                    if (groupRoom) setActiveRoom(groupRoom);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "group"
                      ? "bg-white text-[#111b21] shadow-xs"
                      : "text-[#54656f] hover:text-[#111b21]"
                  }`}
                >
                  <Users size={14} className={activeTab === "group" ? "text-[#00a884]" : ""} />
                  <span>Family Group</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("direct");
                    const directRoom = rooms.find((r) => r.room_type === "direct");
                    if (directRoom) setActiveRoom(directRoom);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "direct"
                      ? "bg-white text-[#111b21] shadow-xs"
                      : "text-[#54656f] hover:text-[#111b21]"
                  }`}
                >
                  <User size={14} className={activeTab === "direct" ? "text-[#00a884]" : ""} />
                  <span>Direct (1:1)</span>
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="p-2.5 bg-white border-b border-[#f0f2f5]">
              <div className="relative flex items-center bg-[#f0f2f5] rounded-xl px-3 py-1.5">
                <Search className="w-4 h-4 text-[#54656f] shrink-0" />
                <input
                  type="text"
                  placeholder={activeTab === "group" ? "Search family chat..." : "Search direct messages..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-3 bg-transparent text-xs text-[#111b21] placeholder-[#8696a0] focus:outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5] bg-white [scrollbar-width:thin]">
              {loadingRooms ? (
                <div className="flex items-center justify-center py-16 text-[#00a884]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="py-16 text-center space-y-3 px-6">
                  <div className="w-12 h-12 rounded-full bg-[#f0f2f5] flex items-center justify-center mx-auto text-[#8696a0]">
                    <MessageSquare size={22} />
                  </div>
                  <p className="text-xs font-medium text-[#54656f]">
                    {activeTab === "group" ? "No group channels found." : "No direct messages yet."}
                  </p>
                  {activeTab === "direct" && (
                    <button
                      type="button"
                      onClick={handleOpenNewChatModal}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#00a884] text-white px-4 py-2 rounded-xl hover:bg-[#008f6f] shadow-xs cursor-pointer transition-colors"
                    >
                      <UserPlus size={14} />
                      <span>Start New Chat</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredRooms.map((room) => {
                  const isSelected = activeRoom?.id === room.id;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setActiveRoom(room)}
                      className={`w-full px-3.5 py-3 flex items-center gap-3.5 text-left transition-colors cursor-pointer border-l-4 ${
                        isSelected
                          ? "bg-[#f0f2f5] border-[#00a884]"
                          : "hover:bg-[#f5f6f6] border-transparent"
                      }`}
                    >
                      {room.room_type === "group" ? (
                        <div className="w-12 h-12 rounded-full bg-[#d9fdd3] text-[#00a884] flex items-center justify-center font-bold text-base shrink-0 border border-[#c1e9bb]">
                          <Users size={22} />
                        </div>
                      ) : room.display_avatar ? (
                        <img
                          src={room.display_avatar}
                          alt={room.display_name}
                          className="w-12 h-12 rounded-full object-cover shrink-0 border border-[#e9edef]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#dfe5e7] text-[#54656f] flex items-center justify-center font-bold text-base shrink-0 border border-stone-300">
                          {room.display_name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#111b21] truncate">
                            {room.display_name}
                          </p>
                          {room.last_message && (
                            <span className="text-[11px] text-[#8696a0] font-medium shrink-0 ml-1">
                              {new Date(room.last_message.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#667781] truncate mt-0.5 font-normal">
                          {room.last_message
                            ? `${room.last_message.sender_name}: ${room.last_message.content}`
                            : "Tap to send a message"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side: WhatsApp Main Message Viewport */}
          <div
            className={`flex-1 flex flex-col relative ${
              !activeRoom ? "hidden md:flex items-center justify-center bg-[#f0f2f5]" : "flex bg-[#efeae2]"
            }`}
          >
            {activeRoom ? (
              <>
                {/* WhatsApp Active Top Bar */}
                <div className="px-4 py-2.5 bg-[#f0f2f5] border-b border-[#e9edef] flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveRoom(null)}
                      className="md:hidden p-1.5 -ml-1.5 rounded-full text-[#54656f] hover:bg-[#e9edef] cursor-pointer"
                    >
                      <ArrowLeft size={20} />
                    </button>

                    {activeRoom.room_type === "group" ? (
                      <div className="w-10 h-10 rounded-full bg-[#d9fdd3] text-[#00a884] flex items-center justify-center font-bold text-sm shrink-0 border border-[#c1e9bb]">
                        <Users size={19} />
                      </div>
                    ) : activeRoom.display_avatar ? (
                      <img
                        src={activeRoom.display_avatar}
                        alt={activeRoom.display_name}
                        className="w-10 h-10 rounded-full object-cover border border-[#e9edef] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#dfe5e7] text-[#54656f] flex items-center justify-center font-bold text-sm shrink-0 border border-stone-300">
                        {activeRoom.display_name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#111b21] truncate">
                        {activeRoom.display_name}
                      </h3>
                      <p className="text-[11px] font-medium text-[#00a884] flex items-center gap-1.5">
                        {wsConnected ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse"></span>
                            online (live)
                          </>
                        ) : (
                          <span className="text-[#8696a0]">connecting...</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[#54656f]">
                    <span title={wsConnected ? "WebSocket Connected" : "Connecting..."}>
                      {wsConnected ? (
                        <Wifi size={17} className="text-[#00a884]" />
                      ) : (
                        <WifiOff size={17} className="text-[#8696a0]" />
                      )}
                    </span>
                    <button type="button" className="p-2 hover:bg-[#e9edef] rounded-full transition-colors cursor-pointer">
                      <Search size={19} />
                    </button>
                    <button type="button" className="p-2 hover:bg-[#e9edef] rounded-full transition-colors cursor-pointer">
                      <MoreVertical size={19} />
                    </button>
                  </div>
                </div>

                {/* Message Chat Feed with Doodle Tint */}
                <div
                  className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 [scrollbar-width:thin]"
                  style={{
                    backgroundColor: "#efeae2",
                    backgroundImage:
                      "radial-gradient(#00000009 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="py-20 text-center space-y-2 max-w-sm mx-auto">
                      <div className="w-14 h-14 bg-white rounded-full shadow-xs flex items-center justify-center mx-auto text-[#00a884]">
                        <MessageSquare size={26} />
                      </div>
                      <p className="text-xs font-semibold text-[#111b21]">End-to-End Encrypted Family Lounge</p>
                      <p className="text-[11px] text-[#667781] leading-relaxed">
                        Messages and photos sent in this conversation stay strictly private to your family workspace.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender?.id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full bg-[#dfe5e7] text-[#54656f] flex items-center justify-center font-bold text-[10px] shrink-0 border border-stone-300 shadow-2xs overflow-hidden">
                              {msg.sender?.avatar ? (
                                <img
                                  src={msg.sender.avatar}
                                  alt={msg.sender.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                msg.sender?.name?.[0]?.toUpperCase() || "U"
                              )}
                            </div>
                          )}

                          {/* WhatsApp Message Bubble */}
                          <div
                            className={`max-w-xs sm:max-w-md rounded-2xl px-3.5 py-2 space-y-1 shadow-2xs ${
                              isMe
                                ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none border border-[#c1e9bb]"
                                : "bg-white text-[#111b21] rounded-tl-none border border-[#e9edef]"
                            }`}
                          >
                            {!isMe && activeRoom.room_type === "group" && (
                              <p className="text-[11px] font-bold text-[#00a884]">
                                {msg.sender?.name}
                              </p>
                            )}

                            {msg.image_url && (
                              <img
                                src={msg.image_url}
                                alt="Attachment"
                                className="rounded-xl max-h-64 w-full object-cover shadow-2xs cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => window.open(msg.image_url, "_blank")}
                              />
                            )}

                            {msg.content && (
                              <p className="text-xs sm:text-[13px] font-normal leading-relaxed whitespace-pre-wrap text-[#111b21]">
                                {msg.content}
                              </p>
                            )}

                            <div className="flex items-center justify-end gap-1 mt-0.5 select-none">
                              <span className="text-[10px] text-[#667781] font-medium">
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isMe && (
                                <CheckCheck size={14} className="text-[#53bdeb] inline ml-0.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Image Preview Thumbnail */}
                {imagePreview && (
                  <div className="px-4 py-2 bg-[#f0f2f5] flex items-center gap-3 border-t border-[#e9edef]">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Selected"
                        className="w-14 h-14 rounded-xl object-cover border border-[#d1d7db] shadow-xs"
                      />
                      <button
                        onClick={clearImage}
                        type="button"
                        className="absolute -top-1.5 -right-1.5 bg-[#111b21] text-white rounded-full p-0.5 hover:bg-rose-600 cursor-pointer shadow-xs"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <span className="text-xs text-[#54656f] font-medium">Photo attached</span>
                  </div>
                )}

                {/* WhatsApp Bottom Input Bar */}
                <form
                  onSubmit={handleSend}
                  className="p-2.5 bg-[#f0f2f5] border-t border-[#e9edef] flex items-center gap-2"
                >
                  <button
                    type="button"
                    className="p-2 text-[#54656f] hover:text-[#111b21] hover:bg-[#e9edef] rounded-full transition-colors cursor-pointer"
                    title="Emoji"
                  >
                    <Smile size={22} />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-[#54656f] hover:text-[#111b21] hover:bg-[#e9edef] rounded-full transition-colors cursor-pointer"
                    title="Attach Photo"
                  >
                    <Paperclip size={20} />
                  </button>

                  <input
                    type="text"
                    placeholder="Type a message"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex-1 bg-white border border-[#e9edef] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-normal text-[#111b21] placeholder-[#8696a0] focus:outline-hidden focus:ring-1 focus:ring-[#00a884]"
                  />

                  {text.trim() || imageFile ? (
                    <button
                      type="submit"
                      disabled={sending}
                      className="p-2.5 bg-[#00a884] text-white rounded-full hover:bg-[#008f6f] disabled:opacity-50 transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="p-2.5 text-[#54656f] hover:bg-[#e9edef] rounded-full transition-colors cursor-pointer shrink-0"
                    >
                      <Mic size={20} />
                    </button>
                  )}
                </form>
              </>
            ) : (
              <div className="text-center space-y-3 px-6">
                <div className="w-20 h-20 bg-[#d9fdd3] text-[#00a884] rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <MessageSquare size={36} />
                </div>
                <h2 className="text-xl font-bold text-[#111b21]">FamilyHub WhatsApp Lounge</h2>
                <p className="text-xs text-[#667781] max-w-sm mx-auto">
                  Send and receive messages in real time without refreshing. Select any member on the left to start chatting.
                </p>
              </div>
            )}
          </div>

          {/* Modal: WhatsApp Contact Selector */}
          {newChatModalOpen && (
            <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
              <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus size={18} className="text-[#00a884]" />
                    <h3 className="text-sm font-bold text-[#111b21]">New Direct Chat</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewChatModalOpen(false)}
                    className="text-[#8696a0] hover:text-[#111b21] p-1 rounded-lg cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-stone-50 [scrollbar-width:thin]">
                  {loadingMembers ? (
                    <div className="py-10 flex justify-center text-[#00a884]">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : familyMembers.length === 0 ? (
                    <p className="text-center py-8 text-xs text-[#8696a0] font-medium">
                      No other family members found in this workspace.
                    </p>
                  ) : (
                    familyMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleSelectMemberForDM(member.id)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[#f0f2f5] transition-colors text-left cursor-pointer group pt-2"
                      >
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-11 h-11 rounded-full object-cover border border-[#e9edef] shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#d9fdd3] text-[#00a884] flex items-center justify-center font-bold text-sm shrink-0 border border-[#c1e9bb]">
                            {member.name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#111b21] group-hover:text-[#00a884] truncate transition-colors">
                            {member.name}
                          </p>
                          <p className="text-[11px] text-[#8696a0] truncate">
                            {member.email}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}