import React, { useState, useRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

import { getClientIp }           from '@/lib/getClientIp';
import { uploadFile }            from '@/services/fileService';
import { checkIfIpSubmitted,
         saveFormSubmission }    from '@/services/formService';
import { supabase }             from '@/integrations/supabase/client';

const MAX_FILE_SIZE          = 15 * 1024 * 1024;           // 15 MB
const RECAPTCHA_V2_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

if (!RECAPTCHA_V2_SITE_KEY) {
  throw new Error('Missing VITE_RECAPTCHA_SITE_KEY environment variable');
}

const UploadForm = () => {
  const [file,   setFile]           = useState<File | null>(null);
  const [email,  setEmail]          = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const [emailError,   setEmailError]   = useState('');
  const [fileError,    setFileError]    = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [clientIp,     setClientIp]     = useState<string>('');

  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { toast }    = useToast();

  /* ────────────────────── utils ────────────────────── */
  const validateEmail = (mail: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);

  const verifyRecaptcha = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token }
      });

      if (error) throw error;
      
      setRecaptchaToken(token);
      return data.success === true;
    } catch (err) {
      console.error('Recaptcha verify error:', err);
      setRecaptchaToken(null);
      return false;
    }
  };

  /* ────────────────────── side-effect ────────────────────── */
  useEffect(() => {
    (async () => {
      const ip = await getClientIp();
      setClientIp(ip);

      if (ip !== 'unknown') {
        const already = await checkIfIpSubmitted(ip);
        setHasSubmitted(already);

        if (already) {
          toast({
            title: 'Uwaga',
            description: 'Formularz został już wysłany z tego adresu IP',
            variant: 'destructive'
          });
        }
      }
    })();
  }, [toast]);

  /* ────────────────────── handlers ────────────────────── */
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileError('');
    if (!f) return;

    if (!f.type.includes('pdf'))        return setFileError('Tylko pliki PDF są akceptowane');
    if (f.size > MAX_FILE_SIZE)         return setFileError('Plik > 15 MB');
    setFile(f);
  };

  const onEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');  setFileError('');

    /* walidacje pól */
    if (!email || !validateEmail(email)) { setEmailError('Niepoprawny email'); return; }
    if (!file)  { setFileError('Wybierz plik PDF'); return; }

    /* reCAPTCHA */
    const token = recaptchaRef.current?.getValue();
    if (!token) {
      toast({ title:'Błąd', description:'Potwierdź reCAPTCHA', variant:'destructive' });
      return;
    }
    if (!(await verifyRecaptcha(token))) {
      toast({ title:'Błąd reCAPTCHA', description:'Weryfikacja nieudana', variant:'destructive' });
      return;
    }

    /* anty-spam IP */
    if (hasSubmitted) {
      toast({ title:'Uwaga', description:'Już wysłałeś formularz z tego IP', variant:'destructive' });
      return;
    }

    /* upload + zapis w DB */
    try {
      setSubmitting(true);

      const { path, error: upErr } = await uploadFile(file, email);
      if (upErr) throw new Error(upErr);

      const { success, error: dbErr } = await saveFormSubmission({
        email,
        file_path : path,
        ip_address: clientIp
      });
      if (!success) throw new Error(dbErr || 'DB error');

      toast({ title:'Dziękujemy!', description:'Dokument przesłany 👍' });

      /* reset formularza */
      setFile(null);
      setEmail('');
      recaptchaRef.current?.reset();
      setHasSubmitted(true);
    } catch (err:any) {
      console.error(err);
      toast({ title:'Wystąpił błąd', description: err.message || 'Spróbuj później', variant:'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ────────────────────── render ────────────────────── */
  return (
    <section id="form" className="py-16 bg-white min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-center mb-6 text-black">
            Załącz umowę <span className="font-normal">(bez danych wrażliwych)</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adres email
              </label>
              <Input id="email" type="email" value={email} onChange={onEmail}
                     disabled={isSubmitting || hasSubmitted}
                     className={`w-full ${emailError ? 'border-red-500' : 'border-gray-300'} bg-white text-black`} />
              {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
            </div>

            {/* plik */}
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                Plik PDF (max 15 MB)
              </label>
              <label className={`w-full cursor-pointer bg-white border rounded-md px-4 py-2 text-sm
                                 ${fileError ? 'border-red-500' : 'border-gray-300'}
                                 ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} transition-colors`}>
                <span className="text-gray-500">{file ? file.name : 'Wybierz plik PDF…'}</span>
                <Input id="file" type="file" accept=".pdf" onChange={onFile}
                       className="hidden" disabled={isSubmitting || hasSubmitted} />
              </label>
              {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
              {file && !fileError && (
                <p className="mt-1 text-sm text-green-600">
                  Rozmiar: {(file.size / (1024*1024)).toFixed(2)} MB
                </p>
              )}
            </div>

            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_V2_SITE_KEY}
                onChange={(token: string | null) => {
                  if (token) {
                    verifyRecaptcha(token);
                  } else {
                    setRecaptchaToken(null);
                  }
                }}
                theme="light"
                size="normal"
              />
            </div>

            {/* przycisk */}
            <div className="pt-4">
              <Button type="submit"
                      disabled={isSubmitting || hasSubmitted}
                      className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-2">
                {isSubmitting ? 'Przesyłanie…' : hasSubmitted ? 'Przesłano' : 'Sprawdź umowę'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default UploadForm;
