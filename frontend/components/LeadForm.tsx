"use client";

import { useState } from "react";
import PitchResult from "./PitchResult";

export default function LeadForm() {
  const [loading, setLoading] = useState(false);
  const [pitch, setPitch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setPitch(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const company_name = formData.get("company_name") as string;
    const company_url = formData.get("company_url") as string;
    const context = formData.get("context") as string;

    try {
      const res = await fetch("http://localhost:8000/api/generate-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name, company_url, context }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate pitch. Ensure the backend is running.");
      }

      const data = await res.json();
      setPitch(data.pitch);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    background: 'var(--card-bg)',
    padding: '2rem',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid var(--border)'
  };

  const inputStyles: React.CSSProperties = {
    padding: '0.75rem',
    borderRadius: 'calc(var(--radius) - 2px)',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--foreground)',
    fontSize: '1rem',
    width: '100%',
    fontFamily: 'inherit'
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 500
  };

  const buttonStyles: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: 'calc(var(--radius) - 2px)',
    border: 'none',
    background: 'var(--primary)',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginTop: '1rem'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <form onSubmit={handleSubmit} style={formStyles}>
        <div>
          <label htmlFor="company_name" style={labelStyles}>Company Name *</label>
          <input 
            type="text" 
            id="company_name" 
            name="company_name" 
            required 
            style={inputStyles}
            placeholder="e.g. Acme Corp"
          />
        </div>
        
        <div>
          <label htmlFor="company_url" style={labelStyles}>Website URL</label>
          <input 
            type="url" 
            id="company_url" 
            name="company_url" 
            style={inputStyles}
            placeholder="e.g. https://acme.com"
          />
        </div>

        <div>
          <label htmlFor="context" style={labelStyles}>Additional Context / Value Prop</label>
          <textarea 
            id="context" 
            name="context" 
            rows={4} 
            style={{...inputStyles, resize: 'vertical'}}
            placeholder="Describe your services or specific angles you want to take..."
          />
        </div>

        <button 
          type="submit" 
          style={{...buttonStyles, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}
          disabled={loading}
        >
          {loading ? 'Analyzing & Generating Pitch...' : 'Generate Pitch'}
        </button>

        {error && (
          <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginTop: '1rem' }}>
            {error}
          </div>
        )}
      </form>

      {pitch && <PitchResult pitch={pitch} />}
    </div>
  );
}
