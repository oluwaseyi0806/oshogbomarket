New-Item -ItemType Directory -Force -Path app\api\ai\moderate | Out-Null

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
      max_tokens: 150,
      system: "You review marketplace listings for signs of scams or spam, such as unrealistic prices, prohibited items, phishing, or fake giveaways. Respond with ONLY valid JSON, nothing else, in this exact shape: {\"flagged\": true or false, \"reason\": \"short reason or empty string\"}",
      messages: [{ role: "user", content: "Title: " + body.title + ". Description: " + body.description + ". Price: " + body.price }],
    }),
  });
  const data = await response.json();
  const text = data.content && data.content[0] ? data.content[0].text : "{\"flagged\": false, \"reason\": \"\"}";
  let parsed = { flagged: false, reason: "" };
  try {
    parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (err) {
    parsed = { flagged: false, reason: "" };
  }
  return Response.json(parsed);
}
'@ | Out-File -LiteralPath "app\api\ai\moderate\route.js" -Encoding utf8 -NoNewline