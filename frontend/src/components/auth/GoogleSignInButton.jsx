import { useEffect, useRef, useState } from 'react';

const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client?hl=en';
let scriptLoadPromise;

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GOOGLE_IDENTITY_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => {
        scriptLoadPromise = undefined;
        reject(new Error('Google sign-in could not load.'));
      };
      document.head.appendChild(script);
    });
  }

  return scriptLoadPromise;
}

export default function GoogleSignInButton({ onCredential, disabled = false }) {
  const mountRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return undefined;
    let active = true;

    loadGoogleIdentityScript()
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });

    return () => { active = false; };
  }, [clientId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!ready || !mount || !window.google?.accounts?.id) return undefined;

    const identity = window.google.accounts.id;
    identity.initialize({
      client_id: clientId,
      auto_select: false,
      callback: (response) => {
        if (response?.credential) void callbackRef.current(response.credential);
      },
    });
    identity.renderButton(mount, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      locale: 'en',
      shape: 'rectangular',
      width: Math.max(240, Math.min(mount.clientWidth || 360, 400)),
    });

    return () => mount.replaceChildren();
  }, [clientId, ready]);

  if (!clientId) return null;

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''} aria-disabled={disabled}>
      {!ready && !loadError && <p className="py-3 text-center text-sm text-muted" role="status">Loading Google sign-in…</p>}
      {loadError && <p className="py-3 text-center text-sm text-muted" role="status">Google sign-in is temporarily unavailable. Use email and password instead.</p>}
      <div ref={mountRef} className="flex min-h-10 justify-center" />
    </div>
  );
}
