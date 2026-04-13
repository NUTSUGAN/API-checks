import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const PROMPT =
  "Le meilleur joueur du monde. Qui est-ce et pourquoi ? Donne moi une réponse détaillée en français.";

// Chaque provider a son propre endpoint et ses propres modèles
const providers = [
  {
    name: "Mistral",
    url: "https://api.mistral.ai/v1/chat/completions",
    key: process.env.MISTRAL_API_KEY,
    model: "mistral-small-latest",
  },
  {
    name: "Groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    key: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
  },
  {
    name: "Hugging Face",
    url: "https://router.huggingface.co/v1/chat/completions",
    key: process.env.HUGGING_FACE_API_KEY,
    model: "openai/gpt-oss-20b:fireworks-ai",
  },
];

function extractContent(data) {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.type === "text") return item.text;
        return "";
      })
      .join("")
      .trim();
  }

  const altText =
    data?.choices?.[0]?.text ||
    data?.output?.[0]?.content?.[0]?.text ||
    data?.content?.[0]?.text;

  if (typeof altText === "string" && altText.trim()) {
    return altText;
  }

  return null;
}

async function callProvider(provider, prompt) {
  if (!provider.key) {
    return {
      provider: provider.name,
      latency: 0,
      content: null,
      tokens: 0,
      error: "Clé API manquante",
    };
  }

  const start = Date.now(); // on démarre le chrono

  try {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.key}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 120,
      }),
    });

    const data = await response.json();
    const latency = Date.now() - start; // temps total en ms

    if (!response.ok) {
      return {
        provider: provider.name,
        latency,
        content: null,
        tokens: 0,
        error:
          data?.error?.message ||
          data?.error ||
          data?.message ||
          `HTTP ${response.status}`,
      };
    }

    const content = extractContent(data);

    return {
      provider: provider.name,
      latency,
      content: content || JSON.stringify(data, null, 2),
      tokens: data?.usage?.total_tokens || 0,
      error: null,
    };
  } catch (error) {
    return {
      provider: provider.name,
      latency: Date.now() - start,
      content: null,
      tokens: 0,
      error: error.message || "Erreur inconnue",
    };
  }
}

async function main() {
  console.log("MISTRAL_API_KEY =", process.env.MISTRAL_API_KEY);
  console.log("GROQ_API_KEY =", process.env.GROQ_API_KEY);
  console.log("HUGGING_FACE_API_KEY =", process.env.HUGGING_FACE_API_KEY);

  // On lance les trois en parallèle avec Promise.all
  const results = await Promise.all(
    providers.map((p) => callProvider(p, PROMPT))
  );

  // Affichage des résultats
  console.log(`\nPrompt : "${PROMPT}"\n`);
  console.log("-".repeat(60));

  for (const r of results) {
    console.log(`${r.provider} | ${r.latency}ms | ${r.tokens} tokens`);

    if (r.error) {
      console.log(`Erreur : ${r.error}`);
    } else {
      console.log(r.content);
    }

    console.log("-".repeat(60));
  }

  console.log("\nRésumé :");
  for (const r of results) {
    console.log(
      `${r.provider.padEnd(14)} ${String(r.latency).padEnd(6)} ms`
    );
  }
}

main();