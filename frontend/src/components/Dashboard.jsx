import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { toast } from 'react-toastify';

const BACKEND = 'http://localhost:8000';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getLabelColor = (label) => {
  if (label?.includes('family'))     return '#00cc44';
  if (label === 'swiggy')            return '#ff6600';
  if (label === 'zomato')            return '#cc0000';
  if (label === 'postman_or_police') return '#0066cc';
  return '#ff3333';
};
const getLabelIcon = (label) => {
  if (label?.includes('family'))     return '👤';
  if (label === 'swiggy')            return '🛵';
  if (label === 'zomato')            return '🍕';
  if (label === 'postman_or_police') return '👮';
  return '⚠️';
};
const getLabelText = (label) => {
  if (label?.includes('family'))     return `Family: ${label.replace('family_', '')}`;
  if (label === 'swiggy')            return 'Swiggy Delivery Agent';
  if (label === 'zomato')            return 'Zomato Delivery Agent';
  if (label === 'postman_or_police') return 'Postman / Police Officer';
  return 'UNKNOWN PERSON';
};

const PIPELINE       = ['Camera', 'AI Analysis', 'Classify', 'Log/Alert'];
const PIPELINE_ICONS = ['📷', '🧠', '🏷️', '🔔'];
const DETECTION_CATEGORIES = [
  { label: 'swiggy',            text: 'Delivery Personnel Detected', icon: '🛵' },
  { label: 'zomato',            text: 'Zomato Agent Detected',       icon: '🍕' },
  { label: 'postman_or_police', text: 'Service Worker Identified',   icon: '👮' },
  { label: 'unknown',           text: 'Unknown Threat Detected',     icon: '⚠️' },
  { label: 'family',            text: 'Family Member Recognized',    icon: '👤' },
];

// ── Settings Page ─────────────────────────────────────────────────────────────
const SettingsPage = React.memo(({ registeredFaces, onRegister }) => {
  const [preview, setPreview] = useState(null);
  const [file, setFile]       = useState(null);
  const [status, setStatus]   = useState('');
  const nameRef               = useRef('');
  const fileInputRef          = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    const name = nameRef.current.trim();
    if (!name) { setStatus('❌ Please enter a name'); return; }
    if (!file)  { setStatus('❌ Please select a photo'); return; }
    setStatus('⏳ Uploading...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res  = await fetch(
        `${BACKEND}/register-face?name=${encodeURIComponent(name)}`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (data.message) {
        setStatus(`✅ ${name} registered successfully!`);
        onRegister({ name, preview });
        setFile(null); setPreview(null);
        nameRef.current = '';
        const inp = document.getElementById('sentinelNameInput');
        if (inp) inp.value = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setStatus('❌ Upload failed. Try again.');
      }
    } catch {
      setStatus('❌ Error connecting to backend');
    }
  };

 

  return (
    <div style={{ padding: '30px', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ color: '#e6edf3', marginBottom: '5px' }}>⚙️ Settings</h2>
      <p style={{ color: '#8b949e', marginBottom: '30px' }}>Register family members — they won't trigger alerts</p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        {/* Register Card */}
        <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '25px', flex: 1, minWidth: '300px', maxWidth: '460px' }}>
          <h3 style={{ color: '#58a6ff', marginBottom: '20px' }}>👤 Register New Face</h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#8b949e', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Person Name</label>
            <input
              id="sentinelNameInput"
              type="text"
              placeholder="e.g. saran, mom, dad"
              onChange={(e) => { nameRef.current = e.target.value; }}
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '6px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#8b949e', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Upload Face Photo</label>
            <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #30363d', borderRadius: '8px', padding: '25px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#21262d' }}>
              {preview
                ? <img src={preview} alt="preview" style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #58a6ff' }} />
                : (<><div style={{ fontSize: '40px' }}>📸</div><p style={{ color: '#8b949e', fontSize: '13px', margin: '8px 0 0 0' }}>Click to upload photo</p><p style={{ color: '#555', fontSize: '11px' }}>JPG, PNG — clear front face</p></>)
              }
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>

          {status && (
            <div style={{ padding: '10px', borderRadius: '6px', marginBottom: '15px', backgroundColor: status.includes('✅') ? '#0d3321' : status.includes('⏳') ? '#1a1a2e' : '#3d1a1a', color: status.includes('✅') ? '#00cc44' : status.includes('⏳') ? '#58a6ff' : '#ff6666', fontSize: '13px' }}>
              {status}
            </div>
          )}

          <button onClick={handleSubmit} style={{ width: '100%', padding: '12px', backgroundColor: '#238636', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
            ➕ Register Face
          </button>
        </div>

        {/* Registered Faces */}
        <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '25px', flex: 1, minWidth: '260px', maxWidth: '400px' }}>
          <h3 style={{ color: '#58a6ff', marginBottom: '20px' }}>
            ✅ Registered Members
            <span style={{ marginLeft: '8px', backgroundColor: '#21262d', color: '#8b949e', padding: '1px 8px', borderRadius: '10px', fontSize: '12px' }}>{registeredFaces.length}</span>
          </h3>
          {registeredFaces.length === 0
            ? (<div style={{ color: '#555', textAlign: 'center', padding: '30px', border: '2px dashed #30363d', borderRadius: '8px' }}><div style={{ fontSize: '30px' }}>👥</div><p style={{ fontSize: '13px', marginTop: '8px' }}>No faces registered yet</p></div>)
            : registeredFaces.map((face, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: '#21262d', borderRadius: '8px', marginBottom: '8px', border: '1px solid #30363d' }}>
                {face.preview
                  ? <img src={face.preview} alt={face.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00cc44' }} />
                  : <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#30363d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👤</div>
                }
                <div>
                  <div style={{ color: '#00cc44', fontWeight: 'bold', fontSize: '14px' }}>{face.name}</div>
                  <div style={{ color: '#555', fontSize: '11px' }}>✅ Will not trigger alerts</div>
                </div>
              </div>
            ))
          }
          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#0d1117', borderRadius: '8px', border: '1px solid #30363d' }}>
            <p style={{ color: '#58a6ff', fontSize: '12px', fontWeight: 'bold', margin: '0 0 6px 0' }}>💡 Tips for best accuracy:</p>
            <ul style={{ color: '#8b949e', fontSize: '12px', paddingLeft: '16px', margin: 0 }}>
              <li>Clear, front-facing photo</li>
              <li>Good lighting — no shadows</li>
              <li>Only one face per photo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard({ onDetectionResult }) {
  const webcamRef  = useRef(null);
  const intervalRef = useRef(null);
  const alarmRef   = useRef(null);

  const [isRunning,       setIsRunning]       = useState(false);
  const [logs,            setLogs]            = useState([]);
  const [latestDetection, setLatestDetection] = useState(null);
  const [showAlarm,       setShowAlarm]       = useState(false);
  const [scanCount,       setScanCount]       = useState(0);
  const [activeNav,       setActiveNav]       = useState('live');
  const [pipelineStep,    setPipelineStep]    = useState(0);
  const [currentTime,     setCurrentTime]     = useState(new Date());
  const [registeredFaces, setRegisteredFaces] = useState([]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Alarm audio
  useEffect(() => {
    alarmRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    alarmRef.current.loop = true;
  }, []); 

  const handleDetectionResult = useCallback((data) => {
    if (!data || data.label === 'error') return;
    const entry = { ...data, id: Date.now(), time: new Date().toLocaleTimeString() };
    setLatestDetection(entry);
    setLogs(prev => [entry, ...prev].slice(0, 50));
    setPipelineStep(4);
    setTimeout(() => setPipelineStep(0), 2000);

    // Call the parent callback to update voice notifier
    if (onDetectionResult) {
      onDetectionResult(entry);
    }

    if (data.label?.toLowerCase().includes('unknown')) {

  setShowAlarm(true);
  // alarmRef.current?.play();  // enable if needed
  // toast.error('🚨 UNKNOWN PERSON DETECTED!', { autoClose: false });

} else if (data.label === 'swiggy') {

  toast.info('🛵 Swiggy delivery agent at door', { autoClose: 4000 });

} else if (data.label === 'zomato') {

  toast.info('🍕 Zomato delivery agent at door', { autoClose: 4000 });

} else if (data.label === 'postman_or_police') {

  toast.info('👮 Postman / Police detected', { autoClose: 4000 });

} else if (data.label?.includes('family')) {

  toast.success(`✅ ${getLabelText(data.label)} recognized`, { autoClose: 2000 });

} 
}, [onDetectionResult]);
  const captureAndDetect = useCallback(async () => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    try {
      setPipelineStep(1);
      const blob = await fetch(screenshot).then(r => r.blob());
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');
      setPipelineStep(2);
      const res  = await fetch(`${BACKEND}/detect`, { method: 'POST', body: formData });
      setPipelineStep(3);
      const data = await res.json();
      setScanCount(prev => prev + 1);
      handleDetectionResult(data);
    } catch (e) {
      console.error('Detection error:', e);
      setPipelineStep(0);
    }
  }, [handleDetectionResult]);

  const startDetection = useCallback(() => {
    setIsRunning(true);
    intervalRef.current = setInterval(captureAndDetect, 3000);
  }, [captureAndDetect]);

  const stopDetection = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPipelineStep(0);
  }, []);

  const dismissAlarm = useCallback(() => {
    
    setShowAlarm(false);
    try { alarmRef.current?.pause(); alarmRef.current.currentTime = 0; } catch {}
  }, []);


  const handleRegister = useCallback((face) => {
    setRegisteredFaces(prev => [...prev, face]);
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const alertCount = logs.filter(l => l.alert).length;

  const navItems = [
    { id: 'live',     label: 'Live Monitoring', icon: '👁️' },
    { id: 'alerts',   label: 'Alerts',          icon: '🚨' },
    { id: 'log',      label: 'Activity Log',    icon: '📋' },
    { id: 'settings', label: 'Settings',        icon: '⚙️' },
  ];
  const callMe = async () => {
  console.log("CALLING BACKEND...");

  try {
    const res = await fetch(`${BACKEND}/call-alert`, {
      method: "POST",
    });

    const data = await res.json();
    console.log("CALL RESPONSE:", data);

    toast.success("📞 Calling your phone...");
  } catch (err) {
    console.error("CALL FAILED:", err);
    toast.error("❌ Call failed");
  }
};

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d1117', color: 'white', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width: '220px', backgroundColor: '#161b22', borderRight: '1px solid #30363d', padding: '20px 0', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50 }}>
        <div style={{ padding: '0 20px 25px 20px', borderBottom: '1px solid #30363d' }}>
          <div style={{ color: '#58a6ff', fontSize: '20px', fontWeight: 'bold' }}>🛡️ Sentinel AI</div>
          <div style={{ color: '#8b949e', fontSize: '11px', marginTop: '4px' }}>Smart Surveillance System</div>
        </div>

        <nav style={{ padding: '15px 0', flex: 1 }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => setActiveNav(item.id)} style={{ padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: activeNav === item.id ? '#1f2937' : 'transparent', borderLeft: activeNav === item.id ? '3px solid #58a6ff' : '3px solid transparent', color: activeNav === item.id ? '#58a6ff' : '#8b949e', fontSize: '14px', transition: 'all 0.2s' }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'alerts' && alertCount > 0 && (
                <span style={{ marginLeft: 'auto', backgroundColor: '#cc0000', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>{alertCount}</span>
              )}
            </div>
          ))}
        </nav>

        <div style={{ padding: '15px 20px', borderTop: '1px solid #30363d', fontSize: '12px' }}>
          <div style={{ color: '#8b949e', marginBottom: '8px' }}>SYSTEM STATUS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isRunning ? '#00cc44' : '#ff3333' }} />
            <span style={{ color: isRunning ? '#00cc44' : '#ff3333' }}>{isRunning ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
          <div style={{ color: '#555', fontSize: '11px', marginTop: '6px' }}>Scans: {scanCount}</div>
          <div style={{ color: '#555', fontSize: '11px', marginTop: '2px' }}>Alerts: {alertCount}</div>
          <div style={{ color: '#555', fontSize: '11px', marginTop: '2px' }}>Registered: {registeredFaces.length}</div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, marginLeft: '220px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* TOP BAR */}
        <div style={{ padding: '15px 25px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161b22', position: 'sticky', top: 0, zIndex: 40 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>
              {activeNav === 'live' ? 'Live Surveillance' : activeNav === 'alerts' ? '🚨 Alerts' : activeNav === 'log' ? '📋 Activity Log' : '⚙️ Settings'}
            </h2>
            <p style={{ margin: 0, color: '#8b949e', fontSize: '12px' }}>Real-Time AI Monitoring & Threat Analysis</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {alertCount > 0 && (
              <div style={{ backgroundColor: '#cc0000', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                🚨 {alertCount} Alerts
              </div>
            )}
            <div style={{ color: '#8b949e', fontSize: '13px' }}>🕐 {currentTime.toLocaleTimeString()}</div>
          </div>
        </div>

        {/* PIPELINE BAR */}
        {activeNav === 'live' && (
          <div style={{ padding: '12px 25px', backgroundColor: '#161b22', borderBottom: '1px solid #30363d' }}>
            <div style={{ color: '#8b949e', fontSize: '11px', marginBottom: '8px' }}>Processing Pipeline</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {PIPELINE.map((step, idx) => (
                <React.Fragment key={step}>
                  <div style={{ padding: '6px 14px', borderRadius: '6px', whiteSpace: 'nowrap', backgroundColor: pipelineStep === idx + 1 ? '#1f6feb' : pipelineStep > idx + 1 ? '#238636' : '#21262d', color: pipelineStep >= idx + 1 ? 'white' : '#8b949e', fontSize: '12px', fontWeight: pipelineStep === idx + 1 ? 'bold' : 'normal', transition: 'all 0.3s' }}>
                    {PIPELINE_ICONS[idx]} {step}
                  </div>
                  {idx < PIPELINE.length - 1 && (
                    <div style={{ flex: 1, height: '2px', margin: '0 4px', backgroundColor: pipelineStep > idx + 1 ? '#238636' : '#30363d', transition: 'all 0.3s' }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <div style={{ flex: 1, overflow: 'hidden' }}>

          {/* ── LIVE MONITORING ── */}
          {activeNav === 'live' && (
            <div style={{ display: 'flex', gap: '16px', padding: '16px 20px', height: 'calc(100vh - 145px)' }}>

              {/* LEFT — Webcam */}
              <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
                <div style={{ backgroundColor: '#161b22', borderRadius: '10px', border: '1px solid #30363d', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>

                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d' }}>
                    <span style={{ color: '#8b949e', fontSize: '13px' }}>📷 Camera Feed</span>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {isRunning && <span style={{ color: '#ff3333', fontSize: '12px', fontWeight: 'bold' }}>● REC</span>}
                      <span style={{ color: '#8b949e', fontSize: '12px' }}>{currentTime.toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Webcam */}
                  <div style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}>
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      videoConstraints={{ facingMode: 'user' }}
                    />
                  </div>

                  {/* Latest detection bar */}
                  {latestDetection && (
                    <div style={{ padding: '10px 14px', backgroundColor: '#0d1117', borderTop: '1px solid #30363d', borderLeft: `4px solid ${getLabelColor(latestDetection.label)}` }}>
                      <div style={{ color: '#8b949e', fontSize: '11px' }}>LATEST DETECTION</div>
                      <div style={{ color: getLabelColor(latestDetection.label), fontWeight: 'bold', fontSize: '15px' }}>
                        {getLabelIcon(latestDetection.label)} {getLabelText(latestDetection.label)}
                      </div>
                    </div>
                  )}

                  {/* Start / Stop */}
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #30363d' }}>
                    <span style={{ color: '#555', fontSize: '12px' }}>📍 FRONT DOOR ENTRANCE</span>
                    <button onClick={isRunning ? stopDetection : startDetection} style={{ padding: '7px 20px', backgroundColor: isRunning ? '#cc0000' : '#238636', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                      {isRunning ? '⏹ Stop' : '▶ Start'}
                    </button>
                  </div>
                </div>
              </div>

              {/* MIDDLE — AI Engine */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ backgroundColor: '#161b22', borderRadius: '10px', border: '1px solid #30363d', padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#e6edf3' }}>🧠 AI Detection Engine</h3>

                  {DETECTION_CATEGORIES.map((item) => {
                    const isActive = latestDetection?.label === item.label ||
                      (item.label === 'family' && latestDetection?.label?.includes('family'));
                    return (
                      <div key={item.label} style={{ padding: '10px 14px', marginBottom: '8px', borderRadius: '8px', backgroundColor: isActive ? '#1f2937' : '#21262d', border: `1px solid ${isActive ? getLabelColor(item.label) : '#30363d'}`, display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s' }}>
                        <span style={{ fontSize: '18px' }}>{item.icon}</span>
                        <span style={{ color: isActive ? getLabelColor(item.label) : '#8b949e', fontSize: '13px', fontWeight: isActive ? 'bold' : 'normal', flex: 1 }}>{item.text}</span>
                        {isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getLabelColor(item.label) }} />}
                      </div>
                    );
                  })}

                  <div style={{ padding: '10px 14px', marginTop: 'auto', borderRadius: '8px', backgroundColor: '#21262d', border: '1px solid #30363d', color: '#8b949e', fontSize: '13px', textAlign: 'center' }}>
                    {isRunning ? '🔍 Scanning every 3 seconds...' : '⏸ Awaiting start'}
                  </div>

                  {latestDetection && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ color: '#8b949e', fontSize: '11px', marginBottom: '5px' }}>Confidence Level</div>
                      <div style={{ height: '5px', backgroundColor: '#21262d', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(Math.max(latestDetection.confidence || 70, 20), 100)}%`, backgroundColor: getLabelColor(latestDetection.label), borderRadius: '3px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT — Event Stream */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ backgroundColor: '#161b22', borderRadius: '10px', border: '1px solid #30363d', padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#e6edf3', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📊 Live Event Stream
                    {logs.length > 0 && <span style={{ backgroundColor: '#1f6feb', color: 'white', padding: '1px 7px', borderRadius: '10px', fontSize: '11px' }}>{logs.length}</span>}
                  </h3>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {logs.length === 0
                      ? (<div style={{ color: '#555', textAlign: 'center', padding: '40px 20px', border: '2px dashed #30363d', borderRadius: '8px' }}><div style={{ fontSize: '30px', marginBottom: '8px' }}>👁️</div><p style={{ fontSize: '13px' }}>No events yet</p><p style={{ fontSize: '12px', color: '#444' }}>Start surveillance to monitor</p></div>)
                      : logs.map((log) => (
                        <div key={log.id} style={{ padding: '9px 12px', marginBottom: '7px', borderRadius: '8px', backgroundColor: '#21262d', borderLeft: `3px solid ${getLabelColor(log.label)}` }}>
                          <div style={{ color: '#8b949e', fontSize: '11px', marginBottom: '3px' }}>{log.time}</div>
                          <div style={{ color: getLabelColor(log.label), fontSize: '13px', fontWeight: 'bold' }}>{getLabelIcon(log.label)} {getLabelText(log.label)}</div>
                          {log.high_priority && <span style={{ backgroundColor: '#cc0000', color: 'white', padding: '1px 6px', borderRadius: '3px', fontSize: '10px', marginTop: '4px', display: 'inline-block' }}>🚨 HIGH PRIORITY</span>}
                          {!log.alert && <span style={{ backgroundColor: '#0d3321', color: '#00cc44', padding: '1px 6px', borderRadius: '3px', fontSize: '10px', marginTop: '4px', display: 'inline-block' }}>✅ SAFE</span>}
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ALERTS PAGE */}
          {activeNav === 'alerts' && (
            <div style={{ padding: '30px', overflowY: 'auto', height: '100%' }}>
              <h2 style={{ color: '#e6edf3', marginBottom: '5px' }}>🚨 Alerts</h2>
              <p style={{ color: '#8b949e', marginBottom: '20px' }}>All triggered alerts this session</p>
              {logs.filter(l => l.alert).length === 0
                ? (<div style={{ color: '#555', textAlign: 'center', padding: '60px 20px', border: '2px dashed #30363d', borderRadius: '8px' }}><div style={{ fontSize: '40px' }}>✅</div><p>No alerts triggered yet</p></div>)
                : logs.filter(l => l.alert).map(log => (
                  <div key={log.id} style={{ backgroundColor: '#161b22', border: `1px solid ${getLabelColor(log.label)}`, borderRadius: '10px', padding: '15px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: getLabelColor(log.label), fontWeight: 'bold', fontSize: '16px' }}>{getLabelIcon(log.label)} {getLabelText(log.label)}</span>
                      <span style={{ color: '#8b949e', fontSize: '12px' }}>{log.time}</span>
                    </div>
                    {log.high_priority && <span style={{ backgroundColor: '#cc0000', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginTop: '6px', display: 'inline-block' }}>🚨 HIGH PRIORITY</span>}
                  </div>
                ))
              }
            </div>
          )}

          {/* ACTIVITY LOG */}
          {activeNav === 'log' && (
            <div style={{ padding: '30px', overflowY: 'auto', height: '100%' }}>
              <h2 style={{ color: '#e6edf3', marginBottom: '5px' }}>📋 Activity Log</h2>
              <p style={{ color: '#8b949e', marginBottom: '20px' }}>Complete detection history — {logs.length} events</p>
              {logs.length === 0
                ? (<div style={{ color: '#555', textAlign: 'center', padding: '60px 20px', border: '2px dashed #30363d', borderRadius: '8px' }}><div style={{ fontSize: '40px' }}>📋</div><p>No activity yet.</p></div>)
                : (<table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '1px solid #30363d' }}>{['Time','Detection','Status','Priority'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#8b949e', fontSize: '12px', fontWeight: 'normal' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #21262d' }}>
                          <td style={{ padding: '10px 12px', color: '#8b949e', fontSize: '13px' }}>{log.time}</td>
                          <td style={{ padding: '10px 12px' }}><span style={{ color: getLabelColor(log.label), fontWeight: 'bold', fontSize: '13px' }}>{getLabelIcon(log.label)} {getLabelText(log.label)}</span></td>
                          <td style={{ padding: '10px 12px' }}>{log.alert ? <span style={{ backgroundColor: '#3d1a1a', color: '#ff6666', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>⚠️ ALERT</span> : <span style={{ backgroundColor: '#0d3321', color: '#00cc44', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>✅ SAFE</span>}</td>
                          <td style={{ padding: '10px 12px' }}>{log.high_priority ? <span style={{ color: '#ff3333', fontSize: '11px' }}>🔴 HIGH</span> : <span style={{ color: '#555', fontSize: '11px' }}>— Normal</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>)
              }
            </div>
          )}

          {/* SETTINGS */}
          {activeNav === 'settings' && (
            <SettingsPage registeredFaces={registeredFaces} onRegister={handleRegister} />
          )}
        </div>
      </div>

      {/* ── ALARM POPUP ── */}
      {showAlarm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#0d1117', border: '3px solid #ff0000', borderRadius: '16px', padding: '28px', textAlign: 'center', maxWidth: '420px', width: '95%' }}>
            <div style={{ fontSize: '56px', marginBottom: '8px' }}>🚨</div>
            <h2 style={{ color: '#ff3333', fontSize: '26px', margin: '0 0 8px 0' }}>INTRUDER ALERT!</h2>
            <p style={{ color: '#ffaaaa', fontSize: '14px', marginBottom: '24px' }}>Unknown person detected at entrance</p>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>

  <button
    onClick={async () => {
      await fetch(`${BACKEND}/call-police`, { method: "POST" });
      dismissAlarm();
    }}
    style={{
      padding: '12px',
      backgroundColor: '#ff0000',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold'
    }}
  >
    🚔 Call Police
  </button>

  <button
    onClick={async () => {
      await fetch(`${BACKEND}/call-family`, { method: "POST" });
      dismissAlarm();
    }}
    style={{
      padding: '12px',
      backgroundColor: '#ff8800',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold'
    }}
  >
    👨‍👩‍👧 Alert Family Members
  </button>

  <button
    onClick={dismissAlarm}
    style={{
      padding: '12px',
      backgroundColor: '#21262d',
      color: 'white',
      border: '1px solid #30363d',
      borderRadius: '8px'
    }}
  >
    ✓ Dismiss
  </button>

</div>
          </div>
        </div>
      )}

    </div>
  )
 
  }
