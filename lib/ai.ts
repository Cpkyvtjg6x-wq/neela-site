// IA — transcription (Whisper) + résumé d'appel (chat). Désactivé si OPENAI_API_KEY absent.
const key = process.env.OPENAI_API_KEY || "";

export function aiEnabled(): boolean {
  return !!key;
}

export async function transcribeAudio(file: Blob, filename = "appel.webm"): Promise<string> {
  if (!key) throw new Error("IA non configurée (OPENAI_API_KEY absent).");
  const fd = new FormData();
  fd.append("file", file, filename);
  fd.append("model", "whisper-1");
  fd.append("language", "fr");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: fd,
  });
  if (!res.ok) throw new Error(`Transcription échouée (${res.status}).`);
  const data = await res.json();
  return data.text || "";
}

export async function summarizeCall(transcript: string): Promise<{ summary: string; nextAction: string }> {
  if (!key) throw new Error("IA non configurée.");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: 'Tu résumes des appels de prospection commerciale en français. Réponds UNIQUEMENT en JSON {"summary":"2-3 phrases","nextAction":"prochaine action concrète"}.' },
        { role: "user", content: transcript.slice(0, 8000) },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Résumé échoué (${res.status}).`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  try {
    const j = JSON.parse(content);
    return { summary: j.summary || "", nextAction: j.nextAction || "" };
  } catch {
    return { summary: content, nextAction: "" };
  }
}
