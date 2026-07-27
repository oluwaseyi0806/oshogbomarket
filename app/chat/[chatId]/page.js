"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState(null);
  const [chatInfo, setChatInfo] = useState(null);
  const [existingRating, setExistingRating] = useState(null);
  const [selectedStars, setSelectedStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
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

      if (userData?.user) {
        const { data: ratingData } = await supabase.from("ratings").select("*").eq("chat_id", chatId).eq("rater_id", userData.user.id).maybeSingle();
        if (isMounted) setExistingRating(ratingData);
      }

      const { data } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
      if (!isMounted) return;
      setMessages(data || []);

      await supabase.from("messages").update({ read: true }).eq("chat_id", chatId).eq("read", false).neq("sender_id", userData.user.id);

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

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !chatInfo) return;

    await supabase.from("messages").insert({ chat_id: chatId, sender_id: userId, text: text.trim() });

    const recipientId = chatInfo.buyer_id === userId ? chatInfo.seller_id : chatInfo.buyer_id;
    const { data: recipient } = await supabase.from("users").select("onesignal_player_id, email").eq("id", recipientId).single();
    const { data: listingData } = await supabase.from("listings").select("title").eq("id", chatInfo.listing_id).single();

    if (recipient?.onesignal_player_id) {
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: recipient.onesignal_player_id,
          title: "New message on OshogboMarket",
          message: text.trim(),
        }),
      });
    }

    if (recipient?.email) {
      fetch("/api/notify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: recipient.email,
          listingTitle: listingData?.title || "a listing",
          messageText: text.trim(),
          chatUrl: window.location.origin + "/chat/" + chatId,
        }),
      });
    }

    setText("");
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

  const otherPersonLabel = chatInfo && userId === chatInfo.buyer_id ? "the seller" : "the buyer";

  return (
    <div className="max-w-lg mx-auto flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-white rounded-lg border border-indigo-950/10 h-[60vh]">
        {messages.map(function (m) {
          return (
            <div key={m.id} className={"max-w-[75%] px-3 py-2 rounded-lg text-sm " + (m.sender_id === userId ? "bg-indigo-950 text-parchment ml-auto" : "bg-indigo-950/5 text-indigo-950")}>
              {m.text}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2 mt-3">
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
                  <button key={n} onClick={() => setSelectedStars(n)} className={"text-2xl " + (n <= selectedStars ? "opacity-100" : "opacity-30")}>
                    *
                  </button>
                );
              })}
            </div>
            <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Optional comment" rows={2} className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm mb-2" />
            <button onClick={submitRating} disabled={!selectedStars} className="bg-indigo-950 text-parchment font-semibold rounded px-4 py-2 text-sm disabled:opacity-50">
              Submit rating
            </button>
          </div>
        )}
      </div>
    </div>
  );
}