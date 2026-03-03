import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

export default function LiveCamera({ onDetection }) {
  const webcamRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('Click Start to begin live detection');
  const intervalRef = useRef(null);

  const captureAndDetect = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      // Convert base64 to blob
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);

      setStatus('🔍 Analyzing...');

      const response = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      onDetection(data);

      setStatus(`✅ Last checked: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      setStatus('❌ Detection error - retrying...');
    }
  }, [onDetection]);

  const startDetection = () => {
    setIsRunning(true);
    setStatus('🟢 Live detection running...');
    intervalRef.current = setInterval(captureAndDetect, 3000); // every 3 seconds
  };

  const stopDetection = () => {
    setIsRunning(false);
    setStatus('⏹️ Detection stopped');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={480}
        height={360}
        style={{
          borderRadius: '12px',
          border: isRunning ? '3px solid #00cc44' : '3px solid #444',
        }}
      />

      <div style={{ marginTop: '15px' }}>
        <p style={{ color: '#aaa', marginBottom: '10px' }}>{status}</p>

        {!isRunning ? (
          <button
            onClick={startDetection}
            style={{
              padding: '10px 30px',
              backgroundColor: '#00cc44',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ▶ Start Live Detection
          </button>
        ) : (
          <button
            onClick={stopDetection}
            style={{
              padding: '10px 30px',
              backgroundColor: '#cc0000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ⏹ Stop Detection
          </button>
        )}
      </div>
    </div>
  );
}