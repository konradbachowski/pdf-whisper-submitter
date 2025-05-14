
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 py-8 border-t border-gray-200">
      <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
        <p className="mb-2">© {new Date().getFullYear()} HeyNeuron. Wszelkie prawa zastrzeżone.</p>
        <div className="flex justify-center space-x-4">
          <a href="#" className="hover:text-blue-600 transition-colors">Polityka prywatności</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Warunki korzystania</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Kontakt</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
