export async function aiReply(prompt: string) {
  try {
    const res = await fetch(`${process.env.OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        messages: [
          {
            role: "system",
            content:
              "You are a roofing sales assistant. Ask ONE short booking question.",
          },
          { role: "user", content: prompt || "" },
        ],
      }),
    });

    const data = await res.json();

    return data?.message?.content || "Are you available this week?";
  } catch {
    return "Are you available this week?";
  }
}