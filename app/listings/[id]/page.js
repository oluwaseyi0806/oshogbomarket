"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import ListingCard from "../../../components/ListingCard";

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(function (result) {
      setCurrentUserId(result.data?.user?.id || null);
    });
    fetchListing();
  }, [id]);

  async function fetchListing() {
    const { data } = await supabase.from("listings").select("*").eq("id", id).single();
    setListing(data);
    if (data) {
      const { data: sellerData } = await supabase.from("users").select("name, created_at").eq("id", data.user_id).single();
      setSeller(sellerData);

      supabase.from("listings").update({ views: (data.views || 0) + 1 }).eq("id", id).then(function () {});

      const { data: similarData } = await supabase
        .from("listings")
        .select("*")
        .eq("category", data.category)
        .eq("status", "active")
        .neq("id", id)
        .limit(4);
      setSimilar(similarData || []);
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

    router.push("/chat/" + chatId);
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

  function shareOnWhatsApp() {
    const shareText = "Check this out on OshogboMarket: " + listing.title + " - " + window.location.href;
    window.open("https://wa.me/?text=" + encodeURIComponent(shareText), "_blank");
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(function () { setShareCopied(false); }, 2000);
  }

  if (loading) return <p className="text-sm text-indigo-950/50">Loading...</p>;
  if (!listing) return <p className="text-sm text-indigo-950/50">Listing not found.</p>;

  const isRequest = listing.type === "buy_request";
  const isOwner = currentUserId && listing.user_id === currentUserId;
  const waMessage = "Hi, I saw your listing " + listing.title + " on OshogboMarket";
  const waLink = "https://wa.me/" + listing.whatsapp_number + "?text=" + encodeURIComponent(waMessage);

  return (
    <div className="max-w-2xl mx-auto">
      {listing.video_url && (
        <div className="mb-4">
          <video controls className="w-full rounded-lg bg-black" src={listing.video_url} />
        </div>
      )}
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
              {listing.images.map(function (url, i) {
                return (
                  <button key={i} onClick={() => setActiveImage(i)} className={"w-14 h-14 rounded overflow-hidden border-2 " + (activeImage === i ? "border-gold-500" : "border-transparent")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-indigo-950/5 rounded-lg flex items-center justify-center text-indigo-950/30 mb-4">No photos</div>
      )}

      <div className="flex flex-wrap gap-2 mb-2">
        {isRequest && <span className="inline-block bg-gold-500 text-indigo-950 text-xs font-bold px-2 py-0.5 rounded">Wanted</span>}
        {!isRequest && listing.condition && <span className="inline-block bg-indigo-950/10 text-indigo-950 text-xs font-semibold px-2 py-0.5 rounded">{listing.condition}</span>}
        {!isRequest && listing.negotiable && <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">Negotiable</span>}
      </div>

      <h1 className="font-display font-bold text-2xl text-indigo-950">{listing.title}</h1>
      <p className="text-indigo-900 font-semibold text-lg mt-1">
        {isRequest ? "Budget: NGN " + listing.price?.toLocaleString() : "NGN " + listing.price?.toLocaleString()}
      </p>
      <p className="text-sm text-indigo-950/50 mt-1">
        {listing.location_area} - {listing.category} - {listing.views || 0} view{listing.views === 1 ? "" : "s"}
      </p>
      {seller && (
        <p className="text-sm text-indigo-950/50 mt-1">
          Posted by <a href={"/seller/" + listing.user_id} className="underline text-indigo-900">{seller.name}</a> - Member since {new Date(seller.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
        </p>
      )}
      <p className="mt-4 text-indigo-950/80 whitespace-pre-wrap">{listing.description}</p>

      <div className="flex flex-col sm:flex-row gap-2 mt-6">
        {isOwner ? (
          <a href={"/listings/" + id + "/edit"} className="bg-indigo-950 text-parchment font-semibold rounded px-6 py-3 text-center">
            Edit this listing
          </a>
        ) : (
          <>
            <button onClick={startChat} disabled={startingChat} className="bg-indigo-950 text-parchment font-semibold rounded px-6 py-3 disabled:opacity-50">
              {startingChat ? "Opening chat..." : isRequest ? "I have this - chat with buyer" : "Chat with seller"}
            </button>
            {listing.whatsapp_number && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white font-semibold rounded px-6 py-3 text-center">Chat on WhatsApp</a>
            )}
          </>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={shareOnWhatsApp} className="text-xs text-indigo-950/70 underline">Share on WhatsApp</button>
        <button onClick={copyLink} className="text-xs text-indigo-950/70 underline">{shareCopied ? "Link copied" : "Copy link"}</button>
        <button onClick={reportListing} className="text-xs text-red-600 underline">Report this listing</button>
      </div>

      {similar.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display font-bold text-lg text-indigo-950 mb-3">Similar listings</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {similar.map(function (item) {
              return <ListingCard key={item.id} listing={item} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}