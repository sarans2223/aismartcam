import React from 'react';

export default function DetectionResults({ results }) {
  if (!results) return null;

  if (results.error) {
    return (
      <div className="results-container error">
        <h3>❌ Error</h3>
        <p>{results.error}</p>
      </div>
    );
  }

  const getLabelColor = (label) => {
    if (label?.includes('family')) return '#00cc44';
    if (label === 'swiggy') return '#ff6600';
    if (label === 'zomato') return '#cc0000';
    if (label === 'postman_or_police') return '#0066cc';
    return '#ff0000';
  };

  const getLabelIcon = (label) => {
    if (label?.includes('family')) return '👤';
    if (label === 'swiggy') return '🛵';
    if (label === 'zomato') return '🍕';
    if (label === 'postman_or_police') return '👮';
    return '⚠️';
  };

  const getLabelText = (label) => {
    if (label?.includes('family')) return `Family Member: ${label.replace('family_', '')}`;
    if (label === 'swiggy') return 'Swiggy Delivery Agent';
    if (label === 'zomato') return 'Zomato Delivery Agent';
    if (label === 'postman_or_police') return 'Postman / Police';
    return 'Unknown Person ⚠️';
  };

  return (
    <div className="results-container">
      <h3>🔍 Detection Results</h3>

      <div className="detection-item" style={{
        borderLeft: `4px solid ${getLabelColor(results.label)}`,
        padding: '15px',
        margin: '10px 0',
        backgroundColor: '#1a1a2e',
        borderRadius: '8px'
      }}>
        <h2 style={{ color: getLabelColor(results.label) }}>
          {getLabelIcon(results.label)} {getLabelText(results.label)}
        </h2>

        <p>⏰ Time: <strong>{new Date(results.timestamp).toLocaleString()}</strong></p>

        {results.confidence > 0 && (
          <p>🎯 Confidence: <strong>{results.confidence}%</strong></p>
        )}

        {results.alert && (
          <div style={{
            backgroundColor: results.high_priority ? '#cc0000' : '#ff6600',
            padding: '10px',
            borderRadius: '6px',
            marginTop: '10px'
          }}>
            {results.high_priority
              ? '🚨 HIGH PRIORITY ALERT — Unknown person detected at night!'
              : '⚠️ ALERT — Unrecognized person detected!'}
          </div>
        )}

        {!results.alert && (
          <div style={{
            backgroundColor: '#006600',
            padding: '10px',
            borderRadius: '6px',
            marginTop: '10px'
          }}>
            ✅ Known person — No alert triggered
          </div>
        )}
      </div>
    </div>
  );
}