import { supabase } from "./supabaseClient";

export function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function ensureReferralCode(userId) {
  const { data: profile } = await supabase.from("users").select("referral_code").eq("id", userId).single();
  if (profile?.referral_code) return profile.referral_code;

  let newCode = generateReferralCode();
  let attempts = 0;
  while (attempts < 5) {
    const { error } = await supabase.from("users").update({ referral_code: newCode }).eq("id", userId);
    if (!error) return newCode;
    newCode = generateReferralCode();
    attempts++;
  }
  return null;
}

export async function checkAndGrantReferralReward(referrerId) {
  if (!referrerId) return;

  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", referrerId)
    .eq("is_artisan", true);

  const qualifyingReferrals = count || 0;
  const earnedBoosts = Math.floor(qualifyingReferrals / 3);

  const { data: referrer } = await supabase.from("users").select("referral_boosts_granted").eq("id", referrerId).single();
  const alreadyGranted = referrer?.referral_boosts_granted || 0;

  if (earnedBoosts > alreadyGranted) {
    const newBoosts = earnedBoosts - alreadyGranted;
    const extraDays = newBoosts * 7;

    const { data: listing } = await supabase
      .from("listings")
      .select("id, boosted_until")
      .eq("user_id", referrerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (listing) {
      const currentBoost = listing.boosted_until && new Date(listing.boosted_until) > new Date() ? new Date(listing.boosted_until) : new Date();
      const newBoostUntil = new Date(currentBoost.getTime() + extraDays * 24 * 60 * 60 * 1000);
      await supabase.from("listings").update({ boosted_until: newBoostUntil.toISOString() }).eq("id", listing.id);
    }

    await supabase.from("users").update({ referral_boosts_granted: earnedBoosts }).eq("id", referrerId);
  }
}