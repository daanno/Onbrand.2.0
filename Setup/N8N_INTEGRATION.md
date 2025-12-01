# n8n Workflow Automation Integration

## Overview

This document describes the n8n integration for brand-specific workflow automation in the ACT 2.0 monorepo.

---

## Features

### ✅ Brand-Isolated Workflows
- Each brand can have its own n8n workflows
- Complete data isolation via RLS
- Track workflow executions per brand

### ✅ Workflow Types Supported
- **Content Generation** - AI-powered content creation
- **Brand Analysis** - Analyze brand performance and sentiment
- **Social Posting** - Automated social media posting
- **Email Campaigns** - Triggered email sequences
- **Data Processing** - Process and transform brand data
- **Custom** - Any custom workflow

### ✅ Execution Tracking
- Log all workflow executions
- Track success/failure rates
- Monitor execution duration
- Store input/output data

---

## Database Tables

### 1. `n8n_workflows`
Store brand-specific workflow configurations.

**Key Fields:**
- `brand_id` - Brand isolation
- `workflow_id` - n8n workflow ID
- `webhook_url` - Webhook endpoint for triggering
- `workflow_type` - Type of workflow
- `is_active` - Enable/disable workflows
- `trigger_count` - Number of times triggered

### 2. `n8n_workflow_executions`
Log all workflow executions.

**Key Fields:**
- `workflow_id` - Reference to workflow
- `n8n_execution_id` - n8n's execution ID
- `status` - `running`, `success`, `error`, `waiting`, `canceled`
- `input_data` - Input sent to workflow
- `output_data` - Output from workflow
- `duration_ms` - Execution time

---

## Environment Variables

```bash
# n8n Workflow Automation
N8N_API_KEY=your_n8n_api_key_here
N8N_BASE_URL=https://your-instance.n8n.cloud
N8N_WEBHOOK_URL=https://your-instance.n8n.cloud/webhook
```

**Get your n8n credentials:**
1. Go to your n8n instance
2. Settings → API Keys
3. Create a new API key
4. Copy the key and base URL

---

## Usage Examples

### 1. Trigger a Workflow

```typescript
import { triggerN8nWorkflow } from '@act/auth/n8n-utils';

// Trigger workflow via webhook
const result = await triggerN8nWorkflow({
  workflowId: 'content-generator',
  data: {
    brand_id: 'acme',
    content_type: 'blog_post',
    topic: 'AI in Marketing',
    tone: 'professional',
  },
});

if (result.success) {
  console.log('Workflow triggered:', result.executionId);
} else {
  console.error('Error:', result.error);
}
```

### 2. Content Generation Workflow

```typescript
import { triggerContentGenerationWorkflow } from '@act/auth/n8n-utils';

// Generate content for a brand
const result = await triggerContentGenerationWorkflow(
  'acme',
  'social_post',
  'Create a LinkedIn post about our new product launch',
  {
    platform: 'linkedin',
    max_length: 300,
    include_hashtags: true,
  }
);
```

### 3. Brand Analysis Workflow

```typescript
import { triggerBrandAnalysisWorkflow } from '@act/auth/n8n-utils';

// Analyze brand sentiment
const result = await triggerBrandAnalysisWorkflow(
  'acme',
  'sentiment_analysis',
  {
    sources: ['twitter', 'reddit', 'news'],
    date_range: 'last_7_days',
  }
);
```

### 4. Social Media Posting

```typescript
import { triggerSocialPostingWorkflow } from '@act/auth/n8n-utils';

// Post to multiple platforms
const result = await triggerSocialPostingWorkflow(
  'acme',
  ['twitter', 'linkedin', 'facebook'],
  'Excited to announce our new product! 🚀',
  ['https://example.com/image.jpg']
);
```

### 5. Email Campaign

```typescript
import { triggerEmailCampaignWorkflow } from '@act/auth/n8n-utils';

// Send welcome email campaign
const result = await triggerEmailCampaignWorkflow(
  'acme',
  'welcome_series',
  ['user1@example.com', 'user2@example.com'],
  'welcome_email_template',
  {
    user_name: 'John Doe',
    company: 'ACME Labs',
  }
);
```

---

## n8n Workflow Setup

### 1. Create Workflow in n8n

1. Log into your n8n instance
2. Create a new workflow
3. Add a **Webhook** trigger node
4. Configure webhook:
   - Method: `POST`
   - Path: `/brand-workflow`
   - Response Mode: `On Received`

### 2. Add Brand Context

In your workflow, access brand data:

```javascript
// In n8n Function node
const brandId = $json.brand_id;
const data = $json.data;

// Fetch brand config from Supabase
const brandConfig = await fetch(
  `https://pyvobennsmzyvtaceopn.supabase.co/rest/v1/brands?id=eq.${brandId}`,
  {
    headers: {
      'apikey': 'YOUR_SUPABASE_ANON_KEY',
      'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
    }
  }
).then(r => r.json());

return { brandId, brandConfig, data };
```

### 3. Register Workflow in Database

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Register workflow
const { data: workflow } = await supabase
  .from('n8n_workflows')
  .insert({
    brand_id: 'acme',
    workflow_id: 'content-generator',
    workflow_name: 'Content Generator',
    description: 'Generate brand-specific content',
    webhook_url: 'https://your-n8n.cloud/webhook/content-generator',
    workflow_type: 'content_generation',
    is_active: true,
  })
  .select()
  .single();
```

---

## Webhook Callbacks

### Receive n8n Callbacks

The webhook endpoint at `/api/n8n/webhook` handles callbacks from n8n:

```typescript
// n8n sends callback when workflow completes
POST /api/n8n/webhook

{
  "workflow_id": "content-generator",
  "execution_id": "12345",
  "brand_id": "acme",
  "status": "success",
  "output": {
    "generated_content": "...",
    "metadata": { ... }
  }
}
```

### Custom Webhook Handler

```typescript
import { createN8nWebhookHandler } from '@act/auth/n8n-utils';

export async function POST(request: Request) {
  const handler = createN8nWebhookHandler(
    async (data) => {
      // Handle successful workflow completion
      console.log('Workflow completed:', data);
      
      // Store results in database
      await saveWorkflowResults(data);
      
      // Notify user
      await notifyUser(data.brand_id, data.output);
    },
    async (error) => {
      // Handle errors
      console.error('Workflow error:', error);
      await logError(error);
    }
  );

  return handler(request);
}
```

---

## Common Workflow Patterns

### 1. Content Generation Pipeline

```
Trigger → Fetch Brand Guidelines → Generate Content → Review → Publish
```

**n8n Nodes:**
1. Webhook (trigger)
2. HTTP Request (fetch brand data from Supabase)
3. OpenAI (generate content)
4. Function (format content)
5. HTTP Request (save to database)
6. Webhook Response

### 2. Brand Monitoring

```
Schedule → Fetch Social Mentions → Analyze Sentiment → Alert if Negative
```

**n8n Nodes:**
1. Cron (schedule)
2. HTTP Request (fetch mentions)
3. OpenAI (sentiment analysis)
4. IF (check sentiment)
5. Email/Slack (alert)

### 3. Multi-Platform Publishing

```
Trigger → Format for Each Platform → Post to All → Track Results
```

**n8n Nodes:**
1. Webhook (trigger)
2. Function (format content)
3. Twitter/LinkedIn/Facebook nodes
4. HTTP Request (log results)

---

## Best Practices

### 1. **Brand Isolation**
Always include `brand_id` in workflow data:
```typescript
const data = {
  brand_id: 'acme',
  // ... other data
};
```

### 2. **Error Handling**
Implement proper error handling in workflows:
```javascript
// In n8n Function node
try {
  // Your workflow logic
} catch (error) {
  return {
    success: false,
    error: error.message,
    brand_id: $json.brand_id
  };
}
```

### 3. **Logging**
Log all executions for debugging:
```typescript
await supabase.from('n8n_workflow_executions').insert({
  workflow_id,
  brand_id,
  status: 'success',
  input_data: inputData,
  output_data: outputData,
});
```

### 4. **Rate Limiting**
Implement rate limiting for API-heavy workflows:
```javascript
// In n8n, add delay between API calls
await new Promise(resolve => setTimeout(resolve, 1000));
```

---

## Monitoring & Analytics

### Track Workflow Performance

```typescript
// Get workflow statistics
const { data: stats } = await supabase
  .from('n8n_workflow_executions')
  .select('status, duration_ms')
  .eq('workflow_id', workflowId)
  .gte('started_at', '2025-01-01');

// Calculate metrics
const successRate = stats.filter(s => s.status === 'success').length / stats.length;
const avgDuration = stats.reduce((sum, s) => sum + s.duration_ms, 0) / stats.length;
```

### Monitor Failed Executions

```typescript
// Get recent failures
const { data: failures } = await supabase
  .from('n8n_workflow_executions')
  .select('*')
  .eq('status', 'error')
  .order('started_at', { ascending: false })
  .limit(10);
```

---

## Security

### 1. **API Key Protection**
- Never expose n8n API keys in client-side code
- Use environment variables
- Rotate keys regularly

### 2. **Webhook Verification**
Verify webhook authenticity:
```typescript
const signature = request.headers.get('x-n8n-signature');
// Verify signature matches expected value
```

### 3. **RLS Enforcement**
All workflow data is protected by RLS:
- Users can only access workflows from their brands
- Admins can manage brand workflows
- Service role required for webhook handling

---

## Troubleshooting

### Issue: Workflow not triggering

**Check:**
1. Webhook URL is correct
2. n8n workflow is active
3. API key is valid
4. Network connectivity

### Issue: Execution fails

**Check:**
1. Input data format
2. n8n workflow logs
3. API rate limits
4. Error messages in execution logs

### Issue: Callback not received

**Check:**
1. Webhook endpoint is accessible
2. n8n has correct callback URL
3. Firewall/security settings

---

## Next Steps

1. **Create your first workflow** in n8n
2. **Register it** in the database
3. **Test triggering** from your app
4. **Monitor executions** in the dashboard
5. **Build more workflows** for your brands

---

**Status:** Ready for integration  
**Created:** December 1, 2025  
**Version:** 1.0
