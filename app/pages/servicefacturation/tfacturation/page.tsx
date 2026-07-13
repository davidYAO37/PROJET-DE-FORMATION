'use client';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Spinner } from 'react-bootstrap';

const BASE = '/pages/servicefacturation';
const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

interface KpiHonoraires {
  totalNetAPayer: number;
  totalPaye: number;
  totalReste: number;
  count: number;
  countSoldes: number;
  countNonSoldes: number;
}

interface KpiAssurances {
  totalPartAssurance: number;
  totalPaye: number;
  totalReste: number;
  count: number;
  countDeposes: number;
  countNonDeposes: number;
  countRecouvres: number;
}

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export default function TableauDeBordFacturation() {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth()); // 0-11
  const [annee, setAnnee] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [kpiHono, setKpiHono] = useState<KpiHonoraires | null>(null);
  const [kpiAssur, setKpiAssur] = useState<KpiAssurances | null>(null);
  const [detailHono, setDetailHono] = useState<any[]>([]);
  const [detailAssur, setDetailAssur] = useState<any[]>([]);
  const [showDetailHono, setShowDetailHono] = useState(false);
  const [showDetailAssur, setShowDetailAssur] = useState(false);
  const [entrepriseId, setEntrepriseId] = useState('');

  useEffect(() => {
    setEntrepriseId(localStorage.getItem('IdEntreprise') || '');
  }, []);

  const charger = useCallback(async () => {
    setLoading(true);
    const debut = new Date(annee, mois, 1).toISOString().split('T')[0];
    const fin = new Date(annee, mois + 1, 0).toISOString().split('T')[0];
    const eid = entrepriseId;

    try {
      const [resH, resA] = await Promise.all([
        fetch(`/api/comptabilite/honoraires?dateDebut=${debut}&dateFin=${fin}&entrepriseId=${eid}`),
        fetch(`/api/comptabilite/factureAssurance?dateDebut=${debut}&dateFin=${fin}&entrepriseId=${eid}`),
      ]);

      if (resH.ok) {
        const j = await resH.json();
        const data: any[] = j.data || [];
        setDetailHono(data);
        setKpiHono({
          totalNetAPayer: j.totaux?.totalNetAPayer || 0,
          totalPaye: j.totaux?.totalPaye || 0,
          totalReste: j.totaux?.totalReste || 0,
          count: data.length,
          countSoldes: data.filter((h: any) => (h.resteAPayer || 0) <= 0).length,
          countNonSoldes: data.filter((h: any) => (h.resteAPayer || 0) > 0).length,
        });
      }

      if (resA.ok) {
        const j = await resA.json();
        const data: any[] = j.data || [];
        setDetailAssur(data);
        setKpiAssur({
          totalPartAssurance: j.totaux?.totalPartAssurance || 0,
          totalPaye: j.totaux?.totalPaye || 0,
          totalReste: j.totaux?.totalReste || 0,
          count: data.length,
          countDeposes: data.filter((f: any) => f.DateDepot).length,
          countNonDeposes: data.filter((f: any) => !f.DateDepot).length,
          countRecouvres: data.filter((f: any) => f.etat_facture).length,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [mois, annee, entrepriseId]);

  useEffect(() => {
    if (entrepriseId !== undefined) charger();
  }, [charger, entrepriseId]);

  const annees = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const KpiCard = ({ label, value, icon, color, isCount }: { label: string; value: number; icon: string; color: string; isCount?: boolean }) => (
    <div style={{ background: '#fff', borderRadius: 8, padding: '12px 14px', boxShadow: '0 1px 5px rgba(0,0,0,0.07)', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#90a4ae', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
        <i className={`bi ${icon}`} style={{ fontSize: '1rem', color, opacity: 0.4 }}></i>
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#37474f' }}>
        {loading ? <Spinner size="sm" animation="border" /> : isCount ? value : `${fmt(value)} F`}
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '16px' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1565c0 0%,#1976d2 50%,#42a5f5 100%)', borderRadius: 10, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(21,101,192,0.3)' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Module</div>
          <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800 }}>Service Facturation</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <i className="bi bi-receipt-cutoff" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.2)' }}></i>
      </div>

      {/* Sélecteur période */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 16px', marginBottom: 16, boxShadow: '0 1px 5px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <i className="bi bi-calendar3" style={{ color: '#1565c0', fontSize: '1rem' }}></i>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#546e7a', textTransform: 'uppercase', letterSpacing: 1 }}>Période :</span>
        <select
          value={mois}
          onChange={e => setMois(Number(e.target.value))}
          style={{ border: '1px solid #b0bec5', borderRadius: 6, padding: '4px 10px', fontSize: '0.8rem', color: '#37474f', cursor: 'pointer' }}
        >
          {MOIS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select
          value={annee}
          onChange={e => setAnnee(Number(e.target.value))}
          style={{ border: '1px solid #b0bec5', borderRadius: 6, padding: '4px 10px', fontSize: '0.8rem', color: '#37474f', cursor: 'pointer' }}
        >
          {annees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button
          onClick={charger}
          disabled={loading}
          style={{ background: 'linear-gradient(135deg,#1565c0,#42a5f5)', border: 'none', color: '#fff', borderRadius: 6, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {loading ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-arrow-clockwise"></i> Actualiser</>}
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#78909c', fontStyle: 'italic' }}>
          {MOIS[mois]} {annee}
        </span>
      </div>

      {/* === HONORAIRES === */}
      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 5px rgba(0,0,0,0.07)', marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-person-badge-fill" style={{ color: '#f9a825', fontSize: '1.1rem' }}></i>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#37474f', textTransform: 'uppercase', letterSpacing: 1 }}>Honoraires Médecins</span>
            {kpiHono && <span style={{ background: '#f9a825', color: '#fff', borderRadius: 10, fontSize: '0.6rem', fontWeight: 700, padding: '1px 7px' }}>{kpiHono.count}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setShowDetailHono(v => !v)} style={{ background: showDetailHono ? '#f9a825' : '#fff3e0', border: '1px solid #f9a825', borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, color: showDetailHono ? '#fff' : '#f57c00', cursor: 'pointer' }}>
              <i className={`bi ${showDetailHono ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>{showDetailHono ? 'Masquer' : 'Détail'}
            </button>
            <Link href={`${BASE}/honoraires`} style={{ background: '#e3f2fd', border: '1px solid #1565c0', borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#1565c0', textDecoration: 'none' }}>
              <i className="bi bi-box-arrow-up-right me-1"></i>Ouvrir
            </Link>
          </div>
        </div>
        <div style={{ padding: '10px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
            <KpiCard label="Médecins à payer" value={kpiHono?.countNonSoldes ?? 0} icon="bi-person-fill-exclamation" color="#f9a825" isCount />
            <KpiCard label="Total net à payer" value={kpiHono?.totalNetAPayer ?? 0} icon="bi-cash-coin" color="#1565c0" />
            <KpiCard label="Montant payé" value={kpiHono?.totalPaye ?? 0} icon="bi-check-circle-fill" color="#2e7d32" />
            <KpiCard label="Reste à payer" value={kpiHono?.totalReste ?? 0} icon="bi-hourglass-split" color="#b71c1c" />
            <KpiCard label="Fiches soldées" value={kpiHono?.countSoldes ?? 0} icon="bi-check2-all" color="#2e7d32" isCount />
            <KpiCard label="Non soldées" value={kpiHono?.countNonSoldes ?? 0} icon="bi-exclamation-circle-fill" color="#e65100" isCount />
          </div>
        </div>

        {/* Tableau détail honoraires */}
        {showDetailHono && (
          <div style={{ borderTop: '2px solid #f9a825', overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: '#fff8e1', zIndex: 1 }}>
                  {['Médecin', 'Date', 'Total honoraires', 'Net à payer', 'Payé', 'Reste', 'Statut'].map((h, i) => (
                    <th key={i} style={{ padding: '6px 10px', borderBottom: '1px solid #ffe082', color: '#e65100', fontWeight: 700, textAlign: i >= 2 && i <= 5 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailHono.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#90a4ae' }}>Aucun honoraire pour cette période</td></tr>
                ) : detailHono.map((h: any, i: number) => {
                  const med = h.Medecin;
                  const nomMed = med ? `${med.nom || ''} ${med.prenoms || ''}`.trim() : (h.NomMedecin || '—');
                  const solde = (h.resteAPayer || 0) <= 0;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fffde7', borderBottom: '1px solid #f5f5f5', borderLeft: `3px solid ${solde ? '#2e7d32' : '#f9a825'}` }}>
                      <td style={{ padding: '5px 10px', fontWeight: 600 }}>{nomMed}</td>
                      <td style={{ padding: '5px 10px', whiteSpace: 'nowrap' }}>{h.date ? new Date(h.date).toLocaleDateString('fr-FR') : '—'}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right' }}>{fmt(h.montanttotalhono)}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700 }}>{fmt(h.Totalnetapayer)}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', color: '#2e7d32' }}>{fmt(h.totalPaye)}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', color: solde ? '#2e7d32' : '#b71c1c', fontWeight: 700 }}>{fmt(h.resteAPayer)}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                        <span style={{ background: solde ? '#e8f5e9' : '#fff3e0', color: solde ? '#2e7d32' : '#e65100', borderRadius: 10, fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px' }}>
                          {solde ? 'Soldé' : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === FACTURATION ASSURANCES === */}
      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 5px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-shield-fill-check" style={{ color: '#c62828', fontSize: '1.1rem' }}></i>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#37474f', textTransform: 'uppercase', letterSpacing: 1 }}>Facturation Assurances</span>
            {kpiAssur && <span style={{ background: '#c62828', color: '#fff', borderRadius: 10, fontSize: '0.6rem', fontWeight: 700, padding: '1px 7px' }}>{kpiAssur.count}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setShowDetailAssur(v => !v)} style={{ background: showDetailAssur ? '#c62828' : '#ffebee', border: '1px solid #c62828', borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, color: showDetailAssur ? '#fff' : '#c62828', cursor: 'pointer' }}>
              <i className={`bi ${showDetailAssur ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>{showDetailAssur ? 'Masquer' : 'Détail'}
            </button>
            <Link href={`${BASE}/factureassurance`} style={{ background: '#e3f2fd', border: '1px solid #1565c0', borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#1565c0', textDecoration: 'none' }}>
              <i className="bi bi-box-arrow-up-right me-1"></i>Ouvrir
            </Link>
          </div>
        </div>
        <div style={{ padding: '10px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
            <KpiCard label="À déposer" value={kpiAssur?.countNonDeposes ?? 0} icon="bi-send-fill" color="#e65100" isCount />
            <KpiCard label="Déposées" value={kpiAssur?.countDeposes ?? 0} icon="bi-inbox-fill" color="#1565c0" isCount />
            <KpiCard label="Recouvrées" value={kpiAssur?.countRecouvres ?? 0} icon="bi-check-circle-fill" color="#2e7d32" isCount />
            <KpiCard label="Total part assurance" value={kpiAssur?.totalPartAssurance ?? 0} icon="bi-shield-fill" color="#006064" />
            <KpiCard label="Montant recouvré" value={kpiAssur?.totalPaye ?? 0} icon="bi-cash-stack" color="#2e7d32" />
            <KpiCard label="Reste à recouvrer" value={kpiAssur?.totalReste ?? 0} icon="bi-exclamation-triangle-fill" color="#b71c1c" />
          </div>
        </div>

        {/* Tableau détail assurances */}
        {showDetailAssur && (
          <div style={{ borderTop: '2px solid #c62828', overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: '#ffebee', zIndex: 1 }}>
                  {['Référence', 'Assurance', 'Date', 'Part Assurance', 'Payé', 'Reste', 'Dépôt', 'Statut'].map((h, i) => (
                    <th key={i} style={{ padding: '6px 10px', borderBottom: '1px solid #ef9a9a', color: '#b71c1c', fontWeight: 700, textAlign: i >= 3 && i <= 5 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailAssur.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#90a4ae' }}>Aucune facture assurance pour cette période</td></tr>
                ) : detailAssur.map((f: any, i: number) => {
                  const solde = f.etat_facture;
                  const depose = !!f.DateDepot;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fff8f8', borderBottom: '1px solid #f5f5f5', borderLeft: `3px solid ${solde ? '#2e7d32' : depose ? '#1565c0' : '#e65100'}` }}>
                      <td style={{ padding: '5px 10px', fontWeight: 700 }}>{f.Reference || '—'}</td>
                      <td style={{ padding: '5px 10px' }}>{f.Assurance || '—'}</td>
                      <td style={{ padding: '5px 10px', whiteSpace: 'nowrap' }}>{f.Date ? new Date(f.Date).toLocaleDateString('fr-FR') : '—'}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', color: '#006064', fontWeight: 700 }}>{fmt(f.PartAssurance)}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', color: '#2e7d32' }}>{fmt(f.totalPaye)}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', color: solde ? '#2e7d32' : '#b71c1c', fontWeight: 700 }}>{fmt(f.resteAPayer)}</td>
                      <td style={{ padding: '5px 10px', whiteSpace: 'nowrap', color: depose ? '#1565c0' : '#90a4ae', fontSize: '0.68rem' }}>
                        {depose ? new Date(f.DateDepot).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                        <span style={{ background: solde ? '#e8f5e9' : depose ? '#e3f2fd' : '#fff3e0', color: solde ? '#2e7d32' : depose ? '#1565c0' : '#e65100', borderRadius: 10, fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                          {solde ? 'Recouvré' : depose ? 'Déposé' : 'À déposer'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
