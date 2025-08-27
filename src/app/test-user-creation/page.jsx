"use client";
import { useState } from 'react';

export default function TestUserCreation() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const createUserDocument = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/create-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test User Document Creation</h1>
      
      <button 
        onClick={createUserDocument}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create User Document'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 border rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}