/**
 * n8n Workflow Automation Utilities
 * 
 * Helper functions for triggering and managing n8n workflows
 * per brand in the monorepo.
 */

const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_BASE_URL = process.env.N8N_BASE_URL;

interface N8nWorkflowTriggerOptions {
  workflowId: string;
  data: Record<string, any>;
  webhookUrl?: string;
}

interface N8nWorkflowResponse {
  success: boolean;
  executionId?: string;
  data?: any;
  error?: string;
}

/**
 * Trigger an n8n workflow via webhook
 */
export async function triggerN8nWorkflow(
  options: N8nWorkflowTriggerOptions
): Promise<N8nWorkflowResponse> {
  const { workflowId, data, webhookUrl } = options;

  try {
    const url = webhookUrl || `${N8N_BASE_URL}/webhook/${workflowId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY && { 'X-N8N-API-KEY': N8N_API_KEY }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`n8n workflow trigger failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      executionId: result.executionId,
      data: result,
    };
  } catch (error) {
    console.error('Error triggering n8n workflow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get workflow execution status from n8n
 */
export async function getN8nExecutionStatus(
  executionId: string
): Promise<N8nWorkflowResponse> {
  try {
    const response = await fetch(
      `${N8N_BASE_URL}/api/v1/executions/${executionId}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get execution status: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error getting n8n execution status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Brand-specific workflow trigger with automatic brand context
 */
export async function triggerBrandWorkflow(
  brandId: string,
  workflowType: string,
  data: Record<string, any>
): Promise<N8nWorkflowResponse> {
  // Add brand context to workflow data
  const workflowData = {
    ...data,
    brand_id: brandId,
    timestamp: new Date().toISOString(),
  };

  // In a real implementation, you would:
  // 1. Look up the workflow_id from the database based on brand_id and workflow_type
  // 2. Get the webhook_url from the database
  // 3. Trigger the workflow

  // For now, this is a placeholder
  return triggerN8nWorkflow({
    workflowId: workflowType,
    data: workflowData,
  });
}

/**
 * Common workflow triggers for brand operations
 */

export async function triggerContentGenerationWorkflow(
  brandId: string,
  contentType: string,
  prompt: string,
  metadata?: Record<string, any>
) {
  return triggerBrandWorkflow(brandId, 'content_generation', {
    content_type: contentType,
    prompt,
    metadata,
  });
}

export async function triggerBrandAnalysisWorkflow(
  brandId: string,
  analysisType: string,
  data: Record<string, any>
) {
  return triggerBrandWorkflow(brandId, 'brand_analysis', {
    analysis_type: analysisType,
    data,
  });
}

export async function triggerSocialPostingWorkflow(
  brandId: string,
  platforms: string[],
  content: string,
  media?: string[]
) {
  return triggerBrandWorkflow(brandId, 'social_posting', {
    platforms,
    content,
    media,
  });
}

export async function triggerEmailCampaignWorkflow(
  brandId: string,
  campaignType: string,
  recipients: string[],
  template: string,
  data: Record<string, any>
) {
  return triggerBrandWorkflow(brandId, 'email_campaign', {
    campaign_type: campaignType,
    recipients,
    template,
    data,
  });
}

/**
 * Webhook handler for n8n callbacks
 * Use this in your API routes to handle n8n webhook responses
 */
export function createN8nWebhookHandler(
  onSuccess: (data: any) => void | Promise<void>,
  onError?: (error: any) => void | Promise<void>
) {
  return async (request: Request) => {
    try {
      const data = await request.json();

      // Verify webhook authenticity (optional)
      // const signature = request.headers.get('x-n8n-signature');
      // Add signature verification logic here if needed

      await onSuccess(data);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('n8n webhook handler error:', error);
      if (onError) {
        await onError(error);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
