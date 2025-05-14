
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import ReCAPTCHA from 'react-google-recaptcha';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB in bytes

const UploadForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [fileError, setFileError] = useState('');
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { toast } = useToast();

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
    
    // Validate recaptcha
    if (!recaptchaVerified) {
      toast({
        title: "Błąd",
        description: "Potwierdź, że nie jesteś robotem",
        variant: "destructive"
      });
      return;
    }
    
    // Submit form
    setIsSubmitting(true);
    
    // Simulate form submission with a delay
    try {
      // In a real app, you'd submit the file to your server here
      // const formData = new FormData();
      // formData.append('file', file);
      // formData.append('email', email);
      // await fetch('/api/upload', { method: 'POST', body: formData });
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success
      toast({
        title: "Dziękujemy!",
        description: "Twój dokument został pomyślnie przesłany.",
      });
      
      // Reset form
      setFile(null);
      setEmail('');
      setRecaptchaVerified(false);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      
    } catch (error) {
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
    <section id="form" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Wyślij swój dokument</h2>
          
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
                className={`w-full ${emailError ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
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
                  hover:bg-gray-50 transition-colors`}>
                  <span className="text-gray-500">
                    {file ? file.name : 'Wybierz plik PDF...'}
                  </span>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                    disabled={isSubmitting}
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
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"  // This is Google's test key
                onChange={handleRecaptchaChange}
              />
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Przesyłanie...' : 'Wyślij dokument'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default UploadForm;
