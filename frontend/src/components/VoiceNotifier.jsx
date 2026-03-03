import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function VoiceNotifier({ detection }) {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const lastSpokenRef = useRef({ label: null, time: 0 });

  const speak = useCallback((message, priority = 'normal') => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    // cancel previous speech per requirement
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(message);

    if (priority === 'high') {
      // more serious: lower pitch, normal rate, full volume
      utter.pitch = 0.7;
      utter.rate = 1.0;
      utter.volume = 1.0;
    } else {
      // calm: normal pitch, slightly softer
      utter.pitch = 1.0;
      utter.rate = 0.95;
      utter.volume = 0.8;
    }

    window.speechSynthesis.speak(utter);
  }, [voiceEnabled]);

  useEffect(() => {
    if (!detection) return;

    const now = Date.now();
    const { label, high_priority } = detection;

    // debounce same label within 5 seconds
    if (lastSpokenRef.current.label === label && now - lastSpokenRef.current.time < 5000) {
      return;
    }

    let message = '';
    let priority = 'normal';

    if (label && label.startsWith('family_')) {
      const name = label.replace(/^family_/, '');
      message = `Hello ${name}, welcome home.`;
    } else if (label === 'swiggy') {
      message = 'Swiggy delivery agent has arrived.';
    } else if (label === 'zomato') {
      message = 'Zomato delivery agent has arrived.';
    } else if (label === 'postman_or_police') {
      message = 'Official personnel detected.';
      priority = 'high';
    } else if (label === 'unknown') {
      if (high_priority) {
        message = 'High priority threat detected at night.';
        priority = 'high';
      } else {
        message = 'Unknown person detected.';
      }
    }

    if (message) {
      speak(message, priority);
      lastSpokenRef.current = { label, time: now };
    }
  }, [detection, speak]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={() => setVoiceEnabled((v) => !v)}>
        {voiceEnabled ? 'Disable Voice' : 'Enable Voice'}
      </button>
    </div>
  );
}
