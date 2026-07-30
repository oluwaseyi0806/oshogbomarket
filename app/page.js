"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { OSOGBO_AREAS, CATEGORIES, CATEGORY_ICONS, ARTISAN_SKILLS } from "../lib/osogboAreas";
import ListingCard from "../components/ListingCard";
import AutocompleteInput from "../components/AutocompleteInput";
import LiveListingsMarquee from "../components/LiveListingsMarquee";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [recentlySold, setRecentlySold] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [artisanSearchTerm, setArtisanSearchTerm] = useState("");
  const [artisanLocation, setArtisanLocation] = useState("");

  useEffect(() => {
    fetchListings();
  }, [areaFilter, categoryFilter, typeFilter, searchTerm]);

  useEffect(() => {
    fetchRecentlySold();
    fetchCategoryCounts();
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

  async function fetchCategoryCounts() {
    const { count: total } = await supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active");
    setTotalCount(total || 0);
    const counts = {};
    for (const c of CATEGORIES) {
      const { count } = await supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active").eq("category", c);
      counts[c] = count || 0;
    }
    setCategoryCounts(counts);
  }

  function handleArtisanSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (artisanSearchTerm) params.set("q", artisanSearchTerm);
    if (artisanLocation) params.set("area", artisanLocation);
    router.push("/artisans?" + params.toString());
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-indigo-950">What is happening in Osogbo today</h1>
        <p className="text-indigo-950/60 text-sm mt-1">Browse what people are selling, or what they are looking to buy.</p>
      </div>

      <LiveListingsMarquee listings={listings} />

      <div className="bg-indigo-950 rounded-lg p-4 mb-6 text-parchment">
        <div className="flex items-center gap-2 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-512.png" alt="" className="w-8 h-8 rounded-lg" />
          <h2 className="font-display font-bold text-lg uppercase tracking-wide">Need Help With A Job?</h2>
        </div>
        <p className="text-sm text-parchment/70 mb-3">Find trusted plumbers, electricians, tailors, and more in Osogbo - or register your own skill so people can find you.</p>
        <form onSubmit={handleArtisanSearch} className="space-y-2 mb-2">
          <AutocompleteInput
            value={artisanSearchTerm}
            onChange={setArtisanSearchTerm}
            options={ARTISAN_SKILLS}
            placeholder="What service do you need? e.g. plumber"
            className="w-full border border-white/30 bg-white text-indigo-950 placeholder-indigo-950/40 rounded px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <AutocompleteInput
                value={artisanLocation}
                onChange={setArtisanLocation}
                options={OSOGBO_AREAS}
                placeholder="Location in Osogbo (optional)"
                className="w-full border border-white/30 bg-white text-indigo-950 placeholder-indigo-950/40 rounded px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" className="bg-gold-500 text-indigo-950 font-semibold rounded px-4 py-2 text-sm shrink-0">Search</button>
          </div>
        </form>
        <Link href="/profile?register=artisan" className="text-xs underline text-gold-400 uppercase font-bold tracking-wide">Register As An Artisan / Skilled Worker</Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        <button
          onClick={() => setCategoryFilter("")}
          className={"flex flex-col items-center gap-1 min-w-[64px] relative " + (categoryFilter === "" ? "opacity-100" : "opacity-60")}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-950 flex items-center justify-center text-xl">All</div>
          {totalCount > 0 && (
            <span className="absolute -top-1 right-1 bg-gold-500 text-indigo-950 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          )}
          <span className="text-xs text-indigo-950/70">All</span>
        </button>

        {CATEGORIES.map(function (c) {
          const count = categoryCounts[c] || 0;
          return (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={"flex flex-col items-center gap-1 min-w-[64px] relative " + (categoryFilter === c ? "opacity-100" : "opacity-60")}
            >
              <div className="w-12 h-12 rounded-full bg-white border border-indigo-950/10 flex items-center justify-center text-2xl">
                {CATEGORY_ICONS[c]}
              </div>
              {count > 0 && (
                <span className="absolute -top-1 right-1 bg-gold-500 text-indigo-950 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {count > 99 ? "99+" : count}
                </span>
              )}
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
        <div className="w-48">
          <AutocompleteInput
            value={areaFilter}
            onChange={setAreaFilter}
            options={OSOGBO_AREAS}
            placeholder="Search location..."
            className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm bg-white"
          />
        </div>
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