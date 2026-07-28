"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { OSOGBO_AREAS } from "../../../lib/osogboAreas";

export default function PersonalDetailsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [location, setLocation] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("");
  const [saving, setSaving] = useState(false);

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
    const { data: profile } = await supabase.from("users").select("*").eq("id", userData.user.id).single();
    setFirstName(profile?.first_name || "");
    setLastName(profile?.last_name || "");
    setLocation(profile?.service_area || "");
    setDateOfBirth(profile?.date_of_birth || "");
    setSex(profile?.sex || "");
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const fullName = (firstName.trim() + " " + lastName.trim()).trim() || "Osogbo user";
    await supabase.from("users").update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      name: fullName,
      service_area: location,
      date_of_birth: dateOfBirth || null,
      sex: sex,
    }).eq("id", userId);
    setSaving(false);
    alert("Personal details updated.");
    router.push("/settings");
  }

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => router.push("/settings")} className="text-xs text-indigo-950/50 underline mb-4">Back to settings</button>
      <h1 className="font-display font-bold text-xl text-indigo-950 mb-4">Personal details</h1>

      <form onSubmit={handleSave} className="space-y-3">
        <div className="flex gap-2">
          <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-1/2 border border-indigo-950/20 rounded px-3 py-2" />
          <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-1/2 border border-indigo-950/20 rounded px-3 py-2" />
        </div>

        <input list="settings-location-suggestions" type="text" placeholder="Your location in Osogbo" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        <datalist id="settings-location-suggestions">
          {OSOGBO_AREAS.map(function (a) { return (<option key={a} value={a} />); })}
        </datalist>

        <div>
          <label className="block text-xs text-indigo-950/60 mb-1">Date of birth</label>
          <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2" />
        </div>

        <select value={sex} onChange={(e) => setSex(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2">
          <option value="">Select sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <button type="submit" disabled={saving} className="w-full bg-indigo-950 text-parchment font-semibold rounded px-3 py-2 disabled:opacity-50">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}