'use client';

import { useState } from 'react';
import { getAuth } from 'firebase/auth';
import RatingPreview from './RatingPreview';

export default function FileUploadForm() {
  const [file, setFile] = useState(null);
  const [tournamentType, setTournamentType] = useState('rapid');
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDate, setTournamentDate] = useState('');
  const [step, setStep] = useState(1); // 1: upload, 2: validate, 3: preview, 4: success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState(null);
  const [ratingChanges, setRatingChanges] = useState(null);

  const handleValidate = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!tournamentName || !tournamentDate) {
      setError('Please provide tournament name and date');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tournamentType', tournamentType);

    try {
      const response = await fetch('/api/admin/validate-tournament', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.errors?.join('\n') || 'Validation failed');
        setValidation(data);
      } else {
        setValidation(data);
        setStep(2);
      }
    } catch (err) {
      setError('Failed to validate file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tournamentType', tournamentType);

    try {
      const response = await fetch('/api/admin/process-tournament', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Processing failed');
      } else {
        setRatingChanges(data);
        setStep(3);
      }
    } catch (err) {
      setError('Failed to process tournament: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setLoading(true);
    setError('');

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        setError('You must be logged in');
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/admin/apply-ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tournamentName,
          tournamentDate,
          tournamentType,
          changes: ratingChanges.changes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to apply ratings');
      } else {
        setStep(4);
      }
    } catch (err) {
      setError('Failed to apply ratings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTournamentName('');
    setStep(1);
    setValidation(null);
    setRatingChanges(null);
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-dark-text">Process Tournament</h2>

      {/* Progress indicator */}
      <div className="mb-8 flex items-center justify-between">
        {['Upload', 'Validate', 'Preview', 'Complete'].map((label, idx) => (
          <div key={label} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step > idx + 1 ? 'bg-green-500' : step === idx + 1 ? 'bg-blue-500' : 'bg-gray-300'
            } text-white font-bold`}>
              {step > idx + 1 ? '✓' : idx + 1}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-dark-text">{label}</span>
            {idx < 3 && <div className="w-16 h-1 bg-gray-300 mx-4" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded">
          <pre className="whitespace-pre-wrap font-mono text-sm">{error}</pre>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <form onSubmit={handleValidate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
              Tournament Name
            </label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text rounded-md"
              placeholder="e.g., Weekly Blitz #45"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
              Tournament Date
            </label>
            <input
              type="date"
              value={tournamentDate}
              onChange={(e) => setTournamentDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
              Tournament Type
            </label>
            <select
              value={tournamentType}
              onChange={(e) => setTournamentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text rounded-md"
            >
              <option value="rapid">Rapid</option>
              <option value="blitz">Blitz</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
              Tournament File (TSV format)
            </label>
            <input
              type="file"
              accept=".tsv,.txt"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full"
              required
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-dark-muted">
              File should be tab-delimited with columns: ID, Name, Rating, Rnd1, Rnd2, etc.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !file || !tournamentName || !tournamentDate}
            className={`w-full py-3 px-4 rounded-md font-semibold ${
              loading || !file || !tournamentName || !tournamentDate
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {loading ? 'Validating...' : 'Validate File'}
          </button>
        </form>
      )}

      {/* Step 2: Validation Results */}
      {step === 2 && validation && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✓ Validation Passed</h3>
            <div className="text-green-700">
              <p>Players: {validation.summary.playerCount}</p>
              <p>Rounds: {validation.summary.roundCount}</p>
            </div>
          </div>

          {validation.warnings && validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Warnings</h3>
              <ul className="text-yellow-700 text-sm space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={handleReset}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-md font-semibold hover:bg-gray-50"
            >
              Start Over
            </button>
            <button
              onClick={handleProcess}
              disabled={loading}
              className={`flex-1 py-3 px-4 rounded-md font-semibold ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {loading ? 'Processing...' : 'Calculate Ratings'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Rating Preview */}
      {step === 3 && ratingChanges && (
        <RatingPreview
          changes={ratingChanges}
          tournamentName={tournamentName}
          tournamentType={tournamentType}
          onApply={handleApply}
          onCancel={handleReset}
          loading={loading}
        />
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✓</div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">
            Ratings Updated Successfully!
          </h3>
          <p className="text-gray-600 dark:text-dark-muted mb-6">
            {ratingChanges?.changes.length} player ratings have been updated.
          </p>
          <button
            onClick={handleReset}
            className="py-3 px-6 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
          >
            Process Another Tournament
          </button>
        </div>
      )}
    </div>
  );
}