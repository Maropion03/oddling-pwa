import "server-only";

import { z } from "zod";
import { MUTATION_TOKENS } from "@/lib/domain/engine";
import type { Avatar, DailyQuestion, TraitKey } from "@/lib/domain/types";

const traitKeySchema = z.enum(["energy", "softness", "order", "social", "oddness"]);

const flavorSchema = z.object({
  responseText: z.string().trim().min(1).max(42),
  stickerTitle: z.string().trim().min(1).max(10),
  mutationSlot: z.enum(["head", "back", "texture", "handheld"]),
  mutationToken: z.string().trim().min(1).max(32),
  traitDelta: z.record(traitKeySchema, z.number().int().min(-5).max(5)).refine(
    (value) => Object.keys(value).length <= 2,
    "at most two traits may change",
  ),
});

export type AiFlavor = z.infer<typeof flavorSchema>;

export async function generateAiFlavor(options: {
  avatar: Avatar;
  question: DailyQuestion;
  answer: string;
}): Promise<AiFlavor | null> {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;
  if (!apiKey || !baseUrl || !model) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.75,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "你是怪可爱数字分身。只输出 JSON：responseText、stickerTitle、traitDelta、mutationSlot、mutationToken。回应不超过42字，不诊断、不羞辱、不威胁；traitDelta最多两个键，每项-5到5；变异必须从允许列表选择。",
          },
          {
            role: "user",
            content: JSON.stringify({
              traits: options.avatar.traits,
              question: options.question.prompt,
              answer: options.answer,
              allowedTraitKeys: ["energy", "softness", "order", "social", "oddness"] satisfies TraitKey[],
              allowedMutations: MUTATION_TOKENS,
            }),
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return null;
    return flavorSchema.parse(JSON.parse(content));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
