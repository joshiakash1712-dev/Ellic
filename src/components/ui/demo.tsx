import React, { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

// Robust Zod Schema for Neural Access Login Credentials
export const neuralAccessSchema = z.object({
  userIdentity: z
    .string()
    .trim()
    .min(1, 'User Identity node is required.')
    .min(3, 'Identity node must be at least 3 characters.')
    .max(32, 'Identity node cannot exceed 32 characters.')
    .regex(
      /^[A-Za-z0-9-_.]+$/,
      'Format error: letters, numbers, hyphens, and dots only (e.g. ID-492-BASE)'
    ),
  sequenceKey: z
    .string()
    .min(1, 'Sequence Key is required.')
    .min(6, 'Sequence Key must be at least 6 characters.')
    .max(64, 'Sequence Key cannot exceed 64 characters.')
    .regex(/[A-Za-z]/, 'Sequence Key must contain at least one letter.')
    .regex(/[0-9]/, 'Sequence Key must contain at least one numeric digit.'),
});

export type NeuralAccessFormData = z.infer<typeof neuralAccessSchema>;

export interface MercuryLoginProps {
  onSuccess?: (data: NeuralAccessFormData) => void;
  className?: string;
}

const MercuryLogin: React.FC<MercuryLoginProps> = ({ onSuccess }) => {
  // Form State
  const [formData, setFormData] = useState<NeuralAccessFormData>({
    userIdentity: '',
    sequenceKey: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NeuralAccessFormData, string>>>({});
  const [touched, setTouched] = useState<Record<keyof NeuralAccessFormData, boolean>>({
    userIdentity: false,
    sequenceKey: false,
  });

  const [streamStatus, setStreamStatus] = useState<
    'idle' | 'streaming' | 'authenticated' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Field input refs for focus management on validation failure
  const identityInputRef = useRef<HTMLInputElement | null>(null);
  const sequenceInputRef = useRef<HTMLInputElement | null>(null);

  // Generate static random values once per mount to prevent hydration errors
  const blobsData = useMemo(() => {
    return Array.from({ length: 6 }).map(() => ({
      size: Math.random() * 200 + 150,
      left: Math.random() * 80 + 10,
      top: Math.random() * 80 + 10,
      animationDelay: Math.random() * -20,
      animationDuration: Math.random() * 15 + 15,
    }));
  }, []);

  // Keep track of the blob DOM elements for high-performance updates
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      // Apply subtle parallax effect to each blob
      blobRefs.current.forEach((blob, index) => {
        if (blob) {
          const speed = (index + 1) * 20;
          blob.style.marginLeft = `${x * speed}px`;
          blob.style.marginTop = `${y * speed}px`;
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Single Field Validation Helper
  const validateField = (field: keyof NeuralAccessFormData, value: string) => {
    const fieldSchema = neuralAccessSchema.shape[field];
    const result = fieldSchema.safeParse(value);

    setErrors((prev) => {
      const updated = { ...prev };
      if (!result.success) {
        updated[field] = result.error.issues[0]?.message || 'Invalid entry';
      } else {
        delete updated[field];
      }
      return updated;
    });

    return result.success;
  };

  // Handle Input Change
  const handleChange = (field: keyof NeuralAccessFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (statusMessage) {
      setStatusMessage(null);
      setStreamStatus('idle');
    }

    // Re-validate dynamically if field was already blurred/touched
    if (touched[field]) {
      validateField(field, value);
    }
  };

  // Handle Input Blur
  const handleBlur = (field: keyof NeuralAccessFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  // Handle Form Submission with Zod Validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      userIdentity: true,
      sequenceKey: true,
    });

    const result = neuralAccessSchema.safeParse(formData);

    if (!result.success) {
      const formattedErrors: Partial<Record<keyof NeuralAccessFormData, string>> = {};
      result.error.issues.forEach((err) => {
        const fieldName = err.path[0] as keyof NeuralAccessFormData;
        if (fieldName && !formattedErrors[fieldName]) {
          formattedErrors[fieldName] = err.message;
        }
      });

      setErrors(formattedErrors);
      setStreamStatus('error');
      setStatusMessage('Validation failed. Please correct the node parameters highlighted below.');

      // Focus first erroneous field
      if (formattedErrors.userIdentity) {
        identityInputRef.current?.focus();
      } else if (formattedErrors.sequenceKey) {
        sequenceInputRef.current?.focus();
      }
      return;
    }

    // Clear errors and simulate neural handshake stream
    setErrors({});
    setStreamStatus('streaming');
    setStatusMessage('Synchronizing biometric handshake with Neural Node 0x992...');

    setTimeout(() => {
      setStreamStatus('authenticated');
      setStatusMessage(`Stream established for node [${result.data.userIdentity}]. Access granted.`);
      if (onSuccess) {
        onSuccess(result.data);
      }
    }, 1200);
  };

  const isUserIdentityInvalid = touched.userIdentity && Boolean(errors.userIdentity);
  const isUserIdentityValid = touched.userIdentity && !errors.userIdentity && formData.userIdentity.length >= 3;

  const isSequenceKeyInvalid = touched.sequenceKey && Boolean(errors.sequenceKey);
  const isSequenceKeyValid = touched.sequenceKey && !errors.sequenceKey && formData.sequenceKey.length >= 6;

  return (
    <div className="mercury-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

        :root {
          --bg: #050505;
          --mercury: #e0e0e0;
          --mercury-dark: #666666;
          --accent: #ffffff;
          --text-dim: rgba(255, 255, 255, 0.5);
          --filter-goo: url('#gooey');
          --neon-error: #f43f5e;
          --neon-valid: #10b981;
          --neon-stream: #38bdf8;
        }

        .mercury-wrapper {
          background-color: var(--bg);
          color: var(--accent);
          font-family: 'Inter', sans-serif;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .mercury-wrapper * {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }

        /* Background Liquid Physics Simulation */
        .stage {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
          filter: var(--filter-goo);
          opacity: 0.6;
        }

        .blob {
          position: absolute;
          background: linear-gradient(135deg, var(--mercury), #888);
          border-radius: 50%;
          filter: blur(20px);
          animation: float 20s infinite alternate ease-in-out;
          box-shadow: inset -10px -10px 20px rgba(0,0,0,0.5), 
                      10px 10px 30px rgba(255,255,255,0.2);
          transition: margin 0.1s ease-out;
        }

        /* Interface Container */
        .auth-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 36px;
        }

        .header {
          margin-bottom: 40px;
          text-align: left;
        }

        .brand-id {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
          display: block;
        }

        .header h1 {
          font-weight: 800;
          font-size: 3rem;
          line-height: 0.9;
          letter-spacing: -2px;
          margin-left: -4px;
          margin-top: 0;
        }

        /* Form Elements & Error States */
        .form-group {
          position: relative;
          margin-bottom: 26px;
          transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
        }

        .form-group:focus-within {
          transform: translateX(8px);
        }

        .form-group label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .form-group.has-error label {
          color: var(--neon-error);
        }

        .input-row {
          position: relative;
          display: flex;
          align-items: center;
        }

        .form-group input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--accent);
          padding: 10px 0;
          font-size: 17px;
          outline: none;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.3s, color 0.3s;
        }

        .form-group.has-error input {
          border-bottom-color: var(--neon-error);
          color: #ffe4e6;
        }

        .input-glow {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0%;
          height: 2px;
          background: var(--mercury);
          transition: width 0.5s cubic-bezier(0.2, 1, 0.3, 1), background-color 0.3s;
          box-shadow: 0 0 15px var(--mercury);
        }

        .form-group input:focus + .input-glow {
          width: 100%;
        }

        .form-group.has-error .input-glow {
          width: 100%;
          background: var(--neon-error);
          box-shadow: 0 0 14px rgba(244, 63, 94, 0.7);
        }

        .form-group.is-valid .input-glow {
          background: var(--neon-valid);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
        }

        .toggle-visibility-btn {
          position: absolute;
          right: 0;
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 4px 6px;
          border-radius: 4px;
          transition: color 0.2s, background-color 0.2s;
        }

        .toggle-visibility-btn:hover {
          color: var(--accent);
          background: rgba(255, 255, 255, 0.08);
        }

        /* Error and Validation Feedback Display */
        .field-feedback-error {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--neon-error);
          letter-spacing: 0.25px;
          animation: feedbackEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .field-feedback-valid {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--neon-valid);
          letter-spacing: 0.25px;
        }

        .feedback-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          font-size: 9px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .feedback-badge.error {
          background: rgba(244, 63, 94, 0.2);
          border: 1px solid var(--neon-error);
          color: var(--neon-error);
        }

        .feedback-badge.valid {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid var(--neon-valid);
          color: var(--neon-valid);
        }

        /* Status Banner */
        .neural-status-banner {
          margin-top: 14px;
          padding: 10px 14px;
          border-radius: 6px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          line-height: 1.4;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          animation: feedbackEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .neural-status-banner.error {
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.35);
          color: #fca5a5;
        }

        .neural-status-banner.streaming {
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #7dd3fc;
        }

        .neural-status-banner.authenticated {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #6ee7b7;
        }

        @keyframes feedbackEnter {
          from {
            opacity: 0;
            transform: translateY(-3px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* The Mercury Button */
        .submit-wrap {
          margin-top: 36px;
          position: relative;
          filter: var(--filter-goo);
        }

        .btn-base {
          background: var(--accent);
          color: #000;
          border: none;
          padding: 18px 36px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          width: 100%;
          position: relative;
          z-index: 2;
          transition: letter-spacing 0.3s, background-color 0.2s;
        }

        .btn-base:hover:not(:disabled) {
          letter-spacing: 3.5px;
        }

        .btn-base:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .mercury-drop {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background: var(--mercury);
          transform: translate(-50%, -50%);
          z-index: 1;
          border-radius: 50px;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .submit-wrap:hover .mercury-drop {
          transform: translate(-50%, -50%) scale(1.04, 1.18);
          filter: brightness(1.2);
        }

        /* Footer */
        .footer-nav {
          margin-top: 36px;
          display: flex;
          justify-content: space-between;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
        }

        .footer-nav a, .footer-nav button {
          color: var(--text-dim);
          text-decoration: none;
          background: transparent;
          border: none;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          cursor: pointer;
          transition: color 0.3s;
          padding: 0;
        }

        .footer-nav a:hover, .footer-nav button:hover {
          color: var(--accent);
        }

        /* Hidden SVG Filter */
        .svg-filter-hidden {
          position: absolute;
          width: 0;
          height: 0;
        }
      `}</style>

      <svg className="svg-filter-hidden">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="stage" id="stage">
        {blobsData.map((data, index) => (
          <div
            key={index}
            ref={(el) => (blobRefs.current[index] = el)}
            className="blob"
            style={{
              width: `${data.size}px`,
              height: `${data.size}px`,
              left: `${data.left}%`,
              top: `${data.top}%`,
              animationDelay: `${data.animationDelay}s`,
              animationDuration: `${data.animationDuration}s`,
            }}
          />
        ))}
      </div>

      <main className="auth-container">
        <header className="header">
          <span className="brand-id">System Node: 0x992</span>
          <h1>
            NEURAL
            <br />
            ACCESS
          </h1>
        </header>

        <form autoComplete="off" onSubmit={handleSubmit} noValidate>
          {/* Field 1: User Identity Node */}
          <div
            className={`form-group ${isUserIdentityInvalid ? 'has-error' : isUserIdentityValid ? 'is-valid' : ''}`}
          >
            <label htmlFor="neural-user-identity">
              <span>User Identity</span>
              {isUserIdentityValid && (
                <span className="text-[9px] text-emerald-400 font-mono tracking-wider">
                  VERIFIED
                </span>
              )}
            </label>
            <div className="input-row">
              <input
                id="neural-user-identity"
                ref={identityInputRef}
                type="text"
                placeholder="ID-492-BASE"
                value={formData.userIdentity}
                onChange={(e) => handleChange('userIdentity', e.target.value)}
                onBlur={() => handleBlur('userIdentity')}
                aria-invalid={isUserIdentityInvalid}
                aria-describedby={isUserIdentityInvalid ? 'user-identity-error' : undefined}
                required
              />
              <div className="input-glow"></div>
            </div>

            {/* Error Feedback */}
            {isUserIdentityInvalid && (
              <div id="user-identity-error" className="field-feedback-error" role="alert">
                <span className="feedback-badge error">!</span>
                <span>{errors.userIdentity}</span>
              </div>
            )}

            {/* Valid Feedback */}
            {isUserIdentityValid && (
              <div className="field-feedback-valid">
                <span className="feedback-badge valid">✓</span>
                <span>Node identifier verified</span>
              </div>
            )}
          </div>

          {/* Field 2: Sequence Key */}
          <div
            className={`form-group ${isSequenceKeyInvalid ? 'has-error' : isSequenceKeyValid ? 'is-valid' : ''}`}
          >
            <label htmlFor="neural-sequence-key">
              <span>Sequence Key</span>
              {isSequenceKeyValid && (
                <span className="text-[9px] text-emerald-400 font-mono tracking-wider">
                  SECURE
                </span>
              )}
            </label>
            <div className="input-row">
              <input
                id="neural-sequence-key"
                ref={sequenceInputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.sequenceKey}
                onChange={(e) => handleChange('sequenceKey', e.target.value)}
                onBlur={() => handleBlur('sequenceKey')}
                aria-invalid={isSequenceKeyInvalid}
                aria-describedby={isSequenceKeyInvalid ? 'sequence-key-error' : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-visibility-btn"
                aria-label={showPassword ? 'Hide sequence key' : 'Show sequence key'}
              >
                {showPassword ? 'MASK' : 'VIEW'}
              </button>
              <div className="input-glow"></div>
            </div>

            {/* Error Feedback */}
            {isSequenceKeyInvalid && (
              <div id="sequence-key-error" className="field-feedback-error" role="alert">
                <span className="feedback-badge error">!</span>
                <span>{errors.sequenceKey}</span>
              </div>
            )}

            {/* Valid Feedback */}
            {isSequenceKeyValid && (
              <div className="field-feedback-valid">
                <span className="feedback-badge valid">✓</span>
                <span>Complexity requirements fulfilled</span>
              </div>
            )}
          </div>

          {/* Stream Status Banner */}
          {statusMessage && (
            <div
              className={`neural-status-banner ${streamStatus}`}
              role={streamStatus === 'error' ? 'alert' : 'status'}
            >
              <span className="font-bold">
                {streamStatus === 'error'
                  ? '[HALT]'
                  : streamStatus === 'streaming'
                  ? '[CONNECTING]'
                  : '[SYNCHRONIZED]'}
              </span>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* The Mercury Button */}
          <div className="submit-wrap">
            <div className="mercury-drop"></div>
            <button
              type="submit"
              disabled={streamStatus === 'streaming'}
              className="btn-base"
            >
              {streamStatus === 'streaming' ? 'Initializing Stream...' : 'Initialize Stream'}
            </button>
          </div>
        </form>

        <footer className="footer-nav">
          <button
            type="button"
            onClick={() => {
              setFormData({ userIdentity: 'ID-492-BASE', sequenceKey: 'Omega9NodeX' });
              setErrors({});
              setTouched({ userIdentity: true, sequenceKey: true });
            }}
          >
            AUTO-FILL SAMPLE NODE
          </button>
          <a href="#encrypted">ENCRYPTED RECOVERY</a>
          <a href="#archive">NEW ARCHIVE</a>
        </footer>
      </main>
    </div>
  );
};

export default MercuryLogin;
export { MercuryLogin, MercuryLogin as NeuralAccessLogin };
