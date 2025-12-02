/**
 * TypeScript types for conversations and messages
 */

export type AIModel = 
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku';

export type MessageRole = 'system' | 'user' | 'assistant' | 'function';

export interface ConversationSettings {
  temperature: number;
  max_tokens: number;
  top_p: number;
  [key: string]: any;
}

export interface Conversation {
  id: string;
  brand_id: string;
  user_id: string;
  title: string;
  model: AIModel;
  system_prompt?: string;
  settings: ConversationSettings;
  total_tokens_used: number;
  total_cost_usd: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tokens_used: number;
  model: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CreateConversationParams {
  brand_id: string;
  user_id: string;
  title: string;
  model?: AIModel;
  system_prompt?: string;
  settings?: ConversationSettings;
}

export interface AddMessageParams {
  conversation_id: string;
  role: MessageRole;
  content: string;
  tokens_used: number;
  model: string;
  metadata?: Record<string, any>;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ConversationListOptions {
  brand_id: string;
  user_id?: string;
  archived?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'updated_at' | 'last_message_at';
  sort_order?: 'asc' | 'desc';
}

export interface ConversationStats {
  total_conversations: number;
  total_messages: number;
  total_tokens_used: number;
  total_cost_usd: number;
  active_conversations: number;
  archived_conversations: number;
}
