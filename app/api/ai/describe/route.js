New-Item -ItemType Directory -Force -Path app\api\ai\describe | Out-Null

@'
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
      max_tokens: 200,
      system: "You write short, appealing marketplace listing descriptions for OshogboMarket, a buy and sell platform in Osogbo, Nigeria. Keep it under 60 words, friendly, honest, no exaggerated claims. Respond with only the description text, nothing else.",
      messages: [{ role: "user", content: "Title: " + body.title + ". Category: " + (body.category || "") + ". Extra details from seller: " + (body.keywords || "") }],
    }),
  });
  const data = await response.json();
  const text = data.content && data.content[0] ? data.content[0].text : "";
  return Response.json({ description: text.trim() });
}
'@ | Out-File -LiteralPath "app\api\ai\describe\route.js" -Encoding utf8 -NoNewline