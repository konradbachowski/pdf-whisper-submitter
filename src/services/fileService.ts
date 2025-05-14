
import { supabase } from "@/integrations/supabase/client";

export async function uploadFile(file: File, email: string): Promise<{ path: string; error?: string }> {
  try {
    // Generate a unique filename using email and timestamp
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${sanitizedEmail}_${timestamp}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload file to Supabase Storage
    const { error } = await supabase.storage
      .from('agreements')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      return { path: '', error: 'Nie udało się przesłać pliku' };
    }

    return { path: filePath };
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return { path: '', error: 'Wystąpił nieoczekiwany błąd podczas przesyłania pliku' };
  }
}
