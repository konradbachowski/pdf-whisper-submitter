
import { supabase } from "@/integrations/supabase/client";

export interface FormSubmission {
  email: string;
  file_path: string;
  ip_address: string;
}

export async function checkIfIpSubmitted(ip: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('form_submissions')
    .select('id')
    .eq('ip_address', ip)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking IP submission:', error);
  }
  
  return !!data;
}

export async function saveFormSubmission(submission: FormSubmission): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('form_submissions')
      .insert(submission)
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Formularz został już wysłany z tego adresu IP' };
      }
      console.error('Error saving form submission:', error);
      return { success: false, error: 'Wystąpił błąd podczas zapisywania zgłoszenia' };
    }

    // Trigger webhook (in a real implementation, you would replace this with your actual webhook URL)
    try {
      await triggerWebhook(data.id);
    } catch (webhookError) {
      console.error('Error triggering webhook:', webhookError);
      // We continue even if webhook fails, as the submission was saved
    }

    return { success: true };
  } catch (error) {
    console.error('Error in saveFormSubmission:', error);
    return { success: false, error: 'Wystąpił nieoczekiwany błąd' };
  }
}

async function triggerWebhook(submissionId: string): Promise<void> {
  // In a real implementation, replace with your actual webhook URL
  const webhookUrl = 'https://example.com/webhook';
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      submissionId,
      event: 'new_submission',
      timestamp: new Date().toISOString(),
    }),
  });

  // Update the submission to mark webhook as triggered
  await supabase
    .from('form_submissions')
    .update({ webhook_triggered: true })
    .eq('id', submissionId);
}
