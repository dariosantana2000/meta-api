import crypto from "crypto";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Solo POST permitido" });
  }

  const { email, pixelID, accessToken, test_event_code } = req.body;

  if (!email || !pixelID || !accessToken) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const hashEmail = crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

  const payload = {
  data: [
    {
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      user_data: {
        em: [hashEmail],
      },
    },
  ],
  ...(test_event_code && { test_event_code }),
};

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${pixelID}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error || "Error en la API de Meta" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
