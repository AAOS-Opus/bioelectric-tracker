import React from 'react';

interface SuccessMessageProps {
  message: string;
}

export default function SuccessMessage({ message }: SuccessMessageProps) {
  return (
    <div className="text-success bg-success/10 px-4 py-2 rounded-md text-sm">
      {message}
    </div>
  );
}
