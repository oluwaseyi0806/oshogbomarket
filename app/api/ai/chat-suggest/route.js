export async function POST(request) {
  const body = await request.json();
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      system: "Given the other person's last message in a marketplace chat, suggest 3 short, natural quick-reply options. Respond with ONLY a valid JSON array of 3 short strings, nothing else.",
      messages: [{ role: "user", content: body.lastMessage }],
    }),
  });
  const data = await response.json();
  const text = data.content && data.content[0] ? data.content[0].text : "[]";
  let suggestions = [];
  try {
    suggestions = JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (err) {
    suggestions = [];
  }
  return Response.json({ suggestions: suggestions });
}