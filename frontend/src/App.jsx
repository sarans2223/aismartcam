import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import VoiceNotifier from './components/VoiceNotifier';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

// Main App: renders Dashboard wrapped in ProtectedRoute, wires VoiceNotifier.
// Detection state is lifted here so Dashboard can update it when images are processed.
export default function App() {
  const { logout, user } = useAuth();
  const [currentDetection, setCurrentDetection] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="App">
        <ToastContainer position="top-right" theme="dark" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #eee' }}>
          <h1 style={{ margin: 0 }}>Sentinel AI</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <VoiceNotifier detection={currentDetection} />
            <span style={{ fontSize: '14px', color: '#666' }}>
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Logout
            </button>
          </div>
        </div>
        {currentDetection && (
          <div style={{ padding: '16px', fontSize: '14px', color: '#666', borderBottom: '1px solid #eee', background: '#f9f9f9' }}>
            Last Detection: <strong>{currentDetection?.label}</strong> ({currentDetection?.confidence}%)
          </div>
        )}
        <Dashboard onDetectionResult={setCurrentDetection} />
      </div>
    </ProtectedRoute>
  );
}