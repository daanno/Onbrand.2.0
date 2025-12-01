-- Update ACME brand to ACT
UPDATE public.brands 
SET 
  id = 'act',
  name = 'act',
  display_name = 'ACT'
WHERE id = 'acme';

-- Update any existing brand_users references (if any exist)
UPDATE public.brand_users 
SET brand_id = 'act' 
WHERE brand_id = 'acme';

-- Update any existing content references (if any exist)
UPDATE public.content 
SET brand_id = 'act' 
WHERE brand_id = 'acme';

-- Update any existing document references (if any exist)
UPDATE public.brand_documents 
SET brand_id = 'act' 
WHERE brand_id = 'acme';

-- Update any existing embeddings references (if any exist)
UPDATE public.document_embeddings 
SET brand_id = 'act' 
WHERE brand_id = 'acme';

-- Update any existing assets references (if any exist)
UPDATE public.brand_assets 
SET brand_id = 'act' 
WHERE brand_id = 'acme';

-- Update any existing LoRA training jobs references (if any exist)
UPDATE public.lora_training_jobs 
SET brand_id = 'act' 
WHERE brand_id = 'acme';

-- Update any existing n8n workflows references (if any exist)
UPDATE public.n8n_workflows 
SET brand_id = 'act' 
WHERE brand_id = 'acme';

-- Update any existing n8n workflow executions references (if any exist)
UPDATE public.n8n_workflow_executions 
SET brand_id = 'act' 
WHERE brand_id = 'acme';
