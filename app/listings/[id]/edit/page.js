"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { OSOGBO_AREAS, CATEGORIES } from "../../../../lib/osogboAreas";
import { compressImage } from "../../../../lib/compressImage";

export default function EditListingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [area, setArea] = useState("");
  const [condition, setCondition] = useState("Used");
  const [negotiable, setNegotiable] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const { data } = await supabase.from("listings").select("*").eq("id", id).single();

    if (!data || !userData?.user || data.user_id !== userData.user.id) {
      router.push("/listings/" + id);
      return;
    }

    setListing(data);
    setTitle(data.title);
    setDescription(data.description || "");
    setPrice(String(data.price));
    setCategory(data.category);
    setArea(data.location_area);
    setCondition(data.condition || "Used");
    setNegotiable(!!data.negotiable);
    setExistingImages(data.images || []);
  }

  function moveImage(index, direction) {
    setExistingImages(function (prev) {
      const arr = prev.slice();
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= arr.length) return arr;
      const temp = arr[index];
      arr[index] = arr[newIndex];
      arr[newIndex] = temp;
      return arr;
    });
  }
  function removeExistingImage(url) {
    setExistingImages(function (prev) { return prev.filter(function (u) { return u !== url; }); });
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data: userData } = await supabase.auth.getUser();

    const newUrls = [];
    for (const file of newFiles) {
      let uploadFile = file;
      try {
        uploadFile = await compressImage(file);
      } catch (err) {
        uploadFile = file;
      }
      const filePath = userData.user.id + "/" + Date.now() + "-" + file.name;
      const { error: uploadError } = await supabase.storage.from("listing-images").upload(filePath, uploadFile);
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from("listing-images").getPublicUrl(filePath);
        newUrls.push(publicUrlData.publicUrl);
      }
    }

    const finalImages = existingImages.concat(newUrls);

    const { error } = await supabase
      .from("listings")
      .update({
        title: title,
        description: description,
        price: Number(String(price).replace(/[^0-9.]/g, "")),
        category: category,
        location_area: area,
        condition: condition,
        negotiable: negotiable,
        images: finalImages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    router.push("/listings/" + id);
  }

  async function handleDelete() {
    if (!confirm("Delete this listing permanently? This cannot be undone.")) return;
    await supabase.from("listings").delete().eq("id", id);
    router.push("/profile");
  }

  if (!listing) return <p className="text-sm text-indigo-950/50">Loading...</p>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display font-bold text-xl text-indigo-950 mb-4">Edit listing</h1>

      {errorMsg && <p className="text-sm text-red-600 mb-3">{errorMsg}</p>}

      <form onSubmit={handleSave} className="space-y-3">
        <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        <input required type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />

        <div className="flex gap-2">
          <select value={condition} onChange={(e) => setCondition(e.target.value)} className="flex-1 border border-indigo-950/20 rounded px-3 py-2">
            <option value="New">New</option>
            <option value="Used">Used</option>
            <option value="Refurbished">Refurbished</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-indigo-950/70 border border-indigo-950/20 rounded px-3">
            <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} />
            Negotiable
          </label>
        </div>

        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2">
          {CATEGORIES.map(function (c) { return (<option key={c} value={c}>{c}</option>); })}
        </select>
        <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2">
          {OSOGBO_AREAS.map(function (a) { return (<option key={a} value={a}>{a}</option>); })}
        </select>

        <div>
          <label className="block text-sm text-indigo-950/70 mb-1">Current photos (click to remove)</label>
          <div className="flex flex-wrap gap-2">
            {existingImages.map(function (url, i) {
              return (
                <div key={i} className="relative w-16 h-16 rounded overflow-hidden border border-indigo-950/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-0.5 opacity-0 hover:opacity-100">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => moveImage(i, -1)} className="bg-white/90 text-indigo-950 text-xs px-1 rounded">Left</button>
                      <button type="button" onClick={() => moveImage(i, 1)} className="bg-white/90 text-indigo-950 text-xs px-1 rounded">Right</button>
                    </div>
                    <button type="button" onClick={() => removeExistingImage(url)} className="bg-red-600 text-white text-xs px-1 rounded">Remove</button>
                  </div>
                  {i === 0 && <span className="absolute bottom-0 left-0 bg-gold-500 text-indigo-950 text-[9px] font-bold px-1">Main</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm text-indigo-950/70 mb-1">Add more photos</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setNewFiles(Array.from(e.target.files))} className="w-full text-sm" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-950 text-parchment font-semibold rounded px-3 py-2 disabled:opacity-50">
          {loading ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={handleDelete} className="w-full text-sm text-red-600 underline py-2">
          Delete this listing
        </button>
      </form>
    </div>
  );
}