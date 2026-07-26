export async function POST(request) {
  const body = await request.json();
  const toEmail = body.toEmail;
  const listingTitle = body.listingTitle;
  const messageText = body.messageText;
  const chatUrl = body.chatUrl;

  if (!toEmail) {
    return Response.json({ skipped: true, reason: "no email" });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "OshogboMarket <onboarding@resend.dev>",
      to: [toEmail],
      subject: "New message about " + listingTitle,
      html:
        "<p>You have a new message on OshogboMarket about <strong>" +
        listingTitle +
        "</strong>:</p><p>" +
        messageText +
        "</p><p><a href='" +
        chatUrl +
        "'>Reply here</a></p>",
    }),
  });

  const data = await response.json();
  return Response.json(data);
}