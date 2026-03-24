import React, { useEffect, useState } from 'react';

interface EntrepriseInfo {
  LogoE?: string;
  EnteteSociete?: string;
  PiedPageSociete?: string;
}

interface EntrepriseHeaderFooterProps {
  type?: 'header' | 'footer' | 'both';
  showFallback?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const EntrepriseHeaderFooter: React.FC<EntrepriseHeaderFooterProps> = ({ 
  type = 'both', 
  showFallback = true,
  className = '',
  style = {}
}) => {
  const [entreprise, setEntreprise] = useState<EntrepriseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadEntreprise = async () => {
      try {
        // Récupérer l'IdEntreprise depuis le localStorage
        if (typeof window !== 'undefined') {
          const idEntreprise = localStorage.getItem('IdEntreprise');
          if (idEntreprise) {
            try {
              // Charger les données de l'entreprise depuis l'API avec l'ID
              const res = await fetch(`/api/entreprise/${idEntreprise}`);
              if (res.ok) {
                const data = await res.json();
                if (!cancelled && data) {
                  setEntreprise(data);
                  setLoading(false);
                  return;
                }
              }
            } catch (e) {
              console.error('Erreur chargement entreprise par ID:', e);
            }
          }
        }

        // Si pas d'IdEntreprise ou erreur, charger la première entreprise disponible
        const res = await fetch('/api/entreprise');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setEntreprise(data[0]);
          
          // Sauvegarder l'ID dans localStorage pour les prochaines fois
          if (typeof window !== 'undefined' && data[0]._id) {
            localStorage.setItem('IdEntreprise', data[0]._id);
          }
        }
      } catch (error) {
        console.error('Erreur chargement entreprise:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEntreprise();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return null;
  }

  const renderHeader = () => {
    if (!entreprise?.LogoE && !entreprise?.EnteteSociete) {
      if (!showFallback) return null;
      return (
        <div className={`text-center mb-3 ${className}`} style={style}>
          <div style={{ fontWeight: 'bold', fontSize: 22, color: '#00AEEF' }}>
            CENTRE MÉDICAL
          </div>
        </div>
      );
    }

    return (
      <div className={`d-flex align-items-center justify-content-center mb-3 ${className}`} style={style}>
        {entreprise?.LogoE && (
          <div style={{ textAlign: 'center', marginRight: '20px' }}>
            <img
              src={entreprise.LogoE}
              alt="Logo"
              style={{
                maxHeight: 120,
                maxWidth: '120px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}
        {entreprise?.EnteteSociete && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 14,
              color: '#666',
              flex: 1,
            }}
            dangerouslySetInnerHTML={{ __html: entreprise.EnteteSociete }}
          />
        )}
      </div>
    );
  };

  const renderFooter = () => {
    if (!entreprise?.PiedPageSociete) {
      if (!showFallback) return null;
      return (
        <div className={`text-center mt-4 ${className}`} style={style}>
          <div style={{ fontSize: 12, fontStyle: 'italic' }}>
            Merci pour votre confiance
          </div>
        </div>
      );
    }

    return (
      <div
        className={`text-center mt-4 ${className}`}
        style={{
          marginTop: 10,
          fontSize: 11,
          borderTop: '1px solid #ccc',
          paddingTop: 10,
          ...style
        }}
        dangerouslySetInnerHTML={{ __html: entreprise.PiedPageSociete }}
      />
    );
  };

  if (type === 'header') return renderHeader();
  if (type === 'footer') return renderFooter();
  
  return (
    <>
      {renderHeader()}
      {renderFooter()}
    </>
  );
};

export default EntrepriseHeaderFooter;
