export async function POST(request) {
  const { playerId, title, message } = await request.json();

  if (!playerId) {
    return Response.json({ skipped: true, reason: "no playerId" });
  }

  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + process.env.ONESIGNAL_REST_API_KEY,
    },
    body: JSON.stringify({
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      include_subscription_ids: [playerId],
      headings: { en: title },
      contents: { en: message },
    }),
  });

  const data = await response.json();
  return Response.json(data);
}