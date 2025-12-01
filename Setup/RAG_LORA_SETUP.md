# RAG & LoRA Infrastructure Setup

## Overview

This document describes the RAG (Retrieval-Augmented Generation) and LoRA (Low-Rank Adaptation) infrastructure that has been set up for future brand-specific AI features.

---

## Database Tables

### 1. `brand_documents`
Stores uploaded PDFs and documents for each brand.

**Use Cases:**
- Upload brand guidelines PDFs
- Store brand documentation
- Extract brand configuration from documents

**Key Fields:**
- `brand_id` - Brand isolation
- `file_url` - Storage location
- `extracted_data` - JSONB field for extracted brand config (colors, fonts, guidelines)
- `is_indexed` - Whether document has been processed for RAG
- `status` - `pending`, `processing`, `processed`, `failed`

### 2. `document_embeddings`
Vector embeddings for RAG semantic search (1536 dimensions for OpenAI).

**Use Cases:**
- Brand-specific knowledge base
- Semantic search across brand documents
- Context retrieval for AI responses

**Key Fields:**
- `embedding` - Vector(1536) for similarity search
- `content` - Text chunk
- `metadata` - Page number, section, etc.

**Search Function:**
```sql
SELECT * FROM match_brand_documents(
  query_embedding,
  'acme',  -- brand_id
  0.7,     -- similarity threshold
  5        -- result count
);
```

### 3. `brand_assets`
Images, logos, and training data for LoRA models.

**Use Cases:**
- Store brand logos and visual assets
- Collect training images for LoRA
- Organize assets by type and tags

**Key Fields:**
- `asset_type` - `logo`, `image`, `font`, `color_palette`, `training_image`
- `is_training_data` - Flag for LoRA training
- `training_caption` - Caption/prompt for training
- `tags` - Array of tags for organization

### 4. `lora_training_jobs`
Track LoRA model training jobs.

**Use Cases:**
- Train brand-specific image generation models
- Track training progress
- Store trained model weights

**Key Fields:**
- `model_type` - `flux`, `sdxl`, `sd15`, `custom`
- `training_config` - JSONB with training parameters
- `status` - `pending`, `queued`, `training`, `completed`, `failed`
- `model_url` - URL to trained LoRA weights
- `provider` - `replicate`, `runpod`, `custom`

---

## Features Enabled

### ✅ RAG (Retrieval-Augmented Generation)
- **pgvector extension** enabled for vector similarity search
- **Brand-isolated embeddings** - Each brand has its own knowledge base
- **Semantic search** - Find relevant context from brand documents
- **Document chunking** - Automatic text splitting for optimal retrieval

### ✅ PDF Processing Pipeline
- Upload PDFs per brand
- Extract text and metadata
- Chunk and embed content
- Store in brand-specific vector database

### ✅ LoRA Training Infrastructure
- Store training images per brand
- Track training jobs and progress
- Support multiple model types (Flux, SDXL, SD1.5)
- Cost tracking and monitoring

---

## Usage Examples

### 1. Upload and Process a PDF

```typescript
import { processDocument, generateEmbedding } from '@act/auth/rag-utils';

// 1. Upload PDF to Supabase Storage
const { data: file } = await supabase.storage
  .from('brand-documents')
  .upload(`${brandId}/${fileName}`, pdfFile);

// 2. Create document record
const { data: document } = await supabase
  .from('brand_documents')
  .insert({
    brand_id: brandId,
    name: fileName,
    file_url: file.path,
    file_type: 'pdf',
    status: 'processing',
  })
  .select()
  .single();

// 3. Extract text from PDF (use pdf-parse or similar)
const pdfText = await extractTextFromPDF(file.path);

// 4. Process and embed
await processDocument(supabase, document.id, brandId, pdfText);
```

### 2. Search Brand Knowledge Base

```typescript
import { searchBrandDocuments } from '@act/auth/rag-utils';

// Search for relevant context
const results = await searchBrandDocuments(
  supabase,
  'acme',
  'What are our brand colors?',
  0.7,  // similarity threshold
  5     // number of results
);

// Use results as context for AI
const context = results.map(r => r.content).join('\n\n');
const prompt = `Context: ${context}\n\nQuestion: What are our brand colors?`;
```

### 3. Create LoRA Training Job

```typescript
// 1. Upload training images
const trainingImages = await uploadTrainingImages(brandId, images);

// 2. Create training job
const { data: job } = await supabase
  .from('lora_training_jobs')
  .insert({
    brand_id: brandId,
    name: 'ACME Brand Style LoRA',
    model_type: 'flux',
    training_config: {
      steps: 1000,
      learning_rate: 0.0001,
      trigger_word: 'acme_style',
    },
    training_asset_ids: trainingImages.map(img => img.id),
    training_images_count: trainingImages.length,
    status: 'pending',
  })
  .select()
  .single();

// 3. Start training (via Replicate or other provider)
await startLoRATraining(job.id);
```

### 4. Extract Brand Config from PDF

```typescript
// After processing PDF, extract brand guidelines
const { data: document } = await supabase
  .from('brand_documents')
  .select('*')
  .eq('id', documentId)
  .single();

// Use AI to extract structured data
const brandConfig = await extractBrandConfig(document.file_url);

// Store extracted config
await supabase
  .from('brand_documents')
  .update({
    extracted_data: {
      colors: brandConfig.colors,
      fonts: brandConfig.fonts,
      tone: brandConfig.tone,
      guidelines: brandConfig.guidelines,
    },
  })
  .eq('id', documentId);

// Update brand table with extracted config
await supabase
  .from('brands')
  .update({
    primary_color: brandConfig.colors.primary,
    // ... other fields
  })
  .eq('id', brandId);
```

---

## Environment Variables

```bash
# RAG & Document Processing
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
VECTOR_DIMENSIONS=1536

# Already configured
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...
```

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Database schema
- ✅ Vector embeddings
- ✅ Brand isolation
- ✅ Basic utilities

### Phase 2 (Next)
- [ ] PDF upload API route
- [ ] PDF text extraction (pdf-parse)
- [ ] Automatic embedding generation
- [ ] RAG search API endpoint

### Phase 3 (Later)
- [ ] Brand config extraction AI
- [ ] LoRA training integration (Replicate)
- [ ] Training job monitoring
- [ ] Model version management

### Phase 4 (Advanced)
- [ ] Multi-modal embeddings (text + images)
- [ ] Fine-tuned embedding models per brand
- [ ] Advanced chunking strategies
- [ ] Hybrid search (vector + keyword)

---

## Storage Buckets

Create these buckets in Supabase Dashboard → Storage:

```sql
-- Brand documents (PDFs, docs)
INSERT INTO storage.buckets (id, name, public) VALUES
  ('brand-documents', 'brand-documents', false);

-- Brand assets (images, logos)
INSERT INTO storage.buckets (id, name, public) VALUES
  ('brand-assets', 'brand-assets', true);

-- Training data (for LoRA)
INSERT INTO storage.buckets (id, name, public) VALUES
  ('training-data', 'training-data', false);
```

---

## RLS Policies

All tables have brand-isolated RLS policies:
- Users can only access data from their brands
- Admins can manage brand documents and assets
- Complete data isolation between brands

---

## Cost Considerations

### OpenAI Embeddings
- text-embedding-3-small: $0.00002 per 1K tokens
- 1000 pages ≈ $0.20-$0.50

### LoRA Training (Replicate)
- Flux LoRA: ~$0.50-$2.00 per training
- SDXL LoRA: ~$0.30-$1.00 per training
- Training time: 10-30 minutes

---

## Next Steps

1. **Test the infrastructure** - Upload a sample PDF
2. **Create API routes** - Build PDF upload endpoint
3. **Integrate with frontend** - Add upload UI
4. **Test RAG search** - Query brand knowledge base
5. **Plan LoRA integration** - Design training workflow

---

**Status:** Infrastructure ready, awaiting implementation  
**Created:** December 1, 2025  
**Version:** 1.0
