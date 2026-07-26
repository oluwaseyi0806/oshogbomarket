"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { OSOGBO_AREAS, CATEGORIES } from "../../../lib/osogboAreas";
import { compressImage } from "../../../lib/compressImage";

export default function NewListingPage() {
  const router = useRouter();
  const [type, setType] = useState("sell");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [area, setArea] = useState(OSOGBO_AREAS[0]);
  const [whatsapp, setWhatsapp] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: profile } = await supabase.from("users").select("whatsapp_number").eq("id", userData.user.id).single();
      if (profile?.whatsapp_number) setWhatsapp(profile.whatsapp_number);
    }
    loadProfile();
  }, []);

  function normalizeWhatsapp(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("0")) return "234" + digits.slice(1);
    if (digits.startsWith("234")) return digits;
    return digits;
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

    await supabase.from("users").update({ whatsapp_number: normalizedWhatsapp }).eq("id", userData.user.id);

    const { error } = await supabase.from("listings").insert({
      user_id: userData.user.id,
      type,
      title,
      description,
      price: Number(price),
      category,
      location_area: area,
      images: imageUrls,
      whatsapp_number: normalizedWhatsapp,
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
        <input required type="text" placeholder={type === "sell" ? "What are you selling?" : "What do you need?"} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        <textarea placeholder="Add details buyers/sellers should know" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        <input required type="number" placeholder={type === "sell" ? "Price (NGN)" : "Your budget (NGN)"} value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2">
          {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2">
          {OSOGBO_AREAS.map((a) => (<option key={a} value={a}>{a}</option>))}
        </select>
        <div>
          <label className="block text-sm text-indigo-950/70 mb-1">Your WhatsApp number</label>
          <input required type="tel" placeholder="e.g. 08012345678" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-indigo-950/70 mb-1">Photos {type === "buy_request" && "(optional)"}</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files))} className="w-full text-sm" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-950 text-parchment font-semibold rounded px-3 py-2 disabled:opacity-50">
          {loading ? "Posting..." : "Post it"}
        </button>
      </form>
    </div>
  );
}