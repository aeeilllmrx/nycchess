'use client';

import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      // No need to redirect - the parent component will handle displaying the upload form
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-dark-card rounded-lg shadow-md border border-gray-200 dark:border-dark-border">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-dark-text">Admin Login</h2>
        
        {error && (
          <div className="p-3 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg px-3 py-2 text-gray-900 dark:text-dark-text focus:border-blue-500 dark:focus:border-chess-green focus:ring-1 focus:ring-blue-500 dark:focus:ring-chess-green"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg px-3 py-2 text-gray-900 dark:text-dark-text focus:border-blue-500 dark:focus:border-chess-green focus:ring-1 focus:ring-blue-500 dark:focus:ring-chess-green"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 text-white rounded-md transition-colors
              ${isLoading 
      ? 'bg-blue-400 dark:bg-gray-600 cursor-not-allowed' 
      : 'bg-blue-600 hover:bg-blue-700 dark:bg-chess-green dark:hover:bg-chess-dark'
    }`}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}