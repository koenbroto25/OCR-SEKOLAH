import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 flex gap-2 rounded">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p>{message}</p>
    </div>
  );
}