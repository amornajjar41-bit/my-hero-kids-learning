import OpenAI from "openai";

const apiKey = process.env["OPENAI_API_KEY"];

if (!apiKey) {
  throw new Error("OPENAI_API_KEY must be set");
}

export const openaiChat = new OpenAI({ apiKey });
