'use client';

import React, { useEffect, useState } from 'react';

interface ImpersonateStatus {
  active: boolean;
  entrepriseId?: string;
  nomSociete?: string;
}

export default function ImpersonationBanner() {
  const [status, setStatus] = useState<ImpersonateStatus>({ active: false });
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/adminsuper/impersonate', { credentials: 'include' });
      if (!res.ok) {
        setStatus({ active: false });
        return;
      }
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ active: false });
    }
  };

  useEffect(() => {
    // Only super-admins can impersonate a tenant; avoid a 403 for regular admins.
    fetch('/api/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.type === 'adminsuper') {
          fetchStatus();
        }
      });
  }, []);

  const handleQuitter = async () => {
    setLoading(true);
    try {
      await fetch('/api/adminsuper/impersonate', {
        method: 'DELETE',
        credentials: 'include',
      });
      setStatus({ active: false });
      window.location.href = '/dashboard/parametres/entreprise';
    } finally {
      setLoading(false);
    }
  };

  if (!status.active) return null;

  return (
    <div
      className="d-flex align-items-center justify-content-between px-3 py-2"
      style={{ backgroundColor: '#fff3cd', borderBottom: '1px solid #ffe69c' }}
    >
      <span>
        <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i>
        Mode support : vous consultez les données de <strong>{status.nomSociete}</strong>
      </span>
      <button
        className="btn btn-sm btn-outline-dark"
        onClick={handleQuitter}
        disabled={loading}
      >
        Quitter le mode support
      </button>
    </div>
  );
}
