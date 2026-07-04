"use client";

export default function PitchResult({ pitch }: { pitch: string }) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      padding: '2rem',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)',
      border: '1px solid var(--border)'
    }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        Generated Pitch
      </h2>
      <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>
        {pitch}
      </div>
      <button 
        onClick={() => navigator.clipboard.writeText(pitch)}
        style={{
          marginTop: '1.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--foreground)',
          cursor: 'pointer',
          fontWeight: 500
        }}
      >
        Copy to Clipboard
      </button>
    </div>
  );
}
