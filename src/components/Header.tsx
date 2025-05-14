
import React from 'react';

const Header = () => {
  return (
    <header className="bg-white py-4 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="font-bold text-2xl text-blue-600">PlikUpload</div>
        <nav className="hidden md:flex space-x-6">
          <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Strona główna</a>
          <a href="#form" className="text-gray-600 hover:text-blue-600 transition-colors">Wyślij plik</a>
          <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Kontakt</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
