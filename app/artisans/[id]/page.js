"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { isOnline } from "../../../lib/presence";

export default function ArtisanProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [artisan, setArtisan] = useState(null);
  const [rating, setRating] = useState(null);
  const [preferredDate, setPreferredDate] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    const { data } = await supabase.from("users").select("*").eq("id", id).single();
    setArtisan(data);
    const { data: ratingsData } = await supabase.from("ratings").select("stars").eq("rated_user_id", id);
    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce(function (sum, r) { return sum + r.stars; }, 0) / ratingsData.length;
      setRating({ avg: avg, count: ratingsData.length });
    }
  }

  async function handleBooking(e) {
    e.preventDefault();
    setBooking(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      router.push("/auth");
      return;
    }

    const { data: newChat, error: chatError } = await supabase
      .from("chats")
      .insert({ listing_id: null, buyer_id: userData.user.id, seller_id: id })
      .select()
      .single();

    if (chatError) {
      setBooking(false);
      return;
    }

    await supabase.from("bookings").insert({
      artisan_id: id,
      customer_id: userData.user.id,
      chat_id: newChat.id,
      service_type: artisan.artisan_skill,
      preferred_date: preferredDate || null,
      address: address,
      notes: notes,
    });

    const messageText = "Job opportunity: " + artisan.artisan_skill + (preferredDate ? " on " + preferredDate : "") + (address ? " at " + address : "") + (notes ? ". Notes: " + notes : "");

    await supabase.from("messages").insert({
      chat_id: newChat.id,
      sender_id: userData.user.id,
      text: messageText,
    });

    await supabase.from("notifications").insert({
      user_id: id,
      type: "job",
      message: "New job opportunity: " + artisan.artisan_skill,
      link: "/chat/" + newChat.id,
    });

    if (artisan.onesignal_player_id) {
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: artisan.onesignal_player_id,
          title: "New job opportunity on OshogboMarket",
          message: messageText,
        }),
      });
    }

    if (artisan.email) {
      fetch("/api/notify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: artisan.email,
          listingTitle: "a job opportunity",
          messageText: messageText,
          chatUrl: window.location.origin + "/chat/" + newChat.id,
        }),
      });
    }

    setBooking(false);
    router.push("/chat/" + newChat.id);
  }

  if (!artisan) return <p className="text-sm text-indigo-950/50">Loading...</p>;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-16 h-16 rounded-full bg-indigo-950/10 overflow-hidden flex items-center justify-center font-bold text-2xl text-indigo-950 shrink-0">
          {artisan.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artisan.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            artisan.name ? artisan.name.charAt(0).toUpperCase() : "?"
          )}
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-indigo-950">{artisan.name}</h1>
          <p className="text-sm text-indigo-950/60">{artisan.artisan_skill} - {artisan.years_experience || 0} years experience</p>
          <p className="text-xs text-indigo-950/50">Location: {artisan.service_area || "Osogbo"}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={"w-2 h-2 rounded-full " + (isOnline(artisan.last_seen) ? "bg-green-500" : "bg-indigo-950/20")} />
            <span className="text-xs text-indigo-950/50">{isOnline(artisan.last_seen) ? "Online" : "Offline"}</span>
          </div>
          {rating && <p className="text-xs text-indigo-950/50">{rating.avg.toFixed(1)} stars ({rating.count} reviews)</p>}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {artisan.phone_number && (
          <a href={"tel:" + artisan.phone_number} className="flex-1 bg-indigo-950 text-parchment font-semibold rounded px-4 py-2 text-center text-sm">Call</a>
        )}
        {artisan.whatsapp_number && (
          <a href={"https://wa.me/" + artisan.whatsapp_number} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-600 text-white font-semibold rounded px-4 py-2 text-center text-sm">WhatsApp</a>
        )}
      </div>

      {artisan.bio && <p className="text-sm text-indigo-950/70 mb-4">{artisan.bio}</p>}

      {artisan.work_video_url && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-indigo-950/60 mb-1">Video of their work</p>
          <video controls className="w-full rounded-lg bg-black" src={artisan.work_video_url} />
        </div>
      )}

      {artisan.work_photos && artisan.work_photos.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-indigo-950/60 mb-1">Photos of their work</p>
          <div className="grid grid-cols-3 gap-2">
            {artisan.work_photos.map(function (url, i) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded" />
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleBooking} className="space-y-3 bg-white border border-indigo-950/10 rounded-lg p-4">
        <h2 className="font-display font-bold text-indigo-950">Request a booking</h2>
        <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        <input type="text" placeholder="Address/location in Osogbo" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        <textarea placeholder="Describe the job you need done" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        <button type="submit" disabled={booking} className="w-full bg-indigo-950 text-parchment font-semibold rounded px-3 py-2 disabled:opacity-50">
          {booking ? "Sending request..." : "Send booking request"}
        </button>
      </form>
    </div>
  );
}