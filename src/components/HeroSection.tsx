
import React from 'react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const scrollToForm = () => {
    const formElement = document.getElementById('form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Łatwo prześlij swój dokument PDF
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Wgraj swój plik PDF, podaj adres email i gotowe. To szybkie i bezpieczne.
          </p>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-md"
            onClick={scrollToForm}
          >
            Wyślij dokument
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
