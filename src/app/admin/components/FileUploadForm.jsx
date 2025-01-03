import { useState } from 'react';

export default function FileUploadForm() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://your-python-backend/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setSuccess('File uploaded and processed successfully!');
      setFile(null);
    } catch (err) {
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Upload CSV</h2>
      
      {error && (
        <div className="p-3 mb-4 text-red-500 bg-red-100 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 mb-4 text-green-500 bg-green-100 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="mt-1 block w-full"
            disabled={uploading}
          />
        </div>

        <button
          type="submit"
          disabled={uploading || !file}
          className={`w-full py-2 px-4 rounded-md ${
            uploading || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
}