"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const ADMIN_USER_ID = "d8decf17-2756-47dc-8b35-9a9f229a754f";

export default function AdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user || userData.user.id !== ADMIN_USER_ID) {
      router.push("/");
      return;
    }
    setAllowed(true);
    loadData();
  }

  async function loadData() {
    const { data: listingsData } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
    setListings(listingsData || []);
    const { data: usersData } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    setUsers(usersData || []);
    const { data: reportsData } = await supabase.from("reports").select("*, listings(title)").order("created_at", { ascending: false });
    setReports(reportsData || []);
  }

  async function deleteListing(id) {
    if (!confirm("Delete this listing permanently?")) return;
    await supabase.from("listings").delete().eq("id", id);
    loadData();
  }

  async function toggleBan(userId, currentlyBanned) {
    await supabase.from("users").update({ is_banned: !currentlyBanned }).eq("id", userId);
    loadData();
  }

  if (!allowed) return <p className="text-sm text-indigo-950/50">Checking access...</p>;

  return (
    <div className="space-y-10">
      <h1 className="font-display font-bold text-2xl text-indigo-950">Admin panel</h1>

      <section>
        <h2 className="font-display font-bold text-lg mb-2">Reports ({reports.length})</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-indigo-950/50">No reports.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="bg-white border border-indigo-950/10 rounded p-3 text-sm">
                <p className="font-semibold">{r.listings?.title || "Listing deleted"}</p>
                <p className="text-indigo-950/70">Reason: {r.reason}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display font-bold text-lg mb-2">All listings ({listings.length})</h2>
        <div className="space-y-2">
          {listings.map((l) => (
            <div key={l.id} className="flex items-center justify-between bg-white border border-indigo-950/10 rounded p-3 text-sm">
              <span>{l.title} - {l.status}</span>
              <button onClick={() => deleteListing(l.id)} className="text-red-600 underline text-xs">Delete</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display font-bold text-lg mb-2">All users ({users.length})</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between bg-white border border-indigo-950/10 rounded p-3 text-sm">
              <span>{u.name} {u.is_banned && "(banned)"}</span>
              <button onClick={() => toggleBan(u.id, u.is_banned)} className="text-xs underline">{u.is_banned ? "Unban" : "Ban"}</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}