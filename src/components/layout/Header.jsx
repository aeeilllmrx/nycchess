"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DarkModeToggle from './DarkModeToggle';

const Header = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/players', label: 'Players' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/tournaments', label: 'Tournaments' },
    { href: '/clubs', label: 'Clubs' },
  ];

  return (
    <header className="bg-white dark:bg-dark-card shadow-md border-b border-gray-200 dark:border-dark-border">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-dark-text">
              NYC Chess
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-900 text-white dark:bg-chess-green dark:text-white'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-dark-text dark:hover:bg-dark-border'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <DarkModeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;