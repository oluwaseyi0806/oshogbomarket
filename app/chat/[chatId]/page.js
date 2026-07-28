"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { isOnline } from "../../../lib/presence";

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState(null);
  const [chatInfo, setChatInfo] = useState(null);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [existingRating, setExistingRating] = useState(null);
  const [selectedStars, setSelectedStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    let channel;
    let isMounted = true;

    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUserId(userData?.user?.id);

      const { data: chatData } = await supabase.from("chats").select("*").eq("id", chatId).single();
      if (!isMounted) return;
      setChatInfo(chatData);

      if (chatData) {
      const { data: buyerData } = await supabase.from("users").select("name, avatar_url, last_seen, is_artisan").eq("id", chatData.buyer_id).single();
        const { data: sellerData } = await supabase.from("users").select("name, avatar_url, last_seen, is_artisan").eq("id", chatData.seller_id).single();
        setBuyerProfile(buyerData);
        setSellerProfile(sellerData);
      }

      if (userData?.user) {
        const { data: ratingData } = await supabase.from("ratings").select("*").eq("chat_id", chatId).eq("rater_id", userData.user.id).maybeSingle();
        if (isMounted) setExistingRating(ratingData);
      }

      const { data } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
      if (!isMounted) return;
      setMessages(data || []);

      if (userData?.user) {
        await supabase.from("messages").update({ read: true }).eq("chat_id", chatId).eq("read", false).neq("sender_id", userData.user.id);
      }

      channel = supabase
        .channel("chat-" + chatId)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "chat_id=eq." + chatId }, function (payload) {
          setMessages(function (prev) { return prev.concat([payload.new]); });
        })
        .subscribe();
    }

    init();

    return function () {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function profileFor(senderId) {
    if (!chatInfo) return null;
    return senderId === chatInfo.buyer_id ? buyerProfile : sellerProfile;
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !chatInfo) return;

    await supabase.from("messages").insert({ chat_id: chatId, sender_id: userId, text: text.trim() });

    const recipientId = chatInfo.buyer_id === userId ? chatInfo.seller_id : chatInfo.buyer_id;

  const isJobChat = !chatInfo.listing_id;
    await supabase.from("notifications").insert({
      user_id: recipientId,
      type: isJobChat ? "job" : "message",
      message: isJobChat ? "New message about a job opportunity" : "New message on OshogboMarket",
      link: "/chat/" + chatId,
    });

    const { data: recipient } = await supabase.from("users").select("onesignal_player_id, email").eq("id", recipientId).single();
    const { data: listingData } = chatInfo.listing_id
      ? await supabase.from("listings").select("title").eq("id", chatInfo.listing_id).single()
      : { data: null };

    if (recipient?.onesignal_player_id) {
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: recipient.onesignal_player_id, title: "New message on OshogboMarket", message: text.trim() }),
      });
    }

    if (recipient?.email) {
      fetch("/api/notify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: recipient.email,
        listingTitle: listingData?.title || "a job opportunity",
          messageText: text.trim(),
          chatUrl: window.location.origin + "/chat/" + chatId,
        }),
      });
    }

    setText("");
  }

  async function getSuggestions() {
    const lastOther = messages.slice().reverse().find(function (m) { return m.sender_id !== userId; });
    if (!lastOther) return;
    try {
      const response = await fetch("/api/ai/chat-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastMessage: lastOther.text }),
      });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setSuggestions([]);
    }
  }

  async function submitRating() {
    if (!selectedStars || !chatInfo) return;
    const ratedUserId = chatInfo.buyer_id === userId ? chatInfo.seller_id : chatInfo.buyer_id;
    const { error } = await supabase.from("ratings").insert({
      chat_id: chatId,
      rater_id: userId,
      rated_user_id: ratedUserId,
      stars: selectedStars,
      comment: ratingComment.trim() || null,
    });
    if (!error) {
      setExistingRating({ stars: selectedStars, comment: ratingComment });
    }
  }

  async function blockThisUser() {
    if (!chatInfo || !userId) return;
    const otherUserId = chatInfo.buyer_id === userId ? chatInfo.seller_id : chatInfo.buyer_id;
    if (!confirm("Block this user? You will no longer see messages from them.")) return;
    await supabase.from("blocks").insert({ blocker_id: userId, blocked_id: otherUserId });
    alert("User blocked.");
  }

  const otherPersonLabel = chatInfo && userId === chatInfo.buyer_id ? "the seller" : "the buyer";
  const otherProfile = chatInfo ? (userId === chatInfo.buyer_id ? sellerProfile : buyerProfile) : null;
  const otherUserId = chatInfo ? (userId === chatInfo.buyer_id ? chatInfo.seller_id : chatInfo.buyer_id) : null;
  const otherProfileLink = otherProfile?.is_artisan ? "/artisans/" + otherUserId : "/seller/" + otherUserId;

  return (
    <div className="max-w-lg mx-auto flex flex-col">
    {otherProfile && (
        <a href={otherProfileLink} className="flex items-center gap-2 mb-2 text-sm text-indigo-950 hover:underline">
          <span className={"w-2 h-2 rounded-full " + (isOnline(otherProfile.last_seen) ? "bg-green-500" : "bg-indigo-950/20")} />
          {otherProfile.name} - {isOnline(otherProfile.last_seen) ? "Online" : "Offline"} - View profile
        </a>
      )}
      <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-white rounded-lg border border-indigo-950/10 h-[60vh]">
        {messages.map(function (m) {
          const isMine = m.sender_id === userId;
          const profile = profileFor(m.sender_id);
          return (
            <div key={m.id} className={"flex items-end gap-2 " + (isMine ? "flex-row-reverse" : "flex-row")}>
              <div className="w-7 h-7 rounded-full bg-indigo-950/10 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-indigo-950">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile?.name ? profile.name.charAt(0).toUpperCase() : "?"
                )}
              </div>
              <div className={"max-w-[70%] px-3 py-2 rounded-lg text-sm " + (isMine ? "bg-indigo-950 text-parchment" : "bg-indigo-950/5 text-indigo-950")}>
                {!isMine && <p className="text-xs font-semibold text-indigo-950/60 mb-0.5">{profile?.name || "User"}</p>}
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <button onClick={getSuggestions} type="button" className="text-xs text-indigo-950/60 underline mt-2 self-start">
        AI: Suggest replies
      </button>
      {suggestions.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-1">
          {suggestions.map(function (s, i) {
            return (
              <button key={i} type="button" onClick={() => setText(s)} className="text-xs bg-indigo-950/5 text-indigo-950 rounded-full px-3 py-1">
                {s}
              </button>
            );
          })}
        </div>
      )}

      <form onSubmit={sendMessage} className="flex gap-2 mt-2">
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1 border border-indigo-950/20 rounded px-3 py-2" />
        <button type="submit" className="bg-gold-500 text-indigo-950 font-semibold rounded px-4 py-2">Send</button>
      </form>

      <div className="mt-6 border-t border-indigo-950/10 pt-4">
        {existingRating ? (
          <p className="text-sm text-indigo-950/70">You rated {otherPersonLabel} {existingRating.stars} out of 5 stars. Thank you.</p>
        ) : (
          <div>
            <p className="text-sm font-semibold text-indigo-950 mb-2">Rate {otherPersonLabel} for this transaction</p>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(function (n) {
                return (
                  <button key={n} onClick={() => setSelectedStars(n)} className={"text-2xl " + (n <= selectedStars ? "opacity-100" : "opacity-30")}>*</button>
                );
              })}
            </div>
            <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Optional comment" rows={2} className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm mb-2" />
            <button onClick={submitRating} disabled={!selectedStars} className="bg-indigo-950 text-parchment font-semibold rounded px-4 py-2 text-sm disabled:opacity-50">Submit rating</button>
          </div>
        )}
      </div>

      <button onClick={blockThisUser} className="mt-3 text-xs text-red-600 underline self-start">Block this user</button>
    </div>
  );
}