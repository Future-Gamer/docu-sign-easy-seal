
-- Create users profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create documents table to store uploaded files
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'processing', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create document_operations table to track PDF operations
CREATE TABLE public.document_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('merge', 'split', 'compress', 'convert', 'edit')),
  input_documents UUID[] NOT NULL,
  output_document UUID REFERENCES public.documents(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create signatures table for document signing functionality
CREATE TABLE public.signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  signer_email TEXT NOT NULL,
  signer_name TEXT,
  signature_data JSONB NOT NULL,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  page_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected')),
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for document_operations
CREATE POLICY "Users can view their own operations" ON public.document_operations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own operations" ON public.document_operations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own operations" ON public.document_operations
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for signatures
CREATE POLICY "Users can view signatures for their documents" ON public.signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signatures.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert signatures for their documents" ON public.signatures
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signatures.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update signatures for their documents" ON public.signatures
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signatures.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Create storage policies for documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
