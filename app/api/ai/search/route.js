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
      system: "Parse the user's natural language marketplace search into ONLY valid JSON, nothing else, in this exact shape: {\"keywords\": \"string or empty\", \"category\": \"one of Phones & Tablets, Electronics, Fashion, Home & Furniture, Vehicles, Food & Groceries, Services, Other, or null\", \"maxPrice\": number or null, \"area\": \"an Osogbo area name if mentioned, or null\"}",
      messages: [{ role: "user", content: body.query }],
    }),
  });
  const data = await response.json();
  const text = data.content && data.content[0] ? data.content[0].text : "{}";
  let parsed = {};
  try {
    parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (err) {
    parsed = {};
  }
  return Response.json(parsed);
}