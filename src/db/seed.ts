import { pathToFileURL } from "node:url";
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { getDb } from "./index";
import { models, phases, providers } from "./schema";

config({ path: ".env.local" });

const PHASE_DATA = [
  {
    name: "sdd-explore",
    responsibility: "Exploración",
    description:
      "Investigación inicial, análisis del problema, exploración de soluciones posibles.",
    slug: "sdd-explore",
  },
  {
    name: "sdd-propose",
    responsibility: "Propuesta",
    description:
      "Redacción de la propuesta de cambio con intent, scope y approach.",
    slug: "sdd-propose",
  },
  {
    name: "sdd-spec",
    responsibility: "Especificación",
    description:
      "Definición de requirements y scenarios en formato Given/When/Then.",
    slug: "sdd-spec",
  },
  {
    name: "sdd-design",
    responsibility: "Diseño Técnico",
    description:
      "Decisiones de arquitectura, diagramas, contratos de interfaces.",
    slug: "sdd-design",
  },
  {
    name: "sdd-tasks",
    responsibility: "Planificación de Tareas",
    description:
      "Desglose del cambio en tasks implementables con numeración jerárquica.",
    slug: "sdd-tasks",
  },
  {
    name: "sdd-apply",
    responsibility: "Implementación",
    description:
      "Escritura del código real siguiendo specs y design. El agente más capaz aquí.",
    slug: "sdd-apply",
  },
  {
    name: "sdd-verify",
    responsibility: "Verificación",
    description:
      "Validación de que el código cumple las specs — auditoría y testing.",
    slug: "sdd-verify",
  },
  {
    name: "sdd-archive",
    responsibility: "Archivo",
    description:
      "Sincronización de delta specs a main specs y cierre del cambio.",
    slug: "sdd-archive",
  },
  {
    name: "sdd-init",
    responsibility: "Inicialización",
    description: "Bootstrap del contexto SDD en un proyecto nuevo.",
    slug: "sdd-init",
  },
  {
    name: "sdd-onboard",
    responsibility: "Onboarding",
    description: "Guía end-to-end del workflow SDD para nuevos colaboradores.",
    slug: "sdd-onboard",
  },
];

const PROVIDER_DATA = [
  { name: "OpenAI Plus", slug: "openai-plus" },
  { name: "OpenAI Pro (x5)", slug: "openai-pro-x5" },
  { name: "OpenAI Pro (x10)", slug: "openai-pro-x10" },
  { name: "Anthropic Pro", slug: "anthropic-pro" },
  { name: "Anthropic Max (x5)", slug: "anthropic-max-x5" },
  { name: "Anthropic Max (x10)", slug: "anthropic-max-x10" },
  { name: "OpenCode Go", slug: "opencode-go" },
  { name: "OpenCode Zen", slug: "opencode-zen" },
  { name: "OpenRouter (Free)", slug: "openrouter-free" },
  { name: "OpenRouter (PAYG)", slug: "openrouter-payg" },
];

const OPENAI_MODELS = [
  "GPT-5.4",
  "GPT-5.4 Fast",
  "GPT-5.4 mini",
  "GPT-5.4 mini Fast",
  "GPT-5.5",
  "GPT-5.5 Fast",
  "GPT-5.5 Pro",
];

const ANTHROPIC_MODELS = [
  "Claude Opus 4.6",
  "Claude Opus 4.7",
  "Claude Opus 4.8",
  "Claude Sonnet 4.6",
  "Claude Haiku 4.5",
];

const OPENCODE_GO_MODELS = [
  "DeepSeek V4 Flash",
  "DeepSeek V4 Pro",
  "GLM-5",
  "GLM-5.1",
  "Kimi K2.5",
  "Kimi K2.6",
  "MiMo V2.5",
  "MiMo V2.5 Pro",
  "MiniMax M2.5",
  "MiniMax M2.7",
  "MiniMax M3",
  "Qwen3.6 Plus",
  "Qwen3.7 Max",
  "Qwen3.7 Plus",
];

const OPENCODE_ZEN_MODELS = [
  "DeepSeek V4 Flash Free",
  "MiMo V2.5 Free",
  "Nemotron 3 Ultra Free",
  "North Mini Code Free",
];

const OPENROUTER_FREE_MODELS = [
  "Free Models Router",
  "GLM 4.5 Air (free)",
  "Gemma 4 26B A4B (free)",
  "Gemma 4 31B (free)",
  "Hermes 3 405B Instruct (free)",
  "Kimi K2.6 (free)",
  "LFM2.5-1.2B-Instruct (free)",
  "LFM2.5-1.2B-Thinking (free)",
  "Laguna M.1 (free)",
  "Laguna XS.2 (free)",
  "Llama 3.2 3B Instruct (free)",
  "Llama 3.3 70B Instruct (free)",
  "Nemotron 3 Nano 30B A3B (free)",
  "Nemotron 3 Nano Omni (free)",
  "Nemotron 3 Super (free)",
  "Nemotron 3 Ultra (free)",
  "Nemotron 3.5 Content Safety (free)",
  "Nemotron Nano 12B 2 VL (free)",
  "Nemotron Nano 9B V2 (free)",
  "Nex-N2-Pro (free)",
  "Qwen3 Coder 480B A35B (free)",
  "Qwen3 Next 80B A3B Instruct (free)",
  "Uncensored (free)",
  "gpt-oss-120b (free)",
  "gpt-oss-20b (free)",
];

const OPENROUTER_PAYG_MODELS = [
  "Aion-1.0",
  "Aion-1.0-Mini",
  "Aion-2.0",
  "Aion-RP 1.0 (8B)",
  "Anthropic Claude Haiku Latest",
  "Anthropic Claude Sonnet Latest",
  "Auto Router",
  "Body Builder (beta)",
  "Claude 3 Haiku",
  "Claude 3.5 Haiku",
  "Claude Haiku 4.5 (latest)",
  "Claude Opus 4",
  "Claude Opus 4.1 (latest)",
  "Claude Opus 4.5 (latest)",
  "Claude Opus 4.6",
  "Claude Opus 4.6 (Fast)",
  "Claude Opus 4.7",
  "Claude Opus 4.7 (Fast)",
  "Claude Opus 4.8",
  "Claude Opus 4.8 (Fast)",
  "Claude Opus Latest",
  "Claude Sonnet 4",
  "Claude Sonnet 4.5 (latest)",
  "Claude Sonnet 4.6",
  "Coder Large",
  "Codestral 2508",
  "Cogito v2.1 671B",
  "Command A",
  "Command R",
  "Command R+",
  "Command R7B",
  "Cydonia 24B V4.1",
  "DeepSeek Chat",
  "DeepSeek V3 0324",
  "DeepSeek V3.1",
  "DeepSeek V3.1 Terminus",
  "DeepSeek V3.2",
  "DeepSeek V3.2 Exp",
  "DeepSeek V4 Flash",
  "DeepSeek-R1",
  "ERNIE 4.5 VL 424B A47B",
  "Fusion",
  "GLM 4 32B",
  "GLM-4.5",
  "GLM-4.5-Air",
  "GLM-4.5V",
  "GLM-4.6",
  "GLM-4.6V",
  "GLM-4.7",
  "GLM-4.7-Flash",
  "GLM-5",
  "GLM-5-Turbo",
  "GLM-5.1",
  "GLM-5V-Turbo",
  "GPT Audio",
  "GPT Audio Mini",
  "GPT Chat Latest",
  "GPT-3.5 Turbo (older v0613)",
  "GPT-3.5 Turbo 16K",
  "GPT-3.5 Turbo Instruct",
  "GPT-3.5-turbo",
  "GPT-4",
  "GPT-4 Turbo",
  "GPT-4 Turbo Preview",
  "GPT-4.1",
  "GPT-4.1 mini",
  "GPT-4.1 nano",
  "GPT-4o",
  "GPT-4o (2024-05-13)",
  "GPT-4o (2024-08-06)",
  "GPT-4o (2024-11-20)",
  "GPT-4o Search Preview",
  "GPT-4o mini",
  "GPT-4o-mini (2024-07-18)",
  "GPT-4o-mini Search Preview",
  "GPT-5",
  "GPT-5 Image",
  "GPT-5 Image Mini",
  "GPT-5 Mini",
  "GPT-5 Nano",
  "GPT-5 Pro",
  "GPT-5-Codex",
  "GPT-5.1",
  "GPT-5.1 Chat",
  "GPT-5.1 Codex",
  "GPT-5.1 Codex Max",
  "GPT-5.1 Codex mini",
  "GPT-5.2",
  "GPT-5.2 Chat",
  "GPT-5.2 Codex",
  "GPT-5.2 Pro",
  "GPT-5.3 Chat",
  "GPT-5.3 Codex",
  "GPT-5.4",
  "GPT-5.4 Pro",
  "GPT-5.4 mini",
  "GPT-5.4 nano",
  "GPT-5.5",
  "GPT-5.5 Pro",
  "Gemini 2.5 Flash",
  "Gemini 2.5 Flash Lite Preview 09-2025",
  "Gemini 2.5 Flash-Lite",
  "Gemini 2.5 Pro",
  "Gemini 2.5 Pro Preview 05-06",
  "Gemini 2.5 Pro Preview 06-05",
  "Gemini 3 Flash Preview",
  "Gemini 3.1 Flash Lite",
  "Gemini 3.1 Flash Lite Preview",
  "Gemini 3.1 Pro Preview",
  "Gemini 3.1 Pro Preview Custom Tools",
  "Gemini 3.5 Flash",
  "Gemma 2 27B",
  "Gemma 3 12B",
  "Gemma 3 27B",
  "Gemma 3 4B",
  "Gemma 3n 4B",
  "Gemma 4 26B A4B IT",
  "Gemma 4 31B IT",
  "Google Gemini Flash Latest",
  "Google Gemini Pro Latest",
  "Granite 4.0 Micro",
  "Granite 4.1 8B",
  "Grok 4.20",
  "Grok 4.20 Multi-Agent",
  "Grok 4.3",
  "Grok Build 0.1",
  "Hermes 3 405B Instruct",
  "Hermes 3 70B Instruct",
  "Hermes 4 405B",
  "Hermes 4 70B",
  "Hunyuan A13B Instruct",
  "Hy3 preview",
  "INTELLECT-3",
  "Inflection 3 Pi",
  "Inflection 3 Productivity",
  "Jamba Large 1.7",
  "KAT-Coder-Pro V2",
  "Kimi K2 0711",
  "Kimi K2 0905",
  "Kimi K2 Thinking",
  "Kimi K2.5",
  "Kimi K2.6",
  "LFM2-24B-A2B",
  "Ling-2.6-1T",
  "Ling-2.6-flash",
  "Llama 3 70B Instruct",
  "Llama 3 8B Instruct",
  "Llama 3 8B Lunaris",
  "Llama 3.1 70B Hanami x1",
  "Llama 3.1 70B Instruct",
  "Llama 3.1 8B Instruct",
  "Llama 3.1 Euryale 70B v2.2",
  "Llama 3.2 11B Vision Instruct",
  "Llama 3.2 1B Instruct",
  "Llama 3.2 3B Instruct",
  "Llama 3.3 Euryale 70B",
  "Llama 3.3 Nemotron Super 49B v1.5",
  "Llama 4 Maverick",
  "Llama 4 Scout",
  "Llama Guard 3 8B",
  "Llama Guard 4 12B",
  "Llama-3.3-70B-Instruct",
  "Lyria 3 Clip Preview",
  "Lyria 3 Pro Preview",
  "Maestro Reasoning",
  "Magnum v4 72B",
  "Mercury 2",
  "MiMo-V2-Flash",
  "MiMo-V2.5",
  "MiMo-V2.5-Pro",
  "MiniMax M1",
  "MiniMax M2-her",
  "MiniMax-01",
  "MiniMax-M2",
  "MiniMax-M2.1",
  "MiniMax-M2.5",
  "MiniMax-M2.7",
  "MiniMax-M3",
  "Ministral 3 14B 2512",
  "Ministral 3 3B 2512",
  "Ministral 3 8B 2512",
  "Mistral Large",
  "Mistral Large 2407",
  "Mistral Large 3",
  "Mistral Medium 3",
  "Mistral Medium 3.1",
  "Mistral Medium 3.5",
  "Mistral Nemo",
  "Mistral Small 3",
  "Mistral Small 3.1 24B",
  "Mistral Small 3.2 24B",
  "Mistral Small 4",
  "Mixtral 8x22B Instruct",
  "MoonshotAI Kimi Latest",
  "Morph V3 Fast",
  "Morph V3 Large",
  "MythoMax 13B",
  "Nano Banana",
  "Nano Banana 2",
  "Nano Banana Pro",
  "Nemotron 3 Nano 30B A3B",
  "Nemotron 3 Super 120B A12B",
  "Nemotron 3 Ultra 550B A55B",
  "Nova 2 Lite",
  "Nova Lite 1.0",
  "Nova Micro 1.0",
  "Nova Premier 1.0",
  "Nova Pro 1.0",
  "Olmo 3 32B Think",
  "OpenAI GPT Latest",
  "OpenAI GPT Mini Latest",
  "Palmyra X5",
  "Pareto Code Router",
  "Perceptron Mk1",
  "Phi 4",
  "Phi 4 Mini Instruct",
  "Qwen Plus",
  "Qwen Plus 0728",
  "Qwen Plus 0728 (thinking)",
  "Qwen2.5 72B Instruct",
  "Qwen2.5 7B Instruct",
  "Qwen2.5 Coder 32B Instruct",
  "Qwen2.5 VL 72B Instruct",
  "Qwen3 14B",
  "Qwen3 235B A22B Instruct 2507",
  "Qwen3 235B A22B Thinking 2507",
  "Qwen3 235B-A22B",
  "Qwen3 30B A3B",
  "Qwen3 30B A3B Instruct 2507",
  "Qwen3 30B A3B Thinking 2507",
  "Qwen3 32B",
  "Qwen3 8B",
  "Qwen3 Coder 480B A35B",
  "Qwen3 Coder Flash",
  "Qwen3 Coder Next",
  "Qwen3 Coder Plus",
  "Qwen3 Max",
  "Qwen3 Max Thinking",
  "Qwen3 VL 235B A22B Instruct",
  "Qwen3 VL 235B A22B Thinking",
  "Qwen3 VL 30B A3B Instruct",
  "Qwen3 VL 30B A3B Thinking",
  "Qwen3 VL 8B Instruct",
  "Qwen3 VL 8B Thinking",
  "Qwen3-Coder 30B-A3B Instruct",
  "Qwen3-Next 80B-A3B (Thinking)",
  "Qwen3-Next 80B-A3B Instruct",
  "Qwen3.5 122B-A10B",
  "Qwen3.5 27B",
  "Qwen3.5 35B-A3B",
  "Qwen3.5 397B-A17B",
  "Qwen3.5 Plus 2026-02-15",
  "Qwen3.5 Plus 2026-04-20",
  "Qwen3.5-9B",
  "Qwen3.5-Flash",
  "Qwen3.6 27B",
  "Qwen3.6 35B-A3B",
  "Qwen3.6 Flash",
  "Qwen3.6 Max Preview",
  "Qwen3.6 Plus",
  "Qwen3.7 Max",
  "Qwen3.7 Plus",
  "R1 0528",
  "R1 Distill Llama 70B",
  "R1 Distill Qwen 32B",
  "ReMM SLERP 13B",
  "Reka Edge",
  "Reka Flash 3",
  "Relace Apply 3",
  "Relace Search",
  "Ring-2.6-1T",
  "Rnj 1 Instruct",
  "Rocinante 12B",
  "Saba",
  "Seed 1.6",
  "Seed 1.6 Flash",
  "Seed-2.0-Lite",
  "Seed-2.0-Mini",
  "Skyfall 36B V2",
  "Solar Pro 3",
  "Sonar",
  "Sonar Deep Research",
  "Sonar Pro",
  "Sonar Pro Search",
  "Sonar Reasoning Pro",
  "Step 3.5 Flash",
  "Step 3.7 Flash",
  "Switchpoint Router",
  "Trinity Large Thinking",
  "Trinity Mini",
  "UI-TARS 7B",
  "UnslopNemo 12B",
  "Virtuoso Large",
  "Voxtral Small 24B 2507",
  "Weaver (alpha)",
  "WizardLM-2 8x22B",
  "gpt-oss-120b",
  "gpt-oss-20b",
  "gpt-oss-safeguard-20b",
  "o1",
  "o1-pro",
  "o3",
  "o3 Mini High",
  "o3-deep-research",
  "o3-mini",
  "o3-pro",
  "o4 Mini High",
  "o4-mini",
  "o4-mini-deep-research",
];

const unique = (items: string[]) => [...new Set(items)];

const MODEL_DATA: Record<string, string[]> = {
  "openai-plus": OPENAI_MODELS,
  "openai-pro-x5": OPENAI_MODELS,
  "openai-pro-x10": OPENAI_MODELS,
  "anthropic-pro": ANTHROPIC_MODELS,
  "anthropic-max-x5": ANTHROPIC_MODELS,
  "anthropic-max-x10": ANTHROPIC_MODELS,
  "opencode-go": OPENCODE_GO_MODELS,
  "opencode-zen": OPENCODE_ZEN_MODELS,
  "openrouter-free": unique(OPENROUTER_FREE_MODELS),
  "openrouter-payg": unique(OPENROUTER_PAYG_MODELS),
};

export async function seed() {
  // Seed providers (idempotent)
  for (const p of PROVIDER_DATA) {
    const existing = await getDb()
      .select()
      .from(providers)
      .where(eq(providers.slug, p.slug))
      .limit(1);
    if (existing.length === 0) {
      await getDb().insert(providers).values(p);
    }
  }

  // Seed phases (idempotent)
  for (const ph of PHASE_DATA) {
    const existing = await getDb()
      .select()
      .from(phases)
      .where(eq(phases.slug, ph.slug))
      .limit(1);
    if (existing.length === 0) {
      await getDb().insert(phases).values(ph);
    }
  }

  // Seed models (idempotent)
  const allProviders = await getDb().select().from(providers);
  for (const [slug, modelNames] of Object.entries(MODEL_DATA)) {
    const provider = allProviders.find((p) => p.slug === slug);
    if (!provider) continue;
    for (const name of modelNames) {
      const existing = await getDb()
        .select()
        .from(models)
        .where(and(eq(models.name, name), eq(models.providerId, provider.id)))
        .limit(1);
      if (existing.length === 0) {
        await getDb().insert(models).values({ name, providerId: provider.id });
      }
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed()
    .then(() => {
      console.log("Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed", error);
      process.exit(1);
    });
}
