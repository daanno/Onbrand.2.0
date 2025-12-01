-- Create document_embeddings table for RAG vector search
CREATE TABLE IF NOT EXISTS public.document_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.brand_documents(id) ON DELETE CASCADE,
  
  -- Chunk data
  chunk_index INTEGER NOT NULL, -- Order of chunk in document
  content TEXT NOT NULL, -- The actual text chunk
  content_length INTEGER, -- Character count
  
  -- Vector embedding (1536 dimensions for OpenAI text-embedding-3-small)
  embedding vector(1536),
  
  -- Metadata for better retrieval
  metadata JSONB, -- Page number, section, heading, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_embeddings_brand_id ON public.document_embeddings(brand_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON public.document_embeddings(document_id);

-- Vector similarity search index (HNSW for fast approximate search)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
  ON public.document_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- Enable RLS
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view embeddings from their brands"
  ON public.document_embeddings FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );

-- Function for similarity search (brand-isolated)
CREATE OR REPLACE FUNCTION match_brand_documents(
  query_embedding vector(1536),
  query_brand_id TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_embeddings.id,
    document_embeddings.document_id,
    document_embeddings.content,
    document_embeddings.metadata,
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity
  FROM public.document_embeddings
  WHERE document_embeddings.brand_id = query_brand_id
    AND 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY document_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
