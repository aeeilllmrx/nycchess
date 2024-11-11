"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/players', label: 'Players' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/tournaments', label: 'Tournaments' },
  ];

  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold">
              NYC Chess
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;