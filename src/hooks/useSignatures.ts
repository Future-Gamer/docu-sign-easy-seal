
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SignatureData {
  id: string;
  document_id: string;
  signer_email: string;
  signer_name: string;
  signature_data: any;
  position_x: number;
  position_y: number;
  page_number: number;
  status: 'pending' | 'signed' | 'rejected';
  signed_at?: string;
  created_at: string;
}

export const useSignatures = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const saveSignature = async (
    documentId: string,
    signatureData: string,
    x: number,
    y: number,
    signerName: string,
    signerEmail: string,
    pageNumber: number = 1
  ) => {
    if (!user) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('signatures')
        .insert({
          document_id: documentId,
          signer_email: signerEmail,
          signer_name: signerName,
          signature_data: { image: signatureData },
          position_x: x,
          position_y: y,
          page_number: pageNumber,
          status: 'signed',
          signed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Signature saved',
        description: 'Signature position and data saved successfully',
      });

      return data;
    } catch (error) {
      console.error('Error saving signature:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save signature',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getDocumentSignatures = async (documentId: string) => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('signatures')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching signatures:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateSignatureStatus = async (signatureId: string, status: 'pending' | 'signed' | 'rejected') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('signatures')
        .update({ 
          status,
          signed_at: status === 'signed' ? new Date().toISOString() : null
        })
        .eq('id', signatureId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating signature status:', error);
      return null;
    }
  };

  return {
    saveSignature,
    getDocumentSignatures,
    updateSignatureStatus,
    loading
  };
};
