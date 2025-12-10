import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="text-destructive bg-destructive/10 px-4 py-2 rounded-md text-sm">
      {message}
    </div>
  );
}
