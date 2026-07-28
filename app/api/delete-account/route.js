import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  const body = await request.json();
  const userId = body.userId;

  if (!userId) {
    return Response.json({ error: "No user ID provided" });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json({ success: true });
}