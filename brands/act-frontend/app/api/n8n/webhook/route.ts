// @ts-nocheck - Avoid OpenAI initialization issues
import { createN8nWebhookHandler } from '@act/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

// Tell Next.js this is a dynamic API route
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const runtime = 'nodejs';

// Check if Supabase environment variables are available
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Only create client if keys are available
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are missing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

/**
 * n8n Webhook Handler
 * 
 * Receives callbacks from n8n workflows and logs execution results
 */
export async function POST(request: NextRequest) {
  const handler = createN8nWebhookHandler(
    async (data) => {
      // Log workflow execution
      const { workflow_id, execution_id, status, brand_id, output } = data;

      if (workflow_id && brand_id) {
        // Create Supabase client on demand
        const supabase = createSupabaseClient();
        
        // Find the workflow record
        const { data: workflow } = await supabase
          .from('n8n_workflows')
          .select('id')
          .eq('workflow_id', workflow_id)
          .eq('brand_id', brand_id)
          .single();

        if (workflow) {
          // Log execution
          await supabase.from('n8n_workflow_executions').insert({
            workflow_id: workflow.id,
            brand_id,
            n8n_execution_id: execution_id,
            status: status || 'success',
            output_data: output,
            finished_at: new Date().toISOString(),
          });

          // Update workflow trigger count
          await supabase.rpc('increment_workflow_trigger_count', {
            workflow_id: workflow.id,
          });
        }
      }

      console.log('n8n workflow completed:', data);
    },
    async (error) => {
      console.error('n8n webhook error:', error);
    }
  );

  return handler(request);
}

/**
 * GET handler for webhook verification (optional)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'n8n webhook endpoint is active',
  });
}
