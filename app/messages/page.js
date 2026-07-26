"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function MessagesPage() {
  const router = useRouter();
  const [asSeller, setAsSeller] = useState([]);
  const [asBuyer, setAsBuyer] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      router.push("/auth");
      return;
    }
    const userId = userData.user.id;

    const { data: sellerChats } = await supabase
      .from("chats")
      .select("*, listings(title, images), buyer:buyer_id(name)")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    const { data: buyerChats } = await supabase
      .from("chats")
      .select("*, listings(title, images), seller:seller_id(name)")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });

    setAsSeller(sellerChats || []);
    setAsBuyer(buyerChats || []);
    setLoading(false);
  }

  if (loading) return <p className="text-sm text-indigo-950/50">Loading...</p>;

  function groupByListing(chats) {
    const groups = {};
    chats.forEach(function (chat) {
      const key = chat.listing_id;
      if (!groups[key]) groups[key] = { listing: chat.listings, chats: [] };
      groups[key].chats.push(chat);
    });
    return Object.values(groups);
  }

  const sellerGroups = groupByListing(asSeller);

  return (
    <div className="max-w-lg mx-auto space-y-10">
      <div>
        <h1 className="font-display font-bold text-xl text-indigo-950 mb-3">Messages about your listings</h1>
        {sellerGroups.length === 0 ? (
          <p className="text-sm text-indigo-950/50">No one has messaged you about your listings yet.</p>
        ) : (
          <div className="space-y-4">
            {sellerGroups.map(function (group, i) {
              return (
                <div key={i} className="bg-white border border-indigo-950/10 rounded-lg p-3">
                  <p className="font-semibold text-sm text-indigo-950 mb-2">{group.listing?.title || "Listing"}</p>
                  <div className="space-y-1">
                    {group.chats.map(function (chat) {
                      return (
                        <Link key={chat.id} href={"/chat/" + chat.id} className="flex items-center justify-between text-sm text-indigo-950/70 hover:text-indigo-950 py-1">
                          <span>{chat.buyer?.name || "Buyer"}</span>
                          <span className="text-xs underline">Open chat</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display font-bold text-xl text-indigo-950 mb-3">Your conversations as a buyer</h2>
        {asBuyer.length === 0 ? (
          <p className="text-sm text-indigo-950/50">You have not messaged any sellers yet.</p>
        ) : (
          <div className="space-y-2">
            {asBuyer.map(function (chat) {
              return (
                <Link key={chat.id} href={"/chat/" + chat.id} className="flex items-center gap-3 bg-white border border-indigo-950/10 rounded-lg p-3 hover:shadow-md">
                  <div className="w-12 h-12 bg-indigo-950/5 rounded overflow-hidden shrink-0">
                    {chat.listings?.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={chat.listings.images[0]} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-950">{chat.listings?.title || "Listing"}</p>
                    <p className="text-xs text-indigo-950/50">Seller: {chat.seller?.name || "Seller"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}