# Model Bucketing Architecture

Complete guide to how AI models are isolated by brand in the monorepo.

## 🎯 Overview

Every brand gets:
- ✅ Own training data storage
- ✅ Own trained models
- ✅ Own generated content
- ✅ Complete data isolation
- ✅ RLS-enforced security

**Key Principle:** Models and data are bucketed by `brand_id` at every level.

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    BRAND: creativetechnologists              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Upload Training Data                               │
│  ─────────────────────────────────────────────────────────  │
│  User uploads images via frontend                           │
│  ↓                                                           │
│  Files → training-data/creativetechnologists/               │
│         ├── logo-001.jpg                                    │
│         ├── product-001.jpg                                 │
│         └── photo-001.jpg                                   │
│  ↓                                                           │
│  Database → brand_assets table                              │
│         ├── brand_id: "creativetechnologists"               │
│         ├── file_url: "training-data/.../logo-001.jpg"      │
│         └── training_caption: "photo of [brand] logo"       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Create Training Job                                │
│  ─────────────────────────────────────────────────────────  │
│  Database → lora_training_jobs table                        │
│         ├── brand_id: "creativetechnologists"               │
│         ├── model_type: "flux"                              │
│         ├── training_asset_ids: [uuid1, uuid2, uuid3]       │
│         ├── status: "pending"                               │
│         └── provider: "replicate"                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Train Model (External Provider)                    │
│  ─────────────────────────────────────────────────────────  │
│  Replicate/RunPod fetches images                            │
│  ↓                                                           │
│  Training happens (GPU cluster)                             │
│  ↓                                                           │
│  Model weights generated                                    │
│         └── flux-lora-creativetechnologists.safetensors     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Save Trained Model                                 │
│  ─────────────────────────────────────────────────────────  │
│  Model → models/creativetechnologists/                      │
│         └── flux-lora-v1.safetensors                        │
│  ↓                                                           │
│  Database → lora_training_jobs (update)                     │
│         ├── status: "completed"                             │
│         └── model_url: "models/.../flux-lora-v1.safetensors"│
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Generate with Model                                │
│  ─────────────────────────────────────────────────────────  │
│  User generates images with brand LoRA                      │
│  ↓                                                           │
│  Load model: models/creativetechnologists/flux-lora-v1      │
│  ↓                                                           │
│  Generate images                                            │
│  ↓                                                           │
│  Save → generated-content/creativetechnologists/            │
│         ├── 2024-12-04-001.jpg                              │
│         └── 2024-12-04-002.jpg                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Storage Structure

### Complete Bucket Organization

```
Supabase Storage:

training-data/                        ← Bucket: Training images
├── creativetechnologists/
│   ├── logo-001.jpg
│   ├── logo-002.jpg
│   └── product-001.jpg
├── acmecompany/
│   ├── logo-001.png
│   └── team-photo.jpg
└── techstartup/
    └── brand-colors.jpg

models/                               ← Bucket: Trained models (create this)
├── creativetechnologists/
│   ├── flux-lora-v1.safetensors
│   ├── flux-lora-v2.safetensors
│   └── sdxl-lora-v1.safetensors
├── acmecompany/
│   └── flux-lora-v1.safetensors
└── techstartup/
    └── sd15-lora-v1.safetensors

generated-content/                    ← Bucket: AI outputs
├── creativetechnologists/
│   ├── 2024-12-04-001.jpg
│   ├── 2024-12-04-002.jpg
│   └── samples/
│       ├── sample-001.jpg
│       └── sample-002.jpg
├── acmecompany/
│   └── 2024-12-03-001.jpg
└── techstartup/
    └── ...

brand-documents/                      ← Bucket: RAG docs
├── creativetechnologists/
│   ├── brand-guidelines.pdf
│   └── voice-tone.md
└── acmecompany/
    └── style-guide.pdf
```

---

## 🔐 RLS Policy Matrix

| Resource | Create | Read | Update | Delete |
|----------|--------|------|--------|--------|
| **Training Data** | ✅ Users (own brand) | ✅ Users (own brand) | ❌ No one | ✅ Admins (own brand) |
| **Training Jobs** | ✅ Users (own brand) | ✅ Users (own brand) | ✅ Job owner | ✅ Admins (own brand) |
| **Models** | 🤖 System only | ✅ Users (own brand) | ❌ No one | ✅ Admins (own brand) |
| **Generated Content** | 🤖 System only | ✅ Users (own brand) | ❌ No one | ✅ Users (own files) |

### RLS Policy Examples

```sql
-- Training Data: Users can only see their brand's data
CREATE POLICY "Users can view training data"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'training-data' AND
  (storage.foldername(name))[1] IN (
    SELECT brand_id FROM brand_users WHERE user_id = auth.uid()
  )
);

-- Training Jobs: Users can only see their brand's jobs
CREATE POLICY "Users can view training jobs from their brands"
ON lora_training_jobs FOR SELECT
USING (
  brand_id IN (
    SELECT brand_id FROM brand_users WHERE user_id = auth.uid()
  )
);

-- Models: RLS on storage objects
CREATE POLICY "Users can view brand models"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'models' AND
  (storage.foldername(name))[1] IN (
    SELECT brand_id FROM brand_users WHERE user_id = auth.uid()
  )
);
```

---

## 📦 Monorepo Package Structure

```
Onbrand.2.0/
├── packages/
│   ├── ai-models/                    ← NEW: AI model package
│   │   ├── src/
│   │   │   ├── training/
│   │   │   │   ├── flux-trainer.ts
│   │   │   │   ├── sdxl-trainer.ts
│   │   │   │   ├── replicate-client.ts
│   │   │   │   └── training-config.ts
│   │   │   ├── inference/
│   │   │   │   ├── image-generator.ts
│   │   │   │   ├── model-loader.ts
│   │   │   │   └── prompt-builder.ts
│   │   │   ├── storage/
│   │   │   │   ├── upload-training-data.ts
│   │   │   │   ├── download-model.ts
│   │   │   │   └── storage-paths.ts
│   │   │   ├── database/
│   │   │   │   ├── training-jobs.ts
│   │   │   │   ├── brand-assets.ts
│   │   │   │   └── queries.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── auth/
│   ├── tenant-config/
│   └── ui/
│
├── brands/
│   └── act-frontend/
│       └── app/
│           ├── training/              ← Training UI
│           │   ├── upload/
│           │   ├── jobs/
│           │   └── monitor/
│           └── generate/              ← Generation UI
│               ├── new/
│               └── gallery/
│
└── supabase/
    └── migrations/
        ├── ...create_brand_assets.sql
        ├── ...create_lora_training_jobs.sql
        └── ...create_storage_buckets.sql
```

---

## 💾 Database Schema

### brand_assets

```sql
CREATE TABLE brand_assets (
  id UUID PRIMARY KEY,
  brand_id TEXT REFERENCES brands(id),  ← ISOLATION KEY
  user_id UUID REFERENCES auth.users(id),
  
  -- File info
  name TEXT,
  asset_type TEXT,  -- 'training_image', 'logo', etc.
  file_url TEXT,    -- storage path
  
  -- Training metadata
  is_training_data BOOLEAN,
  training_caption TEXT,
  training_metadata JSONB,
  
  created_at TIMESTAMPTZ
);
```

### lora_training_jobs

```sql
CREATE TABLE lora_training_jobs (
  id UUID PRIMARY KEY,
  brand_id TEXT REFERENCES brands(id),  ← ISOLATION KEY
  user_id UUID REFERENCES auth.users(id),
  
  -- Job config
  name TEXT,
  model_type TEXT,  -- 'flux', 'sdxl', 'sd15'
  training_config JSONB,
  
  -- Training data
  training_asset_ids UUID[],  -- References brand_assets
  
  -- Status
  status TEXT,  -- 'pending', 'training', 'completed', 'failed'
  progress INTEGER,
  
  -- Results
  model_url TEXT,  -- models/{brand_id}/flux-lora-v1.safetensors
  sample_images_urls TEXT[],
  
  -- Provider
  provider TEXT,  -- 'replicate', 'runpod'
  provider_job_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

---

## 🚀 Usage Examples

### Upload Training Images

```typescript
import { uploadTrainingImages } from '@act/ai-models';

// User is authenticated, brand_id detected from their account
const brand = await getUserBrand(user.id);

const images = await uploadTrainingImages({
  brandId: brand.id,  // "creativetechnologists"
  files: [file1, file2, file3],
  captions: [
    'photo of [brand] logo',
    'photo of [brand] product',
    'photo of [brand] team',
  ],
});

// Files stored in:
// training-data/creativetechnologists/image-001.jpg
// training-data/creativetechnologists/image-002.jpg
// training-data/creativetechnologists/image-003.jpg
```

### Start Training Job

```typescript
import { createTrainingJob } from '@act/ai-models';

const job = await createTrainingJob({
  brandId: brand.id,
  modelType: 'flux',
  trainingAssetIds: images.map(img => img.id),
  config: {
    steps: 1000,
    learningRate: 0.0001,
    triggerWord: '[brand]',
  },
});

// Job created in database:
// lora_training_jobs (brand_id = "creativetechnologists")
```

### Generate with Brand Model

```typescript
import { generateImage } from '@act/ai-models';

const generated = await generateImage({
  brandId: brand.id,
  modelId: 'flux-lora-v1',
  prompt: 'photo of [brand] logo on a billboard, sunset',
  numImages: 4,
});

// Model loaded from:
// models/creativetechnologists/flux-lora-v1.safetensors

// Output saved to:
// generated-content/creativetechnologists/2024-12-04-001.jpg
```

---

## 🔍 Brand Isolation Examples

### Example 1: Creative Technologists

```
Brand ID: "creativetechnologists"

Training Data:
├── training-data/creativetechnologists/
│   ├── logo-001.jpg
│   ├── logo-002.jpg
│   └── product-001.jpg

Training Jobs:
└── lora_training_jobs
    └── brand_id: "creativetechnologists"
        └── status: "completed"

Models:
└── models/creativetechnologists/
    └── flux-lora-v1.safetensors

Generated Content:
└── generated-content/creativetechnologists/
    ├── 2024-12-04-001.jpg
    └── 2024-12-04-002.jpg
```

### Example 2: Acme Company

```
Brand ID: "acmecompany"

Training Data:
├── training-data/acmecompany/
│   └── logo-001.png

Training Jobs:
└── lora_training_jobs
    └── brand_id: "acmecompany"
        └── status: "training"

Models:
└── models/acmecompany/
    └── (not yet trained)

Generated Content:
└── generated-content/acmecompany/
    └── (no generations yet)
```

**Complete isolation! No cross-contamination possible!** 🔒

---

## 🛡️ Security Guarantees

### Database Level

✅ RLS policies on all tables
✅ Brand ID required for all operations
✅ Users can ONLY access their brand's data
✅ Queries automatically filtered

### Storage Level

✅ Folder-based isolation (`{brand_id}/...`)
✅ RLS policies on storage objects
✅ Signed URLs brand-specific
✅ No cross-brand file access

### Application Level

✅ Brand ID from user session
✅ All API calls include brand validation
✅ Model loading checks brand ownership
✅ Generation restricted to brand models

---

## 📈 Scaling Considerations

### Multiple Models Per Brand

```
models/creativetechnologists/
├── flux-lora-v1.safetensors      ← Product photography
├── flux-lora-v2.safetensors      ← Logo variations
├── sdxl-lora-v1.safetensors      ← Marketing materials
└── sd15-lora-v1.safetensors      ← Social media
```

### Model Versioning

```
models/creativetechnologists/
├── flux-lora/
│   ├── v1.safetensors            ← Initial training
│   ├── v2.safetensors            ← Retrained with more data
│   └── v3.safetensors            ← Fine-tuned
└── metadata.json                 ← Version info
```

### Multi-Region Storage

```
training-data/
├── us-east-1/
│   └── creativetechnologists/
└── eu-west-1/
    └── creativetechnologists/
```

---

## ✅ Summary

**Model Bucketing Strategy:**

1. **Database Isolation**
   - All tables have `brand_id` column
   - RLS policies enforce brand filtering
   - Users can't query other brands

2. **Storage Isolation**
   - Files organized by `{brand_id}/` folders
   - RLS policies on storage objects
   - Signed URLs are brand-specific

3. **Application Isolation**
   - Monorepo packages respect brand boundaries
   - All APIs validate brand ownership
   - Frontend enforces brand context

4. **Model Isolation**
   - Training data per brand
   - Models stored per brand
   - Generation uses brand models only

**Result: Complete multi-tenant AI model isolation!** 🎯

**Each brand gets their own private AI models with zero risk of data leakage!** 🔐
