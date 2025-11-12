'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoginForm from './components/LoginForm';
import FileUploadForm from './components/FileUploadForm';
import RatingChangesViewer from './components/RatingChangesViewer';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('process'); // 'process' or 'changes'

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh] text-gray-900 dark:text-dark-text">Loading...</div>;
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('process')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'process'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300'
              }`}
            >
              📤 Process Tournament
            </button>
            <button
              onClick={() => setActiveTab('changes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'changes'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300'
              }`}
            >
              📊 Rating Changes
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'process' && <FileUploadForm />}
        {activeTab === 'changes' && <RatingChangesViewer />}
      </div>
    </div>
  );
}