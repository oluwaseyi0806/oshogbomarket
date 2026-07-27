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
      max_tokens: 20,
      system: "Given a marketplace listing title, respond with only the single best matching category from this exact list, nothing else, no punctuation: Phones & Tablets, Electronics, Fashion, Home & Furniture, Vehicles, Food & Groceries, Services, Other",
      messages: [{ role: "user", content: body.title }],
    }),
  });
  const data = await response.json();
  const text = data.content && data.content[0] ? data.content[0].text : "Other";
  return Response.json({ category: text.trim() });
}