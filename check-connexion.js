import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const PROMPT =
  "Explique le concept de récursion à un lycéen, en 3 phrases maximum.";

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
    name: "HuggingFace",
    url: "https://router.huggingface.co/v1/chat/completions",
    key: process.env.HUGGING_FACE_API_KEY,
    model: "openai/gpt-oss-20b:fireworks-ai",
  },
];

function extractContent(data) {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
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
    return altText.trim();
  }

  return null;
}

async function checkProvider(provider) {
  if (!provider.key) {
    return {
      provider: provider.name,
      status: "ERROR",
      latency: 0,
      content: null,
      tokens: 0,
      error: "Clé API manquante",
    };
  }

  const start = Date.now();

  try {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.key}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: "user", content: PROMPT }],
        temperature: 0.7,
        max_tokens: 120,
      }),
    });

    const data = await response.json();
    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        provider: provider.name,
        status: "ERROR",
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

    return {
      provider: provider.name,
      status: "OK",
      latency,
      content: extractContent(data),
      tokens: data?.usage?.total_tokens || 0,
      error: null,
    };
  } catch (error) {
    return {
      provider: provider.name,
      status: "ERROR",
      latency: Date.now() - start,
      content: null,
      tokens: 0,
      error: error.message || "Erreur inconnue",
    };
  }
}

function displayResult(result) {
  const icon = result.status === "OK" ? "✅" : "❌";
  const provider = result.provider.padEnd(12);
  const latency = `${result.latency}ms`;

  console.log(`${icon} ${provider} ${latency}`);

  if (result.status === "ERROR") {
    console.log(`   → ${result.error}`);
  }
}

async function main() {
  console.log("🔎 Vérification des connexions API...\n");

  const results = await Promise.all(providers.map(checkProvider));

  for (const result of results) {
    displayResult(result);
  }

  const okCount = results.filter((r) => r.status === "OK").length;
  const total = results.length;

  console.log(`\n${okCount}/${total} connexions actives\n`);

  if (okCount === total) {
    console.log("Tout est vert. Vous êtes prêts pour la suite !");
  } else {
    console.log("Certaines connexions ont échoué. Vérifiez vos clés ou endpoints.");
  }

  console.log("\n--- Détail des réponses ---\n");

  for (const result of results) {
    console.log(`### ${result.provider}`);

    if (result.status === "OK") {
      console.log(result.content || "Pas de contenu");
      console.log(`Tokens : ${result.tokens}`);
    } else {
      console.log(`Erreur : ${result.error}`);
    }

    console.log("");
  }
}

main();