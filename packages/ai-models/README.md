# @act/ai-models

AI model training and inference package for brand-specific LoRA models.

## Features

- ✅ Brand-isolated model training
- ✅ Flux, SDXL, SD1.5 support
- ✅ Replicate/RunPod integration
- ✅ Training data management
- ✅ Model versioning
- ✅ Inference API

## Architecture

### Brand Isolation

All models and training data are isolated by `brand_id`:

```typescript
// Training data path
training-data/{brand_id}/image-001.jpg

// Model path
models/{brand_id}/flux-lora-v1.safetensors

// Generated content
generated-content/{brand_id}/output-001.jpg
```

### Database Schema

```sql
-- Training images
brand_assets (brand_id, file_url, training_caption)

-- Training jobs
lora_training_jobs (brand_id, model_url, status)
```

### RLS Policies

- Users can ONLY access their brand's data
- Automatic filtering at database level
- Impossible to cross-brand contamination

## Usage

### Upload Training Data

```typescript
import { uploadTrainingImages } from '@act/ai-models';

const images = await uploadTrainingImages({
  brandId: 'creativetechnologists',
  files: imageFiles,
  captions: ['photo of [brand] logo', 'photo of [brand] product'],
});
```

### Start Training Job

```typescript
import { createTrainingJob } from '@act/ai-models';

const job = await createTrainingJob({
  brandId: 'creativetechnologists',
  modelType: 'flux',
  trainingAssetIds: images.map(img => img.id),
  config: {
    steps: 1000,
    learningRate: 0.0001,
    batchSize: 4,
  },
});
```

### Monitor Training

```typescript
import { getTrainingJob } from '@act/ai-models';

const job = await getTrainingJob(jobId);
console.log(job.status); // 'training'
console.log(job.progress); // 45
```

### Generate with Trained Model

```typescript
import { generateImage } from '@act/ai-models';

const image = await generateImage({
  brandId: 'creativetechnologists',
  modelId: 'flux-lora-v1',
  prompt: 'photo of [brand] logo on a billboard',
  numImages: 4,
});
```

## Model Storage Structure

```
Storage Buckets:
├── training-data/
│   └── {brand_id}/
│       └── {filename}
│
├── models/
│   └── {brand_id}/
│       ├── {model_name}-v1.safetensors
│       └── {model_name}-v2.safetensors
│
└── generated-content/
    └── {brand_id}/
        └── {timestamp}-{uuid}.jpg
```

## Brand Isolation Examples

### Creative Technologists

```typescript
brandId: 'creativetechnologists'

Training Data:
- training-data/creativetechnologists/logo-001.jpg
- training-data/creativetechnologists/photo-001.jpg

Models:
- models/creativetechnologists/flux-lora-v1.safetensors

Generated:
- generated-content/creativetechnologists/output-001.jpg
```

### Acme Company

```typescript
brandId: 'acmecompany'

Training Data:
- training-data/acmecompany/logo-001.png
- training-data/acmecompany/product-001.jpg

Models:
- models/acmecompany/sdxl-lora-v1.safetensors

Generated:
- generated-content/acmecompany/output-001.jpg
```

**No cross-contamination! Each brand's data is completely isolated.**

## API Reference

### Training

- `uploadTrainingImages(params)` - Upload images for training
- `createTrainingJob(params)` - Start a new training job
- `getTrainingJob(jobId)` - Get job status
- `cancelTrainingJob(jobId)` - Cancel running job
- `deleteTrainingJob(jobId)` - Delete completed job

### Inference

- `generateImage(params)` - Generate images with brand LoRA
- `listBrandModels(brandId)` - List available models
- `downloadModel(modelId)` - Download model weights

### Storage

- `getTrainingDataUrl(brandId, filename)` - Get signed URL
- `getModelUrl(brandId, modelName)` - Get model URL
- `cleanupOldGenerations(brandId, days)` - Cleanup old outputs

## RLS Policy Reference

### Training Data Access

```sql
-- Users can only access their brand's training data
(storage.foldername(name))[1] IN (
  SELECT brand_id FROM brand_users WHERE user_id = auth.uid()
)
```

### Model Access

```sql
-- Users can only access their brand's models
brand_id IN (
  SELECT brand_id FROM brand_users WHERE user_id = auth.uid()
)
```

## Security

✅ All access controlled by RLS policies
✅ Brand isolation at storage level
✅ Brand isolation at database level
✅ Users can't access other brands' models
✅ Users can't access other brands' training data

## Integration

### With Frontend

```typescript
// In brands/act-frontend/app/training/page.tsx
import { createTrainingJob } from '@act/ai-models';
import { getBrandFromUser } from '@act/tenant-config';

const brand = await getBrandFromUser();
const job = await createTrainingJob({
  brandId: brand.id,
  // ...
});
```

### With N8N Workflows

```typescript
// In n8n workflow
const { startTraining } = require('@act/ai-models');

// Triggered when user uploads 20+ images
await startTraining({
  brandId: workflow.brandId,
  autoDetectFromAssets: true,
});
```

## Future Enhancements

- [ ] Multi-model ensembles per brand
- [ ] Model versioning and rollback
- [ ] A/B testing between model versions
- [ ] Automatic retraining schedules
- [ ] Model quality metrics
- [ ] Cost optimization per brand
