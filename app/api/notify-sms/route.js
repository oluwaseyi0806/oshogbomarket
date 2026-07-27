export async function POST(request) {
  const body = await request.json();
  const toPhone = body.toPhone;
  const message = body.message;

  if (!toPhone) {
    return Response.json({ skipped: true });
  }

  const response = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: toPhone,
      from: "OshogboMkt",
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: process.env.TERMII_API_KEY,
    }),
  });

  const data = await response.json();
  return Response.json(data);
}