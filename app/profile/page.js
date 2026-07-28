"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { ARTISAN_SKILLS, OSOGBO_AREAS } from "../../lib/osogboAreas";
import ListingCard from "../../components/ListingCard";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState(null);

  const [isArtisan, setIsArtisan] = useState(false);
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

    setIsArtisan(!!profileData?.is_artisan);
    setHasArtisanProfile(!!profileData?.is_artisan && !!profileData?.artisan_skill);
    setArtisanSkill(profileData?.artisan_skill || "");
    setYearsExperience(profileData?.years_experience || "");
    setBio(profileData?.bio || "");
    setArtisanArea(profileData?.service_area || "");
    setPhoneNumber(profileData?.phone_number || "");
    setArtisanWhatsapp(profileData?.whatsapp_number || "");
    setWorkPhotos(profileData?.work_photos || []);
    setWorkVideoUrl(profileData?.work_video_url || null);

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
    alert("Artisan profile saved.");
  }

  async function removeArtisanProfile() {
    if (!confirm("Remove your artisan profile? People will no longer find you in artisan search. Your account and listings stay untouched.")) return;
    await supabase.from("users").update({ is_artisan: false }).eq("id", userId);
    setIsArtisan(false);
    setHasArtisanProfile(false);
    alert("Artisan profile removed.");
  }

  async function markSold(id) {
    await supabase.from("listings").update({ status: "sold", updated_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  async function deleteListing(id) {
    await supabase.from("listings").delete().eq("id", id);
    load();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return <p className="text-sm text-indigo-950/50">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
          <div>
            <h1 className="font-display font-bold text-xl text-indigo-950">{profile?.name}</h1>
            <p className="text-sm text-indigo-950/50">{profile?.email}</p>
            <p className="text-xs text-indigo-950/40">
              Member since {new Date(profile?.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <button onClick={logout} className="text-sm text-indigo-950/60 underline shrink-0">Log out</button>
      </div>

      <div className="bg-white border border-indigo-950/10 rounded-lg p-4 mb-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-indigo-950 mb-3">
          <input type="checkbox" checked={isArtisan} onChange={(e) => setIsArtisan(e.target.checked)} />
          I offer a skilled service (plumbing, electrical, tailoring, etc.)
        </label>

        {isArtisan && (
          <div className="space-y-3">
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

            <input list="profile-area-suggestions" type="text" placeholder="Your location in Osogbo" value={artisanArea} onChange={(e) => setArtisanArea(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm" />
            <datalist id="profile-area-suggestions">
              {OSOGBO_AREAS.map(function (a) { return (<option key={a} value={a} />); })}
            </datalist>

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
              {workVideoUrl && (
                <video controls className="w-full rounded mb-2 bg-black" src={workVideoUrl} />
              )}
              <input type="file" accept="video/*" onChange={handleWorkVideoChange} className="w-full text-sm" />
              {newWorkVideoFile && <p className="text-xs text-indigo-950/50 mt-1">{newWorkVideoFile.name} selected</p>}
            </div>

            {artisanRating && (
              <p className="text-xs text-indigo-950/60">{artisanRating.avg.toFixed(1)} out of 5 stars ({artisanRating.count} rating{artisanRating.count === 1 ? "" : "s"})</p>
            )}

            <div className="flex gap-2">
              <button onClick={saveArtisanProfile} disabled={savingArtisan} className="flex-1 bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-2 text-sm disabled:opacity-50">
                {savingArtisan ? "Saving..." : hasArtisanProfile ? "Save changes" : "Create artisan profile"}
              </button>
              {hasArtisanProfile && (
                <button onClick={removeArtisanProfile} className="bg-red-600 text-white font-semibold rounded px-3 py-2 text-sm">
                  Remove profile
                </button>
              )}
            </div>
            {hasArtisanProfile && (
              <a href={"/artisans/" + userId} target="_blank" rel="noopener noreferrer" className="block text-xs underline text-indigo-900 text-center">
                Preview my public artisan card
              </a>
            )}
          </div>
        )}
      </div>

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