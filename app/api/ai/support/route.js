export async function POST(request) {
  const body = await request.json();
  const history = body.history || [];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: "You are the friendly support assistant for OshogboMarket, a buy and sell marketplace for Osogbo, Nigeria. Help users with: how to post a listing (sell or buy request), how to chat with a buyer/seller, how WhatsApp contact works, how favorites/saved goods work, how ratings work, how to edit or delete a listing, how password reset works, and general safety tips (meet in public places, do not pay before inspecting goods). Keep answers short, warm, and practical. If asked something you cannot help with, suggest they contact the site admin.",
      messages: history.concat([{ role: "user", content: body.message }]),
    }),
  });

  const data = await response.json();
  const text = data.content && data.content[0] ? data.content[0].text : "Sorry, I could not process that. Please try again.";
  return Response.json({ reply: text.trim() });
}