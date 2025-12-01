-- Create brand_documents table for PDF and document storage
CREATE TABLE IF NOT EXISTS public.brand_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Document metadata
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL, -- Storage URL
  file_type TEXT NOT NULL, -- 'pdf', 'docx', 'txt', etc.
  file_size INTEGER, -- bytes
  
  -- Document status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  processing_error TEXT,
  
  -- Extracted data (for brand config extraction)
  extracted_data JSONB, -- Store extracted brand guidelines, colors, fonts, etc.
  
  -- RAG metadata
  is_indexed BOOLEAN DEFAULT false, -- Whether document has been chunked and embedded
  chunk_count INTEGER DEFAULT 0, -- Number of chunks created
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_documents_brand_id ON public.brand_documents(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_documents_status ON public.brand_documents(status);
CREATE INDEX IF NOT EXISTS idx_brand_documents_is_indexed ON public.brand_documents(is_indexed);

-- Enable RLS
ALTER TABLE public.brand_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view documents from their brands"
  ON public.brand_documents FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents to their brands"
  ON public.brand_documents FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own documents"
  ON public.brand_documents FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete brand documents"
  ON public.brand_documents FOR DELETE
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );
