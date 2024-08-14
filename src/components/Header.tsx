import React from 'react';
import './Header.css';
import Link from 'next/link';
import { Button } from './ui/button';
import { LogIn } from 'lucide-react';
import Image from 'next/image';

const Header: React.FC = () => {
  return (
    <header className="absolute w-full flex justify-between items-center p-4 bg-transparent text-white z-10">
      {/* Logo */}
      <div className="flex-shrink-0">
        <Link href="/" passHref>
          <Image
            src="/logo.png"
            alt="ChatBot PDF Logo"
            width={75} 
            height={75}
            className="cursor-pointer"
          />
        </Link>
      </div>

    {/* Menu Items 
      <nav className="flex flex-grow justify-end space-x-4 mr-3">
        <Link href="/about">About</Link>
        <Link href="/chatbotblog">Blog</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    */}
      {/* CTA Button 
      <div className="flex-shrink-0">
        <Link href="/sign-in">
          <Button>
            Login to get Started!
            <LogIn className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
      */}
    </header>
  );
};

export default Header;
