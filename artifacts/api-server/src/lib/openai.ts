import OpenAI from "openai";

const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];

if (!baseURL || !apiKey) {
  console.error(
    "[openai] AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY must be set — " +
    "AI calls will fail until these are configured in Vercel environment variables.",
  );
}

export const openai = new OpenAI({
  baseURL: baseURL ?? "https://api.openai.com/v1",
  apiKey: apiKey ?? "placeholder",
});
