
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import { getClientIp } from '@/lib/getClientIp';
import { checkIfIpSubmitted, saveFormSubmission } from '@/services/formService';
import { uploadFile } from '@/services/fileService';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB in bytes

const UploadForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [fileError, setFileError] = useState('');
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [clientIp, setClientIp] = useState<string>('');
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClientIp = async () => {
      const ip = await getClientIp();
      setClientIp(ip);
      
      if (ip !== 'unknown') {
        const submitted = await checkIfIpSubmitted(ip);
        setHasSubmitted(submitted);
        
        if (submitted) {
          toast({
            title: "Uwaga",
            description: "Formularz został już wysłany z tego adresu IP",
            variant: "destructive"
          });
        }
      }
    };
    
    fetchClientIp();
  }, [toast]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFileError('');

    if (!selectedFile) {
      return;
    }

    // Validate file type
    if (!selectedFile.type.includes('pdf')) {
      setFileError('Tylko pliki PDF są akceptowane');
      setFile(null);
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError(`Plik jest za duży. Maksymalny rozmiar to 15MB`);
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
  };

  const handleRecaptchaChange = (value: string | null) => {
    setRecaptchaVerified(!!value);
  };
const verifyRecaptcha = async (token: string): Promise<boolean> => {
  try {
    const res = await fetch("https://oegvphxlgtgngmikytua.functions.supabase.co/verify-recaptcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Recaptcha verify error", err);
    return false;
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError('');
    setFileError('');
    
    // Validate email
    if (!email || !validateEmail(email)) {
      setEmailError('Wprowadź prawidłowy adres email');
      return;
    }
    
    // Validate file
    if (!file) {
      setFileError('Wybierz plik PDF do przesłania');
      return;
    }
    
    const recaptchaToken = recaptchaRef.current?.getValue();

if (!recaptchaToken) {
  toast({
    title: "Błąd",
    description: "Potwierdź, że nie jesteś robotem",
    variant: "destructive"
  });
  return;
}

const verified = await verifyRecaptcha(recaptchaToken);

if (!verified) {
  toast({
    title: "Błąd reCAPTCHA",
    description: "Nie udało się zweryfikować. Spróbuj ponownie.",
    variant: "destructive"
  });
  return;
}
    
    // Check if user already submitted
    if (hasSubmitted) {
      toast({
        title: "Uwaga",
        description: "Formularz został już wysłany z tego adresu IP",
        variant: "destructive"
      });
      return;
    }
    
    // Submit form
    setIsSubmitting(true);
    
    try {
      // Step 1: Upload file to storage
      const { path, error: uploadError } = await uploadFile(file, email);
      
      if (uploadError) {
        toast({
          title: "Wystąpił błąd",
          description: uploadError,
          variant: "destructive"
        });
        return;
      }
      
      // Step 2: Save submission to database
      const { success, error: submissionError } = await saveFormSubmission({
        email,
        file_path: path,
        ip_address: clientIp
      });
      
      if (!success) {
        toast({
          title: "Wystąpił błąd",
          description: submissionError || "Nie udało się zapisać zgłoszenia",
          variant: "destructive"
        });
        return;
      }
      
      // Success
      toast({
        title: "Dziękujemy!",
        description: "Twój dokument został pomyślnie przesłany.",
      });
      
      // Reset form
      setFile(null);
      setEmail('');
      setRecaptchaVerified(false);
      setHasSubmitted(true);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Wystąpił błąd",
        description: "Nie udało się przesłać pliku. Spróbuj ponownie później.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="form" className="py-16 bg-white min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-center mb-6 text-black">Załącz umowę bez wrażliwych danych</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adres email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="twoj@email.com"
                className={`w-full ${emailError ? 'border-red-500' : 'border-gray-300'} bg-white text-black`}
                disabled={isSubmitting || hasSubmitted}
              />
              {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
            </div>
            
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                Plik PDF (max. 15MB)
              </label>
              <div className="mt-1 flex items-center">
                <label className={`w-full cursor-pointer bg-white border rounded-md px-4 py-2 text-sm 
                  ${fileError ? 'border-red-500' : 'border-gray-300'} 
                  ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} transition-colors`}>
                  <span className="text-gray-500">
                    {file ? file.name : 'Wybierz plik PDF...'}
                  </span>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                    disabled={isSubmitting || hasSubmitted}
                  />
                </label>
              </div>
              {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
              {file && !fileError && (
                <p className="mt-1 text-sm text-green-600">
                  Rozmiar pliku: {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
            </div>
            
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6LdaHDorAAAAAB0fIN6BvfrY3amAdvMLMyohaEWA"  // This is Google's test key
                onChange={handleRecaptchaChange}
                disabled={hasSubmitted}
              />
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-2"
                disabled={isSubmitting || hasSubmitted}
              >
                {isSubmitting ? 'Przesyłanie...' : hasSubmitted ? 'Przesłano' : 'Sprawdź umowę'}
              </Button>
              
              {hasSubmitted && (
                <p className="mt-4 text-center text-sm text-gray-500">
                  Formularz został już wysłany. Dziękujemy!
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default UploadForm;
