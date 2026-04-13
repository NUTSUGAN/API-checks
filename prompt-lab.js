import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const PROMPT =
  "Explique ce qu'est un cookie HTTP à un débutant en une phrase.";

const TEMPERATURES = [0, 0.5, 1];

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

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item?.text || item)
      .join("")
      .trim();
  }

  return "Pas de contenu";
}

function shorten(text, max = 70) {
  if (!text) return "";

  return text.length > max
    ? text.slice(0, max) + "..."
    : text;
}

async function callProvider(provider, prompt, temperature) {
  if (!provider.key) {
    return {
      provider: provider.name,
      temperature,
      content: null,
      error: "Clé API manquante",
    };
  }

  try {
    const safeTemperature =
      provider.name === "HuggingFace" && temperature === 0
        ? 0.01
        : temperature;

    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.key}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: safeTemperature,
        max_tokens: 80,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        provider: provider.name,
        temperature,
        content: null,
        error:
          data?.error?.message ||
          data?.error ||
          data?.message ||
          `HTTP ${response.status}`,
      };
    }

    return {
      provider: provider.name,
      temperature,
      content: extractContent(data),
      error: null,
    };
  } catch (error) {
    return {
      provider: provider.name,
      temperature,
      content: null,
      error: error.message,
    };
  }
}

async function main() {
  const jobs = providers.flatMap((provider) =>
    TEMPERATURES.map((temp) =>
      callProvider(provider, PROMPT, temp)
    )
  );

  const results = await Promise.all(jobs);

  console.log(`\nPrompt : "${PROMPT}"\n`);

  for (const result of results) {
    const provider = result.provider.padEnd(12);
    const temp = result.temperature.toFixed(1);

    if (result.error) {
      console.log(
        `${provider} | temp ${temp} | ERROR: ${result.error}`
      );
    } else {
      console.log(
        `${provider} | temp ${temp} | ${shorten(result.content)}`
      );
    }
  }
}

main();