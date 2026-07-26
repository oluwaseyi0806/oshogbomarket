"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchListing();
  }, [id]);

  async function fetchListing() {
    const { data } = await supabase.from("listings").select("*").eq("id", id).single();
    setListing(data);
    if (data) {
      const { data: sellerData } = await supabase.from("users").select("name, created_at").eq("id", data.user_id).single();
      setSeller(sellerData);
    }
    setLoading(false);
  }

  async function startChat() {
    setStartingChat(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      router.push("/auth");
      return;
    }
    const buyerId = userData.user.id;
    const sellerId = listing.user_id;
    const { data: existing } = await supabase.from("chats").select("id").eq("listing_id", id).eq("buyer_id", buyerId).maybeSingle();
    let chatId = existing?.id;
    if (!chatId) {
      const { data: newChat, error } = await supabase.from("chats").insert({ listing_id: id, buyer_id: buyerId, seller_id: sellerId }).select().single();
      if (error) {
        setStartingChat(false);
        return;
      }
      chatId = newChat.id;
    }
    router.push(`/chat/${chatId}`);
  }

  async function reportListing() {
    const reason = window.prompt("Why are you reporting this listing?");
    if (!reason) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      router.push("/auth");
      return;
    }
    await supabase.from("reports").insert({ listing_id: id, reporter_id: userData.user.id, reason });
    alert("Thanks, we will review this listing.");
  }

  if (loading) return <p className="text-sm text-indigo-950/50">Loading...</p>;
  if (!listing) return <p className="text-sm text-indigo-950/50">Listing not found.</p>;

  const isRequest = listing.type === "buy_request";
  const waMessage = "Hi, I saw your listing " + listing.title + " on OshogboMarket";
  const waLink = "https://wa.me/" + listing.whatsapp_number + "?text=" + encodeURIComponent(waMessage);

  return (
    <div className="max-w-2xl mx-auto">
      {listing.images?.length ? (
        <div className="mb-4">
          <div className="relative aspect-square bg-indigo-950/5 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={listing.images[activeImage]} alt={listing.title} className="w-full h-full object-cover" />
            {listing.images.length > 1 && (
              <>
                <button onClick={() => setActiveImage((i) => (i === 0 ? listing.images.length - 1 : i - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-8 h-8">Prev</button>
                <button onClick={() => setActiveImage((i) => (i === listing.images.length - 1 ? 0 : i + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-8 h-8">Next</button>
              </>
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="flex gap-2 mt-2">
              {listing.images.map((url, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={"w-14 h-14 rounded overflow-hidden border-2 " + (activeImage === i ? "border-gold-500" : "border-transparent")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-indigo-950/5 rounded-lg flex items-center justify-center text-indigo-950/30 mb-4">No photos</div>
      )}

      {isRequest && <span className="inline-block bg-gold-500 text-indigo-950 text-xs font-bold px-2 py-0.5 rounded mb-2">Wanted</span>}
      <h1 className="font-display font-bold text-2xl text-indigo-950">{listing.title}</h1>
      <p className="text-indigo-900 font-semibold text-lg mt-1">
        {isRequest ? "Budget: NGN " + listing.price?.toLocaleString() : "NGN " + listing.price?.toLocaleString()}
      </p>
      <p className="text-sm text-indigo-950/50 mt-1">{listing.location_area} - {listing.category}</p>
      {seller && (
        <p className="text-sm text-indigo-950/50 mt-1">
          Posted by {seller.name} - Member since {new Date(seller.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
        </p>
      )}
      <p className="mt-4 text-indigo-950/80 whitespace-pre-wrap">{listing.description}</p>

      <div className="flex flex-col sm:flex-row gap-2 mt-6">
        <button onClick={startChat} disabled={startingChat} className="bg-indigo-950 text-parchment font-semibold rounded px-6 py-3 disabled:opacity-50">
          {startingChat ? "Opening chat..." : isRequest ? "I have this - chat with buyer" : "Chat with seller"}
        </button>
        {listing.whatsapp_number && (
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white font-semibold rounded px-6 py-3 text-center">Chat on WhatsApp</a>
        )}
      </div>

      <button onClick={reportListing} className="mt-3 text-xs text-red-600 underline">Report this listing</button>
    </div>
  );
}