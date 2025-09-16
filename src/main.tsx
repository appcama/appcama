import React from 'react'
import { createRoot } from 'react-dom/client'

// Completely fresh start - no imports from existing files
function SimpleApp() {
  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui',
      backgroundColor: '#f0f9ff'
    }
  }, React.createElement('div', {
    style: { textAlign: 'center' }
  }, [
    React.createElement('h1', {
      key: 'title',
      style: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e40af' }
    }, 'ReciclaÊ System'),
    React.createElement('p', {
      key: 'subtitle',
      style: { fontSize: '1.1rem', color: '#64748b', marginBottom: '2rem' }
    }, 'Sistema de Gestão de Reciclagem'),
    React.createElement('div', {
      key: 'status',
      style: { 
        padding: '1rem 2rem',
        backgroundColor: '#22c55e',
        color: 'white',
        borderRadius: '0.5rem',
        fontWeight: '600'
      }
    }, '✓ React is working correctly!')
  ]));
}

// Direct DOM manipulation without JSX
const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(React.createElement(SimpleApp));
    console.log('✓ React app mounted successfully');
  } catch (error) {
    console.error('❌ Failed to mount React app:', error);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui;">
        <div style="text-align: center; color: red;">
          <h1>React Error</h1>
          <p>Failed to initialize React: ${error.message}</p>
        </div>
      </div>
    `;
  }
} else {
  console.error('❌ Root element not found');
}
