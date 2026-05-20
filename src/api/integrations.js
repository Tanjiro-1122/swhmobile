// src/api/integrations.js — OpenAI direct version (Base44 InvokeLLM removed)
// Drop-in replacement: InvokeLLM({ prompt, response_json_schema }) → same interface

export const InvokeLLM = async ({ prompt, response_json_schema, add_context_from_internet = false }) => {
  const messages = [
    {
      role: "system",
      content: "You are a professional sports betting analyst AI. Be accurate, concise, and data-driven."
    },
    { role: "user", content: prompt }
  ];

  const body = {
    model: "gpt-4o-mini",
    messages,
    max_tokens: 1500,
    temperature: 0.4,
  };

  if (response_json_schema) {
    body.response_format = { type: "json_object" };
  }

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "";

  if (response_json_schema) {
    try { return JSON.parse(content); } catch { return {}; }
  }
  return content;
};

// Stubs for unused integrations — kept for import compatibility
export const SendEmail = async () => { console.warn("SendEmail: use /api/emailLogin or a backend route"); };
export const GenerateImage = async () => { console.warn("GenerateImage: not implemented"); };
export const UploadFile = async () => { console.warn("UploadFile: not implemented"); };
export const ExtractDataFromUploadedFile = async () => { console.warn("ExtractDataFromUploadedFile: not implemented"); };

export const Core = {
  InvokeLLM,
  SendEmail,
  GenerateImage,
  UploadFile,
  ExtractDataFromUploadedFile,
};
