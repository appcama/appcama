import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'

// Simple test component
function TestApp() {
  const [test, setTest] = React.useState('React is working');
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{test}</h1>
        <button 
          onClick={() => setTest('Button clicked!')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test useState
        </button>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(React.createElement(TestApp));
} else {
  console.error('Root element not found');
}
