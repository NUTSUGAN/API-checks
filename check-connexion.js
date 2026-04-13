import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const isVerbose = process.argv.includes("--verbose");

const PROMPT = isVerbose
  ? "Donne-moi la capitale de la France en un mot."
  : "Dis juste ok";

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
    model: "meta-llama/Llama-3.1-8B-Instruct",
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
        if (item?.type === "text") return item.text || "";
        return "";
      })
      .join("")
      .trim();
  }

  const fallback =
    data?.choices?.[0]?.text ||
    data?.output?.[0]?.content?.[0]?.text ||
    data?.content?.[0]?.text;

  if (typeof fallback === "string" && fallback.trim()) {
    return fallback.trim();
  }

  return null;
}

function shortAnswer(text) {
  if (!text) return "";

  return text
    .replace(/\s+/g, " ")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .slice(0, 40);
}

async function checkProvider(provider) {
  if (!provider.key) {
    return {
      provider: provider.name,
      status: "ERROR",
      latency: 0,
      answer: null,
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
        temperature: 0,
        max_tokens: 20,
      }),
    });

    const data = await response.json();
    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        provider: provider.name,
        status: "ERROR",
        latency,
        answer: null,
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
      status: "OK",
      latency,
      answer: shortAnswer(content),
      error: null,
    };
  } catch (error) {
    return {
      provider: provider.name,
      status: "ERROR",
      latency: Date.now() - start,
      answer: null,
      error: error.message || "Erreur inconnue",
    };
  }
}

async function checkPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    return {
      provider: "Pinecone",
      status: "ERROR",
      latency: 0,
      answer: null,
      error: "Clé API manquante",
    };
  }

  const start = Date.now();

  try {
    const response = await fetch("https://api.pinecone.io/indexes", {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "X-Pinecone-API-Version": "2024-07",
      },
    });

    const latency = Date.now() - start;
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        provider: "Pinecone",
        status: "ERROR",
        latency,
        answer: null,
        error:
          data?.error?.message ||
          data?.error ||
          data?.message ||
          `HTTP ${response.status}`,
      };
    }

    return {
      provider: "Pinecone",
      status: "OK",
      latency,
      answer: isVerbose ? "indexes OK" : null,
      error: null,
    };
  } catch (error) {
    return {
      provider: "Pinecone",
      status: "ERROR",
      latency: Date.now() - start,
      answer: null,
      error: error.message || "Erreur inconnue",
    };
  }
}

function displayResult(result) {
  const icon = result.status === "OK" ? "✅" : "❌";
  const provider = result.provider.padEnd(12);
  const latency = `${result.latency}ms`.padEnd(8);

  let line = `${icon} ${provider} ${latency}`;

  if (isVerbose && result.answer) {
    line += ` → "${result.answer}"`;
  }

  console.log(line);

  if (result.status === "ERROR") {
    console.log(`   ${result.error}`);
  }
}

async function main() {
  console.log("🔎 Vérification des connexions API...\n");

  const llmResults = await Promise.all(providers.map(checkProvider));
  const pineconeResult = await checkPinecone();

  const results = [...llmResults, pineconeResult];

  for (const result of results) {
    displayResult(result);
  }

  const okCount = results.filter((r) => r.status === "OK").length;
  const total = results.length;

  console.log(`\n${okCount}/${total} connexions actives\n`);

  if (okCount === total) {
    console.log("Tout est vert. Vous êtes prêts pour la suite !");
  } else {
    console.log("Certaines connexions ont échoué. Vérifiez vos clés/API.");
  }
}

main();