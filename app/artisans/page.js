"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { ARTISAN_SKILLS, OSOGBO_AREAS } from "../../lib/osogboAreas";

function ArtisansContent() {
  const searchParams = useSearchParams();
  const [artisans, setArtisans] = useState([]);
  const [skillFilter, setSkillFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
const [locationSearch, setLocationSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    const area = searchParams.get("area");
  if (q) setSearchTerm(q);
    if (area) setLocationSearch(area);
    if (!q && !area) setShowFilters(true);
  }, [searchParams]);

  useEffect(() => {
    load();
  }, [skillFilter, searchTerm, locationSearch]);

  async function load() {
    setLoading(true);
    let query = supabase.from("users").select("*").eq("is_artisan", true);
    if (skillFilter) query = query.eq("artisan_skill", skillFilter);
    if (searchTerm) {
      query = query.or("artisan_skill.ilike.%" + searchTerm + "%,name.ilike.%" + searchTerm + "%,bio.ilike.%" + searchTerm + "%");
    }
    if (locationSearch) {
      query = query.ilike("service_area", "%" + locationSearch + "%");
    }
    const { data } = await query;

    const withRatings = [];
    for (const artisan of data || []) {
      const { data: ratingsData } = await supabase.from("ratings").select("stars").eq("rated_user_id", artisan.id);
      let rating = null;
      if (ratingsData && ratingsData.length > 0) {
        const avg = ratingsData.reduce(function (sum, r) { return sum + r.stars; }, 0) / ratingsData.length;
        rating = { avg: avg, count: ratingsData.length };
      }
      withRatings.push(Object.assign({}, artisan, { rating: rating }));
    }
    setArtisans(withRatings);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
  <h1 className="font-display font-bold text-2xl text-indigo-950 mb-1">
        {searchTerm ? "Results for \"" + searchTerm + "\"" : "Find a skilled worker in Osogbo"}
      </h1>
      <p className="text-sm text-indigo-950/60 mb-3">
        {loading ? "Searching..." : artisans.length + " artisan" + (artisans.length === 1 ? "" : "s") + " found" + (locationSearch ? " near " + locationSearch : "")}
      </p>

      {!showFilters ? (
        <button onClick={() => setShowFilters(true)} className="text-xs underline text-indigo-900 mb-4">
          Refine search (skill, location, keyword)
        </button>
      ) : (
        <div className="mb-4 space-y-2">
          <input
            type="text"
            placeholder="Search by service, name, or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-indigo-950/20 rounded px-3 py-2"
          />
          <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2">
            <option value="">All skills</option>
            {ARTISAN_SKILLS.map(function (s) { return (<option key={s} value={s}>{s}</option>); })}
          </select>
          <input
            list="artisan-location-suggestions"
            type="text"
            placeholder="Search by location in Osogbo..."
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            className="w-full border border-indigo-950/20 rounded px-3 py-2"
          />
          <datalist id="artisan-location-suggestions">
            {OSOGBO_AREAS.map(function (a) { return (<option key={a} value={a} />); })}
          </datalist>
          <button onClick={() => setShowFilters(false)} className="text-xs underline text-indigo-950/50">Hide filters</button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-indigo-950/50">Loading...</p>
      ) : artisans.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-indigo-950/20 rounded-lg">
          <p className="text-sm text-indigo-950/50">No matching artisans found yet.</p>
          <Link href="/profile" className="text-xs underline text-indigo-900 mt-2 inline-block">Be the first to register this skill</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {artisans.map(function (artisan) {
            return (
              <Link key={artisan.id} href={"/artisans/" + artisan.id} className="flex items-center gap-3 bg-white border border-indigo-950/10 rounded-lg p-3 hover:shadow-md">
                <div className="w-12 h-12 rounded-full bg-indigo-950/10 overflow-hidden shrink-0 flex items-center justify-center font-bold text-indigo-950">
                  {artisan.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artisan.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    artisan.name ? artisan.name.charAt(0).toUpperCase() : "?"
                  )}
                </div>
                <div>
                  <p className="font-semibold text-indigo-950">{artisan.name}</p>
                  <p className="text-sm text-indigo-950/60">{artisan.artisan_skill} - {artisan.years_experience || 0} years experience</p>
                  {artisan.bio && <p className="text-xs text-indigo-950/50 line-clamp-1">{artisan.bio}</p>}
                  {artisan.rating && (
                    <p className="text-xs text-indigo-950/50">{artisan.rating.avg.toFixed(1)} stars ({artisan.rating.count} reviews)</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ArtisansPage() {
  return (
    <Suspense fallback={<p className="text-sm text-indigo-950/50">Loading...</p>}>
      <ArtisansContent />
    </Suspense>
  );
}