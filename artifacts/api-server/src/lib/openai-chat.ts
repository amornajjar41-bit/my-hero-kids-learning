import OpenAI from "openai";

const apiKey = process.env["OPENAI_API_KEY"];

if (!apiKey) {
  console.error(
    "[openai-chat] OPENAI_API_KEY must be set — " +
    "chat calls will fail until this is configured in Vercel environment variables.",
  );
}

export const openaiChat = new OpenAI({ apiKey: apiKey ?? "placeholder" });
