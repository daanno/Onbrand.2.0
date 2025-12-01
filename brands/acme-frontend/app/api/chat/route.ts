import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, brandId } = await req.json();

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages,
      system: `You are a helpful AI assistant for brand management. 
      Brand ID: ${brandId || "default"}
      Always provide helpful, accurate, and brand-appropriate responses.`,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

