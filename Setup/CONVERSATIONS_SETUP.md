# AI Conversations Storage System

Complete system for storing and managing AI chat conversations with automatic quota tracking.

---

## 🎯 Features

- ✅ **Multi-brand isolation** - Each brand's conversations are separate
- ✅ **Automatic quota deduction** - Tokens deducted on message creation
- ✅ **Token tracking** - Per-conversation and per-message usage
- ✅ **Cost tracking** - USD cost per conversation
- ✅ **Multiple AI models** - GPT-4, Claude, etc.
- ✅ **Conversation history** - Full message history
- ✅ **Archive support** - Archive old conversations
- ✅ **Search & filter** - Find conversations by title
- ✅ **Statistics** - Usage analytics per brand
- ✅ **Row Level Security** - Brand isolation enforced at DB level

---

## 📊 Database Schema

### **conversations** Table

Stores chat sessions:

```sql
- id: UUID (primary key)
- brand_id: TEXT (references brands)
- user_id: UUID (references auth.users)
- title: TEXT (conversation title)
- model: TEXT (gpt-4, claude-3-opus, etc.)
- system_prompt: TEXT (optional custom system prompt)
- settings: JSONB (temperature, max_tokens, etc.)
- total_tokens_used: INTEGER (running total)
- total_cost_usd: DECIMAL (running cost)
- archived: BOOLEAN (archive status)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- last_message_at: TIMESTAMP
```

**Indexes:**
- `brand_id` - Fast brand filtering
- `user_id` - Fast user filtering
- `brand_id, user_id` - Combined lookup
- `last_message_at DESC` - Recent conversations
- `archived` - Active conversations only

### **messages** Table

Stores individual messages:

```sql
- id: UUID (primary key)
- conversation_id: UUID (references conversations)
- role: TEXT (system, user, assistant, function)
- content: TEXT (message content)
- tokens_used: INTEGER (tokens for this message)
- model: TEXT (model used for this message)
- metadata: JSONB (extra data, streaming info, etc.)
- created_at: TIMESTAMP
```

**Indexes:**
- `conversation_id` - Fast message retrieval
- `created_at` - Chronological ordering
- `role` - Filter by role

---

## 🔧 Database Functions

### **create_conversation_with_quota_check()**

Creates a conversation with initial quota validation.

```sql
create_conversation_with_quota_check(
  p_brand_id TEXT,
  p_user_id UUID,
  p_title TEXT,
  p_model TEXT DEFAULT 'gpt-4',
  p_system_prompt TEXT DEFAULT NULL,
  p_settings JSONB DEFAULT NULL
) RETURNS UUID
```

**Usage:**
```typescript
const { data: conversationId } = await supabase.rpc(
  'create_conversation_with_quota_check',
  {
    p_brand_id: 'act',
    p_user_id: userId,
    p_title: 'New Chat',
    p_model: 'gpt-4',
    p_system_prompt: 'You are a helpful assistant',
    p_settings: { temperature: 0.7, max_tokens: 2000 }
  }
);
```

### **add_message_with_quota()**

Adds a message and automatically deducts quota.

```sql
add_message_with_quota(
  p_conversation_id UUID,
  p_role TEXT,
  p_content TEXT,
  p_tokens_used INTEGER,
  p_model TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
```

**Usage:**
```typescript
const { data: messageId } = await supabase.rpc(
  'add_message_with_quota',
  {
    p_conversation_id: conversationId,
    p_role: 'assistant',
    p_content: 'Hello! How can I help?',
    p_tokens_used: 150,
    p_model: 'gpt-4'
  }
);
```

**Important:** Only deducts quota for `assistant` role messages!

---

## 🛠️ TypeScript Utilities

### Import

```typescript
import {
  // Types
  Conversation,
  Message,
  AIModel,
  MessageRole,
  ConversationSettings,
  
  // Functions
  createConversation,
  addMessage,
  getConversation,
  getConversationWithMessages,
  listConversations,
  updateConversation,
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  getMessages,
  getConversationStats,
  searchConversations,
} from '@act/auth';
```

### Create a Conversation

```typescript
const { conversation, error } = await createConversation(supabase, {
  brand_id: 'act',
  user_id: userId,
  title: 'Marketing Strategy Chat',
  model: 'gpt-4',
  system_prompt: 'You are a marketing expert',
  settings: {
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 1.0
  }
});

if (error) {
  console.error('Failed to create conversation:', error);
}
```

### Add Messages

```typescript
// User message (no quota deduction)
const { message: userMsg } = await addMessage(supabase, {
  conversation_id: conversationId,
  role: 'user',
  content: 'What are the best marketing channels?',
  tokens_used: 20,
  model: 'gpt-4'
});

// Assistant message (quota deducted automatically)
const { message: assistantMsg, error } = await addMessage(supabase, {
  conversation_id: conversationId,
  role: 'assistant',
  content: 'The best marketing channels depend on...',
  tokens_used: 150,
  model: 'gpt-4'
});

if (error) {
  console.error('Quota exceeded or error:', error);
}
```

### Get Conversation with Messages

```typescript
const { conversation, error } = await getConversationWithMessages(
  supabase,
  conversationId
);

if (conversation) {
  console.log(`Title: ${conversation.title}`);
  console.log(`Messages: ${conversation.messages.length}`);
  console.log(`Tokens: ${conversation.total_tokens_used}`);
  
  conversation.messages.forEach(msg => {
    console.log(`${msg.role}: ${msg.content}`);
  });
}
```

### List Conversations

```typescript
const { conversations, error } = await listConversations(supabase, {
  brand_id: 'act',
  user_id: userId,
  archived: false,
  limit: 20,
  sort_by: 'last_message_at',
  sort_order: 'desc'
});
```

### Archive/Unarchive

```typescript
// Archive
await archiveConversation(supabase, conversationId);

// Unarchive
await unarchiveConversation(supabase, conversationId);
```

### Delete Conversation

```typescript
const { success, error } = await deleteConversation(supabase, conversationId);
```

**Note:** Deletes all messages via CASCADE.

### Get Statistics

```typescript
const { stats, error } = await getConversationStats(supabase, 'act');

console.log(`Total conversations: ${stats.total_conversations}`);
console.log(`Total messages: ${stats.total_messages}`);
console.log(`Total tokens: ${stats.total_tokens_used}`);
console.log(`Total cost: $${stats.total_cost_usd}`);
console.log(`Active: ${stats.active_conversations}`);
console.log(`Archived: ${stats.archived_conversations}`);
```

### Search Conversations

```typescript
const { conversations } = await searchConversations(
  supabase,
  'act',
  'marketing',
  20
);
```

---

## 🔒 Security (RLS Policies)

### Conversations

- ✅ **SELECT**: Users can view conversations from their brands
- ✅ **INSERT**: Users can create conversations in their brands
- ✅ **UPDATE**: Users can update their own conversations
- ✅ **DELETE**: Users can delete their own conversations

### Messages

- ✅ **SELECT**: Users can view messages from conversations in their brands
- ✅ **INSERT**: Users can create messages in their brand conversations
- ✅ **UPDATE**: Users can update messages in their conversations
- ✅ **DELETE**: Users can delete messages in their conversations

**Brand isolation is enforced at the database level!**

---

## 🚀 Usage Examples

### Complete Chat Flow

```typescript
import { createConversation, addMessage, getConversationWithMessages } from '@act/auth';

// 1. Create conversation
const { conversation } = await createConversation(supabase, {
  brand_id: 'act',
  user_id: userId,
  title: 'Content Strategy Discussion',
  model: 'gpt-4',
  system_prompt: 'You are a content strategist'
});

const conversationId = conversation!.id;

// 2. Add user message
await addMessage(supabase, {
  conversation_id: conversationId,
  role: 'user',
  content: 'Help me plan a content calendar',
  tokens_used: 15,
  model: 'gpt-4'
});

// 3. Add assistant response (quota deducted)
await addMessage(supabase, {
  conversation_id: conversationId,
  role: 'assistant',
  content: 'I can help you create a content calendar...',
  tokens_used: 200,
  model: 'gpt-4'
});

// 4. Get full conversation
const { conversation: fullConv } = await getConversationWithMessages(
  supabase,
  conversationId
);

console.log(`Used ${fullConv.total_tokens_used} tokens`);
```

### Dashboard Stats

```typescript
// Get conversation stats for dashboard
const { stats } = await getConversationStats(supabase, brandId);

return (
  <div>
    <h2>Conversation Stats</h2>
    <p>Total Chats: {stats.total_conversations}</p>
    <p>Total Messages: {stats.total_messages}</p>
    <p>Tokens Used: {stats.total_tokens_used.toLocaleString()}</p>
    <p>Cost: ${stats.total_cost_usd.toFixed(2)}</p>
  </div>
);
```

### Conversation List UI

```typescript
// Get recent conversations
const { conversations } = await listConversations(supabase, {
  brand_id: brandId,
  user_id: userId,
  archived: false,
  limit: 10,
  sort_by: 'last_message_at',
  sort_order: 'desc'
});

return (
  <ul>
    {conversations.map(conv => (
      <li key={conv.id}>
        <h3>{conv.title}</h3>
        <p>Model: {conv.model}</p>
        <p>Tokens: {conv.total_tokens_used}</p>
        <p>Last: {new Date(conv.last_message_at).toLocaleString()}</p>
      </li>
    ))}
  </ul>
);
```

---

## 🎨 Integration with Chat UI

### Real-time Chat Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createConversation, addMessage, getMessages } from '@act/auth';

export function ChatInterface({ brandId, userId }) {
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // Create conversation on mount
  useEffect(() => {
    async function init() {
      const { conversation } = await createConversation(supabase, {
        brand_id: brandId,
        user_id: userId,
        title: 'New Chat',
        model: 'gpt-4'
      });
      setConversationId(conversation!.id);
    }
    init();
  }, []);

  const sendMessage = async () => {
    if (!conversationId || !input) return;

    // Add user message
    await addMessage(supabase, {
      conversation_id: conversationId,
      role: 'user',
      content: input,
      tokens_used: estimateTokens(input),
      model: 'gpt-4'
    });

    // Call your AI API here...
    const response = await callOpenAI(input);

    // Add assistant message (quota deducted)
    await addMessage(supabase, {
      conversation_id: conversationId,
      role: 'assistant',
      content: response.content,
      tokens_used: response.tokens,
      model: 'gpt-4'
    });

    // Refresh messages
    const { messages: updated } = await getMessages(supabase, conversationId);
    setMessages(updated);
    setInput('');
  };

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={input} 
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
      />
    </div>
  );
}
```

---

## 📈 Quota Integration

### Automatic Deduction

Quota is **automatically deducted** when you add an `assistant` message:

```typescript
// This deducts 150 tokens from brand quota
await addMessage(supabase, {
  conversation_id: conversationId,
  role: 'assistant',
  content: '...',
  tokens_used: 150,  // ← Deducted from brand_quotas
  model: 'gpt-4'
});
```

### Check Before Sending

```typescript
import { checkQuota } from '@act/auth';

// Check if brand has enough tokens
const { hasQuota } = await checkQuota(supabase, brandId, 'prompt_tokens', 1000);

if (!hasQuota) {
  alert('Not enough tokens! Please contact admin for top-up.');
  return;
}

// Proceed with chat...
```

---

## 🧪 Testing

### Create Test Conversation

```bash
# Via Supabase SQL Editor
SELECT create_conversation_with_quota_check(
  'act',
  'user-uuid-here',
  'Test Chat',
  'gpt-4',
  'You are a test assistant',
  '{"temperature": 0.7, "max_tokens": 2000}'::jsonb
);
```

### Add Test Message

```bash
SELECT add_message_with_quota(
  'conversation-uuid-here',
  'assistant',
  'Hello! This is a test message.',
  50,
  'gpt-4',
  '{}'::jsonb
);
```

### Check Data

```sql
-- View conversations
SELECT * FROM conversations WHERE brand_id = 'act';

-- View messages
SELECT * FROM messages WHERE conversation_id = 'conversation-uuid';

-- Check quota deduction
SELECT * FROM quota_transactions 
WHERE brand_id = 'act' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📦 Migration Applied

✅ **Migration:** `20251202130100_create_conversations.sql`
✅ **Tables:** `conversations`, `messages`
✅ **Functions:** `create_conversation_with_quota_check`, `add_message_with_quota`
✅ **Triggers:** Auto-update timestamps and token totals
✅ **RLS:** Full brand isolation
✅ **Indexes:** Optimized for performance

---

## 🎯 What's Next?

Now that the backend is ready:

1. **Build Chat UI** - Create the frontend chat interface
2. **Integrate AI APIs** - Connect to OpenAI/Anthropic
3. **Add Streaming** - Real-time message streaming
4. **Context Management** - Link RAG documents to conversations
5. **Conversation Templates** - Pre-defined conversation starters
6. **Export Conversations** - Download as PDF/JSON

---

**Your conversation storage system is production-ready! 🚀**
