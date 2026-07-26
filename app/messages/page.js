"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function MessagesPage() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
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

    const { data } = await supabase
      .from("chats")
      .select("*, listings(title, images)")
      .or("buyer_id.eq." + userId + ",seller_id.eq." + userId)
      .order("created_at", { ascending: false });

    setChats(data || []);
    setLoading(false);
  }

  if (loading) return <p className="text-sm text-indigo-950/50">Loading...</p>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display font-bold text-xl text-indigo-950 mb-4">Messages</h1>
      {chats.length === 0 ? (
        <p className="text-sm text-indigo-950/50">No conversations yet.</p>
      ) : (
        <div className="space-y-2">
          {chats.map(function (chat) {
            return (
              <Link
                key={chat.id}
                href={"/chat/" + chat.id}
                className="flex items-center gap-3 bg-white border border-indigo-950/10 rounded-lg p-3 hover:shadow-md"
              >
                <div className="w-12 h-12 bg-indigo-950/5 rounded overflow-hidden shrink-0">
                  {chat.listings?.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={chat.listings.images[0]} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="text-sm font-semibold text-indigo-950">{chat.listings?.title || "Listing"}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}