"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { OSOGBO_AREAS, CATEGORIES, CATEGORY_FIELDS } from "../../../lib/osogboAreas";
import { compressImage } from "../../../lib/compressImage";

export default function NewListingPage() {
  const router = useRouter();
  const [type, setType] = useState("sell");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [area, setArea] = useState(OSOGBO_AREAS[0]);
  const [whatsapp, setWhatsapp] = useState("");
  const [condition, setCondition] = useState("Used");
  const [negotiable, setNegotiable] = useState(false);
  const [attributes, setAttributes] = useState({});
  const [files, setFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiWorking, setAiWorking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [priceHint, setPriceHint] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: profile } = await supabase.from("users").select("whatsapp_number").eq("id", userData.user.id).single();
      if (profile?.whatsapp_number) setWhatsapp(profile.whatsapp_number);
    }
    loadProfile();
  }, []);

  useEffect(() => {
    async function loadPriceHint() {
      if (!title || title.length < 3) {
        setPriceHint("");
        return;
      }
      const { data } = await supabase.from("listings").select("price").eq("category", category).eq("status", "active").limit(20);
      if (data && data.length >= 2) {
        const prices = data.map(function (d) { return d.price; }).filter(Boolean);
        if (prices.length >= 2) {
          const min = Math.min.apply(null, prices);
          const max = Math.max.apply(null, prices);
          setPriceHint("Similar " + category + " listings in Osogbo range from NGN " + min.toLocaleString() + " to NGN " + max.toLocaleString());
        }
      }
    }
    loadPriceHint();
  }, [category, title]);

  function normalizeWhatsapp(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("0")) return "234" + digits.slice(1);
    if (digits.startsWith("234")) return digits;
    return digits;
  }

  function handleVideoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg("Video must be under 50MB. Try a shorter clip.");
      return;
    }
    setErrorMsg("");
    setVideoFile(file);
  }

  async function handleSuggestCategory() {
    if (!title.trim()) return;
    setAiWorking(true);
    const response = await fetch("/api/ai/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title }),
    });
    const data = await response.json();
    if (CATEGORIES.includes(data.category)) setCategory(data.category);
    setAiWorking(false);
  }

 async function handleGenerateDescription() {
    if (!title.trim()) return;
    setAiWorking(true);
    try {
      const response = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title, category: category, keywords: description }),
      });
      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
      } else {
        setErrorMsg("AI could not generate a description right now.");
      }
    } catch (err) {
      setErrorMsg("AI request failed. Please try again.");
    }
    setAiWorking(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setErrorMsg("Please log in first.");
      setLoading(false);
      router.push("/auth");
      return;
    }

    if (!whatsapp.trim()) {
      setErrorMsg("Please add a WhatsApp number so buyers/sellers can reach you.");
      setLoading(false);
      return;
    }

    const { data: lastListing } = await supabase
      .from("listings")
      .select("created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastListing) {
      const secondsSince = (Date.now() - new Date(lastListing.created_at).getTime()) / 1000;
      if (secondsSince < 60) {
        setErrorMsg("Please wait " + Math.ceil(60 - secondsSince) + " seconds before posting again.");
        setLoading(false);
        return;
      }
    }

    const normalizedWhatsapp = normalizeWhatsapp(whatsapp);

    const imageUrls = [];
    for (const file of files) {
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
        imageUrls.push(publicUrlData.publicUrl);
      }
    }

    let videoUrl = null;
    if (videoFile) {
      const videoPath = userData.user.id + "/" + Date.now() + "-" + videoFile.name;
      const { error: videoError } = await supabase.storage.from("listing-videos").upload(videoPath, videoFile);
      if (!videoError) {
        const { data: videoPublicUrl } = supabase.storage.from("listing-videos").getPublicUrl(videoPath);
        videoUrl = videoPublicUrl.publicUrl;
      }
    }

    await supabase.from("users").update({ whatsapp_number: normalizedWhatsapp }).eq("id", userData.user.id);

    let flagged = false;
    let flagReason = "";
    try {
      const modResponse = await fetch("/api/ai/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title, description: description, price: price }),
      });
      const modData = await modResponse.json();
      flagged = !!modData.flagged;
      flagReason = modData.reason || "";
    } catch (err) {
      flagged = false;
    }

    const { error } = await supabase.from("listings").insert({
      user_id: userData.user.id,
      type,
      title,
      description,
      price: Number(price),
      category,
      custom_category: category === "Other" ? customCategory : null,
      location_area: area,
      images: imageUrls,
      video_url: videoUrl,
      whatsapp_number: normalizedWhatsapp,
      condition: condition,
      negotiable: negotiable,
      attributes: attributes,
      ai_flagged: flagged,
      ai_flag_reason: flagReason,
      status: "active",
    });

    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    router.push("/");
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display font-bold text-xl text-indigo-950 mb-4">Post to OshogboMarket</h1>

      <div className="flex gap-2 mb-5">
        <button type="button" onClick={() => setType("sell")} className={"flex-1 py-2 rounded font-semibold text-sm " + (type === "sell" ? "bg-indigo-950 text-parchment" : "bg-white border border-indigo-950/20")}>
          I am selling something
        </button>
        <button type="button" onClick={() => setType("buy_request")} className={"flex-1 py-2 rounded font-semibold text-sm " + (type === "buy_request" ? "bg-gold-500 text-indigo-950" : "bg-white border border-indigo-950/20")}>
          I want to buy something
        </button>
      </div>

      {errorMsg && <p className="text-sm text-red-600 mb-3">{errorMsg}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input required type="text" placeholder={type === "sell" ? "What are you selling? Anything goes." : "What do you need?"} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />

        <div className="flex gap-2">
          <button type="button" onClick={handleSuggestCategory} disabled={aiWorking || !title.trim()} className="text-xs bg-indigo-950/5 text-indigo-950 rounded px-3 py-2 disabled:opacity-50">
            AI: Suggest category
          </button>
          <button type="button" onClick={handleGenerateDescription} disabled={aiWorking || !title.trim()} className="text-xs bg-indigo-950/5 text-indigo-950 rounded px-3 py-2 disabled:opacity-50">
            {aiWorking ? "Working..." : "AI: Write description"}
          </button>
        </div>

        <textarea placeholder="Add details buyers/sellers should know" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        <input required type="number" placeholder={type === "sell" ? "Price (NGN)" : "Your budget (NGN)"} value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />

        {priceHint && <p className="text-xs text-indigo-950/50">{priceHint}</p>}

        {type === "sell" && (
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
        )}

        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2">
          {CATEGORIES.map(function (c) { return (<option key={c} value={c}>{c}</option>); })}
        </select>

        {category === "Other" && (
          <input type="text" placeholder="Describe what type of item this is" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        )}

        {CATEGORY_FIELDS[category] && (
          <div className="space-y-2 border border-indigo-950/10 rounded p-3 bg-indigo-950/5">
            <p className="text-xs font-semibold text-indigo-950/60">Additional details for {category}</p>
            {CATEGORY_FIELDS[category].map(function (field) {
              if (field.type === "select") {
                return (
                  <select key={field.key} value={attributes[field.key] || ""} onChange={(e) => setAttributes(Object.assign({}, attributes, { [field.key]: e.target.value }))} className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm">
                    <option value="">{field.label}</option>
                    {field.options.map(function (opt) { return (<option key={opt} value={opt}>{opt}</option>); })}
                  </select>
                );
              }
              return (
                <input key={field.key} type={field.type} placeholder={field.label} value={attributes[field.key] || ""} onChange={(e) => setAttributes(Object.assign({}, attributes, { [field.key]: e.target.value }))} className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm" />
              );
            })}
          </div>
        )}

       <input
          list="new-listing-area-suggestions"
          type="text"
          placeholder="Location in Osogbo"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full border border-indigo-950/20 rounded px-3 py-2"
        />
        <datalist id="new-listing-area-suggestions">
          {OSOGBO_AREAS.map(function (a) { return (<option key={a} value={a} />); })}
        </datalist>
        <div>
          <label className="block text-sm text-indigo-950/70 mb-1">Your WhatsApp number</label>
          <input required type="tel" placeholder="e.g. 08012345678" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-indigo-950/70 mb-1">Photos {type === "buy_request" && "(optional)"}</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files))} className="w-full text-sm" />
        </div>
        <div>
          <label className="block text-sm text-indigo-950/70 mb-1">Video (optional, max 50MB)</label>
          <input type="file" accept="video/*" onChange={handleVideoChange} className="w-full text-sm" />
          {videoFile && <p className="text-xs text-indigo-950/50 mt-1">{videoFile.name} selected</p>}
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-950 text-parchment font-semibold rounded px-3 py-2 disabled:opacity-50">
          {loading ? "Posting..." : "Post it"}
        </button>
      </form>
    </div>
  );
}