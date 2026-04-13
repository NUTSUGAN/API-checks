function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function estimateCost(text, label = "Texte") {
  const tokens = estimateTokens(text);

  const pricing = [
    { provider: "Mistral Small", pricePerMillion: 0.2 },
    { provider: "Groq Llama 3", pricePerMillion: 0.05 },
    { provider: "GPT-4o", pricePerMillion: 2.5 },
  ];

  console.log(`${label} : ${text.length} caractères → ~${tokens} tokens\n`);

  console.log("Provider         Coût estimé (input)   Pour 1000 requêtes");
  console.log("-----------------------------------------------------------");

  for (const item of pricing) {
    const cost = (tokens / 1_000_000) * item.pricePerMillion;
    const cost1000 = cost * 1000;

    console.log(
      `${item.provider.padEnd(16)} ${(`${cost.toFixed(8)}€`).padEnd(22)} ${cost1000.toFixed(5)}€`
    );
  }
}

const text =
  "Explique le concept de récursion à un lycéen, en 3 phrases maximum.";

estimateCost(text, "Texte");