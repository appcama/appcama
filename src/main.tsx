// Completely fresh React app - no dependencies on existing broken code
import React from 'react'
import { createRoot } from 'react-dom/client'

console.log('🚀 Starting fresh React app...');
console.log('React version:', React.version);

// Inline styles to avoid any CSS dependencies
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px'
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center' as const,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 25px 45px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
  },
  subtitle: {
    fontSize: '1.2rem',
    marginBottom: '2rem',
    opacity: 0.9
  },
  status: {
    padding: '15px 30px',
    backgroundColor: '#22c55e',
    borderRadius: '50px',
    fontWeight: '600',
    fontSize: '1.1rem',
    border: 'none',
    boxShadow: '0 10px 20px rgba(34, 197, 94, 0.3)'
  }
};

// Simple functional component using only React basics
function FreshApp() {
  console.log('✅ FreshApp component rendering...');
  
  return React.createElement('div', { style: styles.container },
    React.createElement('div', { style: styles.card }, [
      React.createElement('h1', { 
        key: 'title', 
        style: styles.title 
      }, 'ReciclaÊ'),
      React.createElement('p', { 
        key: 'subtitle', 
        style: styles.subtitle 
      }, 'Sistema de Gestão de Reciclagem'),
      React.createElement('div', { 
        key: 'status', 
        style: styles.status 
      }, '✅ Sistema Online e Funcionando!')
    ])
  );
}

// Initialize the app
function initializeApp() {
  console.log('🔧 Initializing React application...');
  
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('❌ Root element not found!');
    return;
  }

  try {
    console.log('📦 Creating React root...');
    const root = createRoot(rootElement);
    
    console.log('🎨 Rendering app...');
    root.render(React.createElement(FreshApp));
    
    console.log('🎉 App successfully mounted!');
  } catch (error) {
    console.error('💥 Failed to mount React app:', error);
    
    // Fallback HTML if React fails completely
    rootElement.innerHTML = `
      <div style="${Object.entries(styles.container).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(';')}">
        <div style="text-align: center;">
          <h1 style="color: red; font-size: 2rem;">React Failed to Load</h1>
          <p>Error: ${error.message}</p>
          <pre style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 5px; text-align: left; overflow: auto;">${error.stack}</pre>
        </div>
      </div>
    `;
  }
}

// Run initialization
initializeApp();