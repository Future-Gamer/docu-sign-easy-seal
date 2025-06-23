
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error fetching documents',
        description: 'Failed to load your documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File) => {
    if (!user) return null;

    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save document metadata to database
      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name: file.name.split('.')[0],
          original_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          status: file.name.includes('signed_') || file.name.includes('merged_') || file.name.includes('compressed_') ? 'completed' : 'active'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: 'Document uploaded',
        description: 'Your document has been uploaded successfully',
      });

      fetchDocuments();
      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload your document',
        variant: 'destructive',
      });
      return null;
    }
  };

  const getDocumentUrl = (filePath: string) => {
    try {
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      console.log('Generated URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error generating document URL:', error);
      return '';
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!user) return;

    try {
      // Get document details first to delete from storage
      const { data: document } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (document) {
        // Delete from storage
        await supabase.storage
          .from('documents')
          .remove([document.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Document deleted',
        description: 'Your document has been deleted successfully',
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete your document',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  return {
    documents,
    loading,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    refetch: fetchDocuments
  };
};
