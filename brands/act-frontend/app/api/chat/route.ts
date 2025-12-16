import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { type NextRequest } from 'next/server';

// Tell Next.js this is a dynamic API route
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Use edge runtime for streaming
export const runtime = "edge";

// Available models with their display names and provider info
const MODELS = {
  // Claude models
  'claude-4.5': { provider: 'anthropic', modelId: 'claude-sonnet-4-5', name: 'Claude 4.5' },
  'claude-3-sonnet': { provider: 'anthropic', modelId: 'claude-sonnet-4-5', name: 'Claude 4.5' },
  
  // GPT models
  'gpt-5.2': { provider: 'openai', modelId: 'gpt-4o', name: 'GPT 5.2' },
  'gpt-4o': { provider: 'openai', modelId: 'gpt-4o', name: 'GPT 4o' },
  'gpt-4o-mini': { provider: 'openai', modelId: 'gpt-4o-mini', name: 'GPT 4o Mini' },
  
  // Gemini models
  'gemini-3.1': { provider: 'google', modelId: 'gemini-2.0-flash', name: 'Gemini 3.1' },
  'gemini-pro': { provider: 'google', modelId: 'gemini-1.5-pro', name: 'Gemini Pro' },
} as const;

type ModelKey = keyof typeof MODELS;

// Get the AI model instance based on provider
function getModel(modelKey: string) {
  const modelConfig = MODELS[modelKey as ModelKey] || MODELS['claude-4.5'];
  
  switch (modelConfig.provider) {
    case 'anthropic':
      return anthropic(modelConfig.modelId);
    case 'openai':
      return openai(modelConfig.modelId);
    case 'google':
      return google(modelConfig.modelId);
    default:
      return anthropic('claude-sonnet-4-5');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // AI SDK 5 useChat sends messages in a different format
    const { 
      conversationId,
      brandId, 
      messages = [],
      model = 'claude-sonnet-4-5',
      systemPrompt 
    } = body;

    // Log for debugging
    console.log('Chat API received:', { brandId, model, messageCount: messages?.length });

    // Validate brand access (in production, verify user has access to this brand)
    if (!brandId) {
      return new Response(
        JSON.stringify({ error: 'Brand ID is required', received: Object.keys(body) }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required', received: body }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build the system prompt with brand context
    const defaultSystemPrompt = `You are a helpful AI assistant for brand management.
You are assisting with brand: ${brandId}
Always provide helpful, accurate, and brand-appropriate responses.
Be concise but thorough. Use markdown formatting when appropriate.`;

    const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

    // Get the AI model based on the model key
    const aiModel = getModel(model);
    console.log('Using model:', model);

    // Extract content from messages - handle both old format (content) and new format (parts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizedMessages = messages.map((m: any) => {
      let content = m.content;
      
      // If content is not a string, try to extract from parts (AI SDK 5 format)
      if (!content && m.parts) {
        content = m.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('');
      }
      
      return {
        role: m.role as 'user' | 'assistant' | 'system',
        content: content || '',
      };
    }).filter((m: any) => m.content); // Remove empty messages

    const result = streamText({
      model: aiModel,
      messages: normalizedMessages,
      system: finalSystemPrompt,
      maxTokens: 2000,
      temperature: 0.7,
    });

    // Return streaming response (AI SDK 5 uses toUIMessageStreamResponse for chat UI)
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    
    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('api_key')) {
        return new Response(
          JSON.stringify({ error: 'Anthropic API key not configured' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

