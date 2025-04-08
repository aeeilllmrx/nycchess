import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-100 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-600 text-sm">
              © {new Date().getFullYear()} NYC Chess Club. All rights reserved.
          </div>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-6 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-gray-900">
                    About
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
  
export default Footer;