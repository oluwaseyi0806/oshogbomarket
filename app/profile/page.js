"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { ARTISAN_SKILLS, OSOGBO_AREAS } from "../../lib/osogboAreas";
import ListingCard from "../../components/ListingCard";
import AutocompleteInput from "../../components/AutocompleteInput";
import VideoPlayer from "../../components/VideoPlayer";
import { isOnline } from "../../lib/presence";
import { Suspense } from "react";

function hueFromId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState(null);

  const [isArtisan, setIsArtisan] = useState(false);
  const [editingArtisan, setEditingArtisan] = useState(false);
  const [artisanSkill, setArtisanSkill] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");
  const [artisanArea, setArtisanArea] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [artisanWhatsapp, setArtisanWhatsapp] = useState("");
  const [workPhotos, setWorkPhotos] = useState([]);
  const [newWorkPhotoFiles, setNewWorkPhotoFiles] = useState([]);
  const [workVideoUrl, setWorkVideoUrl] = useState(null);
  const [newWorkVideoFile, setNewWorkVideoFile] = useState(null);
  const [savingArtisan, setSavingArtisan] = useState(false);
  const [artisanRating, setArtisanRating] = useState(null);
  const [hasArtisanProfile, setHasArtisanProfile] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      router.push("/auth");
      return;
    }
    setUserId(userData.user.id);

    const { data: profileData } = await supabase.from("users").select("*").eq("id", userData.user.id).single();
    setProfile(profileData);

    const alreadyArtisan = !!profileData?.is_artisan && !!profileData?.artisan_skill;
    setIsArtisan(!!profileData?.is_artisan);
    setHasArtisanProfile(alreadyArtisan);
    setArtisanSkill(profileData?.artisan_skill || "");
    setYearsExperience(profileData?.years_experience || "");
    setBio(profileData?.bio || "");
    setArtisanArea(profileData?.service_area || "");
    setPhoneNumber(profileData?.phone_number || "");
    setArtisanWhatsapp(profileData?.whatsapp_number || "");
    setWorkPhotos(profileData?.work_photos || []);
    setWorkVideoUrl(profileData?.work_video_url || null);

    if (searchParams.get("register") === "artisan" && !alreadyArtisan) {
      setIsArtisan(true);
      setEditingArtisan(true);
    }

    const { data: ratingsData } = await supabase.from("ratings").select("stars").eq("rated_user_id", userData.user.id);
    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce(function (sum, r) { return sum + r.stars; }, 0) / ratingsData.length;
      setArtisanRating({ avg: avg, count: ratingsData.length });
    }

    const { data: listingsData } = await supabase.from("listings").select("*").eq("user_id", userData.user.id).order("created_at", { ascending: false });
    setMyListings(listingsData || []);

    const { data: favData } = await supabase.from("favorites").select("listings(*)").eq("user_id", userData.user.id);
    setFavorites((favData || []).map(function (f) { return f.listings; }).filter(Boolean));

    setLoading(false);
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file || !userId) return;
    setUploading(true);
    const filePath = userId + "/avatar-" + Date.now() + "-" + file.name;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      await supabase.from("users").update({ avatar_url: publicUrlData.publicUrl }).eq("id", userId);
      setProfile(function (prev) { return Object.assign({}, prev, { avatar_url: publicUrlData.publicUrl }); });
    }
    setUploading(false);
  }

  function removeWorkPhoto(url) {
    setWorkPhotos(function (prev) { return prev.filter(function (u) { return u !== url; }); });
  }

  function handleWorkVideoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert("Video must be under 50MB.");
      return;
    }
    setNewWorkVideoFile(file);
  }

  async function saveArtisanProfile() {
    if (!userId) return;

    if (!profile?.avatar_url) {
      alert("Please upload a clear profile picture first before saving your artisan profile.");
      return;
    }
    if (!artisanSkill) {
      alert("Please select your main skill.");
      return;
    }

    setSavingArtisan(true);

    let finalPhotos = workPhotos.slice();
    for (const file of newWorkPhotoFiles) {
      const filePath = userId + "/work-" + Date.now() + "-" + file.name;
      const { error: uploadError } = await supabase.storage.from("listing-images").upload(filePath, file);
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from("listing-images").getPublicUrl(filePath);
        finalPhotos.push(publicUrlData.publicUrl);
      }
    }

    let finalVideoUrl = workVideoUrl;
    if (newWorkVideoFile) {
      const videoPath = userId + "/work-video-" + Date.now() + "-" + newWorkVideoFile.name;
      const { error: videoError } = await supabase.storage.from("listing-videos").upload(videoPath, newWorkVideoFile);
      if (!videoError) {
        const { data: videoPublicUrl } = supabase.storage.from("listing-videos").getPublicUrl(videoPath);
        finalVideoUrl = videoPublicUrl.publicUrl;
      }
    }

    await supabase.from("users").update({
      is_artisan: true,
      artisan_skill: artisanSkill,
      years_experience: yearsExperience ? Number(yearsExperience) : null,
      service_area: artisanArea,
      bio: bio,
      work_photos: finalPhotos,
      work_video_url: finalVideoUrl,
      phone_number: phoneNumber,
      whatsapp_number: artisanWhatsapp,
    }).eq("id", userId);

    setWorkPhotos(finalPhotos);
    setWorkVideoUrl(finalVideoUrl);
    setNewWorkPhotoFiles([]);
    setNewWorkVideoFile(null);
    setSavingArtisan(false);
    setHasArtisanProfile(true);
    setEditingArtisan(false);
    load();
    alert("Artisan profile saved.");
  }

  async function removeArtisanProfile() {
    if (!confirm("Completely delete your artisan profile? All your artisan details, work photos, and video will be permanently removed. You can register fresh afterwards.")) return;
    await supabase.from("users").update({
      is_artisan: false,
      artisan_skill: null,
      years_experience: null,
      service_area: null,
      bio: null,
      work_photos: [],
      work_video_url: null,
    }).eq("id", userId);

    setIsArtisan(false);
    setHasArtisanProfile(false);
    setEditingArtisan(false);
    setArtisanSkill("");
    setYearsExperience("");
    setBio("");
    setArtisanArea("");
    setWorkPhotos([]);
    setWorkVideoUrl(null);
  }

  async function markSold(id) {
    await supabase.from("listings").update({ status: "sold", updated_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  async function deleteListing(id) {
    await supabase.from("listings").delete().eq("id", id);
    load();
  }

  if (loading) return <p className="text-sm text-indigo-950/50">Loading...</p>;

  const online = isOnline(profile?.last_seen);
  const cardHue = userId ? hueFromId(userId) : 220;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative w-20 h-20 rounded-full bg-indigo-950/10 overflow-hidden shrink-0">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display font-bold text-2xl text-indigo-950">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-gold-500 text-indigo-950 text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center cursor-pointer">
              {uploading ? "..." : "+"}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl text-indigo-950 truncate">{profile?.name}</h1>
            <p className="text-sm text-indigo-950/50 truncate">{profile?.email}</p>
            <p className="text-xs text-indigo-950/40">
              Member since {new Date(profile?.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <button onClick={() => router.push("/settings")} className="flex items-center justify-center sm:justify-start gap-1 text-sm font-semibold text-indigo-950/70 shrink-0 self-start sm:self-auto">
          <span className="text-lg">{"\u2699"}</span> Settings
        </button>
      </div>

      {hasArtisanProfile && !editingArtisan && (
        <div className="mb-6">
          <div
            className="rounded-xl p-5 text-parchment shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(" + cardHue + ", 45%, 22%), #151C33)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-512.png" alt="" className="w-6 h-6 rounded" />
              <span className="text-xs font-bold tracking-widest uppercase text-gold-500">OshogboMarket Verified Card</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center font-bold text-3xl shrink-0 border-2 border-gold-500">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile?.name ? profile.name.charAt(0).toUpperCase() : "?"
                )}
              </div>
              <div>
                <h2 className="font-display font-bold text-xl">{profile?.name}</h2>
                <p className="text-gold-500 font-semibold text-sm">{artisanSkill}</p>
                <p className="text-xs text-parchment/70 mt-1">{yearsExperience || 0} years experience</p>
                <p className="text-xs text-parchment/70">{artisanArea || "Osogbo"}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={"w-2 h-2 rounded-full " + (online ? "bg-green-500" : "bg-parchment/30")} />
                  <span className="text-xs text-parchment/70">{online ? "Online now" : "Offline"}</span>
                </div>
              </div>
            </div>
            {artisanRating && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-xs text-parchment/60">
                <span>Your rating</span>
                <span className="text-gold-500 font-semibold">{artisanRating.avg.toFixed(1)} stars ({artisanRating.count})</span>
              </div>
            )}
          </div>

          {bio && (
            <div className="bg-white border border-indigo-950/10 rounded-lg p-4 mt-3">
              <p className="text-xs font-semibold text-indigo-950/50 uppercase tracking-wide mb-1">About</p>
              <p className="text-sm text-indigo-950/80">{bio}</p>
            </div>
          )}

          {workPhotos.length > 0 && (
            <div className="bg-white border border-indigo-950/10 rounded-lg p-4 mt-3">
              <p className="text-xs font-semibold text-indigo-950/50 uppercase tracking-wide mb-2">Samples of your work</p>
              <div className="grid grid-cols-3 gap-2">
                {workPhotos.map(function (url, i) {
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded" />
                  );
                })}
              </div>
            </div>
          )}

          {workVideoUrl && (
            <div className="bg-white border border-indigo-950/10 rounded-lg p-4 mt-3">
              <p className="text-xs font-semibold text-indigo-950/50 uppercase tracking-wide mb-2">Video of your work</p>
              <VideoPlayer src={workVideoUrl} className="w-full rounded-lg bg-black" />
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button onClick={() => setEditingArtisan(true)} className="flex-1 bg-indigo-950 text-parchment font-semibold rounded px-3 py-2 text-sm">Edit artisan details</button>
            <button onClick={removeArtisanProfile} className="bg-red-600 text-white font-semibold rounded px-3 py-2 text-sm">Delete profile</button>
          </div>
        </div>
      )}

      {!hasArtisanProfile && (
        <div className="bg-white border border-indigo-950/10 rounded-lg p-4 mb-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-indigo-950 mb-3">
            <input type="checkbox" checked={isArtisan} onChange={(e) => { setIsArtisan(e.target.checked); setEditingArtisan(e.target.checked); }} />
            I offer a skilled service (plumbing, electrical, tailoring, etc.)
          </label>
        </div>
      )}

      {(editingArtisan || (isArtisan && !hasArtisanProfile)) && (
        <div className="bg-white border border-indigo-950/10 rounded-lg p-4 mb-6 space-y-3">
          {!profile?.avatar_url && (
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded p-3">
              <p className="text-xs text-red-600">A clear profile picture is required for your artisan card.</p>
              <label className="bg-red-600 text-white text-xs font-semibold rounded px-3 py-1.5 cursor-pointer shrink-0 ml-2">
                {uploading ? "..." : "Add Profile Picture"}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          )}

          <select value={artisanSkill} onChange={(e) => setArtisanSkill(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm">
            <option value="">Select your main skill</option>
            {ARTISAN_SKILLS.map(function (s) { return (<option key={s} value={s}>{s}</option>); })}
          </select>

          <AutocompleteInput
            value={artisanArea}
            onChange={setArtisanArea}
            options={OSOGBO_AREAS}
            placeholder="Your location in Osogbo"
            className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm"
          />

          <input type="tel" placeholder="Call number (e.g. 08012345678)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm" />
          <input type="tel" placeholder="WhatsApp number (e.g. 08012345678)" value={artisanWhatsapp} onChange={(e) => setArtisanWhatsapp(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm" />
          <input type="number" placeholder="Years of experience" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm" />
          <textarea placeholder="Short bio - describe your work, tools, or specialty" value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm" />

          <div>
            <label className="block text-xs font-semibold text-indigo-950/60 mb-1">Photos of your work</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {workPhotos.map(function (url, i) {
                return (
                  <button key={i} type="button" onClick={() => removeWorkPhoto(url)} className="relative w-16 h-16 rounded overflow-hidden border border-indigo-950/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute inset-0 bg-red-600/60 text-white text-xs flex items-center justify-center opacity-0 hover:opacity-100">Remove</span>
                  </button>
                );
              })}
            </div>
            <input type="file" accept="image/*" multiple onChange={(e) => setNewWorkPhotoFiles(Array.from(e.target.files))} className="w-full text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-indigo-950/60 mb-1">Video of your work (optional, max 50MB)</label>
            {workVideoUrl && <VideoPlayer src={workVideoUrl} className="w-full rounded mb-2 bg-black" />}
            <input type="file" accept="video/*" onChange={handleWorkVideoChange} className="w-full text-sm" />
            {newWorkVideoFile && <p className="text-xs text-indigo-950/50 mt-1">{newWorkVideoFile.name} selected</p>}
          </div>

          <div className="flex gap-2">
            <button onClick={saveArtisanProfile} disabled={savingArtisan} className="flex-1 bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-2 text-sm disabled:opacity-50">
              {savingArtisan ? "Saving..." : hasArtisanProfile ? "Save changes" : "Create artisan profile"}
            </button>
            {hasArtisanProfile && (
              <button onClick={() => setEditingArtisan(false)} className="bg-white border border-indigo-950/20 text-indigo-950 font-semibold rounded px-3 py-2 text-sm">Cancel</button>
            )}
          </div>
        </div>
      )}

      <h2 className="font-display font-bold text-indigo-950 mb-2">My listings</h2>
      {myListings.length === 0 ? (
        <p className="text-sm text-indigo-950/50">You have not posted anything yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {myListings.map(function (listing) {
            return (
              <div key={listing.id}>
                <ListingCard listing={listing} />
                <div className="flex gap-2 mt-1 text-xs">
                  <a href={"/listings/" + listing.id + "/edit"} className="underline text-indigo-900">Edit</a>
                  {listing.status === "active" && (
                    <button onClick={() => markSold(listing.id)} className="underline text-indigo-950/70">Mark sold</button>
                  )}
                  <button onClick={() => deleteListing(listing.id)} className="underline text-red-600/80">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="font-display font-bold text-indigo-950 mb-2 mt-8">My favorites</h2>
      {favorites.length === 0 ? (
        <p className="text-sm text-indigo-950/50">Nothing saved yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {favorites.map(function (listing) {
            return <ListingCard key={listing.id} listing={listing} />;
          })}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="text-sm text-indigo-950/50">Loading...</p>}>
      <ProfileContent />
    </Suspense>
  );
}