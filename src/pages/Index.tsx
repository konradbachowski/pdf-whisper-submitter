
import React from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import UploadForm from '@/components/UploadForm';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <UploadForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
