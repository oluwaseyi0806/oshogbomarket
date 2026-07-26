"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { OSOGBO_AREAS, CATEGORIES, CATEGORY_ICONS } from "../lib/osogboAreas";
import ListingCard from "../components/ListingCard";

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [recentlySold, setRecentlySold] = useState([]);

  useEffect(() => {
    fetchListings();
  }, [areaFilter, categoryFilter, typeFilter, searchTerm]);

  useEffect(() => {
    fetchRecentlySold();
  }, []);

  async function fetchListings() {
    setLoading(true);
    let query = supabase.from("listings").select("*").eq("status", "active").order("created_at", { ascending: false });
    if (areaFilter) query = query.eq("location_area", areaFilter);
    if (categoryFilter) query = query.eq("category", categoryFilter);
    if (typeFilter) query = query.eq("type", typeFilter);
    if (searchTerm) query = query.ilike("title", "%" + searchTerm + "%");
    const { data, error } = await query;
    if (!error) setListings(data);
    setLoading(false);
  }

  async function fetchRecentlySold() {
    const { data } = await supabase.from("listings").select("*").eq("status", "sold").order("updated_at", { ascending: false }).limit(8);
    setRecentlySold(data || []);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-indigo-950">What is happening in Osogbo today</h1>
        <p className="text-indigo-950/60 text-sm mt-1">Browse what people are selling, or what they are looking to buy.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        <button
          onClick={() => setCategoryFilter("")}
          className={"flex flex-col items-center gap-1 min-w-[64px] " + (categoryFilter === "" ? "opacity-100" : "opacity-60")}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-950 flex items-center justify-center text-xl">All</div>
          <span className="text-xs text-indigo-950/70">All</span>
        </button>
        {CATEGORIES.map(function (c) {
          return (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={"flex flex-col items-center gap-1 min-w-[64px] " + (categoryFilter === c ? "opacity-100" : "opacity-60")}
            >
              <div className="w-12 h-12 rounded-full bg-white border border-indigo-950/10 flex items-center justify-center text-2xl">
                {CATEGORY_ICONS[c]}
              </div>
              <span className="text-xs text-indigo-950/70 text-center leading-tight">{c}</span>
            </button>
          );
        })}
      </div>

      <input
        type="text"
        placeholder="Search listings..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border border-indigo-950/20 rounded px-3 py-2 mb-3"
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-indigo-950/20 rounded px-3 py-2 text-sm bg-white">
          <option value="">All listings</option>
          <option value="sell">For sale</option>
          <option value="buy_request">Wanted</option>
        </select>
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="border border-indigo-950/20 rounded px-3 py-2 text-sm bg-white">
          <option value="">All Osogbo areas</option>
          {OSOGBO_AREAS.map(function (a) { return (<option key={a} value={a}>{a}</option>); })}
        </select>
      </div>

      {loading ? (
        <p className="text-indigo-950/50 text-sm">Loading listings...</p>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-indigo-950/20 rounded-lg">
          <p className="font-display font-bold text-indigo-950">Nothing here yet</p>
          <p className="text-indigo-950/60 text-sm mt-1">Be the first to post something for sale or something you want to buy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {listings.map(function (listing) { return (<ListingCard key={listing.id} listing={listing} />); })}
        </div>
      )}

      {recentlySold.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display font-bold text-lg text-indigo-950 mb-3">Recently sold</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 opacity-70">
            {recentlySold.map(function (listing) { return (<ListingCard key={listing.id} listing={listing} />); })}
          </div>
        </div>
      )}
    </div>
  );
}