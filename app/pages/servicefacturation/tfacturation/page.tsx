'use client';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Spinner, Modal, Button, Form } from 'react-bootstrap';
import LicenceModuleGuard from "@/components/licence/LicenceModuleGuard";

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
  const [entrepriseId, setEntrepriseId] = useState<string | null>(null);
  const [utilisateur, setUtilisateur] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Modals
  const [modalAnnuler, setModalAnnuler] = useState<any | null>(null);
  const [modalDeposer, setModalDeposer] = useState<any | null>(null);
  const [depotPar, setDepotPar] = useState('');
  const [modalRecouvrer, setModalRecouvrer] = useState<any | null>(null);
  const [recouvreMontant, setRecouvreMontant] = useState('');
  const [recouvrePar, setRecouvrePar] = useState('');
  const [recouvreModePaiement, setRecouvreModePaiement] = useState('');
  const [recouvreNumCheque, setRecouvreNumCheque] = useState('');
  const [recouvreBanque, setRecouvreBanque] = useState('');
  const [modesPaiement, setModesPaiement] = useState<{ _id: string; Modepaiement: string }[]>([]);

  useEffect(() => {
    const eid = localStorage.getItem('IdEntreprise') || '';
    setEntrepriseId(eid);
    setUtilisateur(localStorage.getItem('nom_utilisateur') || '');
    // Charger les modes de paiement
    fetch('/api/modepaiement').then(r => r.json()).then(j => {
      if (j.success && j.data) setModesPaiement(j.data);
    }).catch(() => {});
  }, []);

  const charger = useCallback(async () => {
    setLoading(true);
    const pad = (n: number) => String(n).padStart(2, '0');
    const debut = `${annee}-${pad(mois + 1)}-01`;
    const dernierJour = new Date(annee, mois + 1, 0).getDate();
    const fin = `${annee}-${pad(mois + 1)}-${pad(dernierJour)}`;

    try {
      const [resH, resA] = await Promise.all([
        fetch(`/api/comptabilite/honoraires?dateDebut=${debut}&dateFin=${fin}`),
        fetch(`/api/comptabilite/factureAssurance?dateDebut=${debut}&dateFin=${fin}`),
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
  }, [mois, annee]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, [mois, annee]);

  const annees = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  // ===== ACTIONS FACTURES ASSURANCE =====
  const handleAnnuler = async () => {
    if (!modalAnnuler) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/comptabilite/factureAssurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'annuler', factureAssurId: modalAnnuler._id, annulePar: utilisateur }),
      });
      const j = await res.json();
      if (j.success) {
        setActionMsg({ type: 'success', text: `Bordereau ${modalAnnuler.Reference} annulé` });
        setModalAnnuler(null);
        charger();
      } else {
        setActionMsg({ type: 'danger', text: j.message || 'Erreur' });
      }
    } catch { setActionMsg({ type: 'danger', text: 'Erreur réseau' }); }
    finally { setActionLoading(false); }
  };

  const handleDeposer = async () => {
    if (!modalDeposer) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/comptabilite/factureAssurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'depot', factureAssurId: modalDeposer._id, depotPar: depotPar || utilisateur }),
      });
      const j = await res.json();
      if (j.success) {
        setActionMsg({ type: 'success', text: `Bordereau ${modalDeposer.Reference} déposé` });
        setModalDeposer(null); setDepotPar('');
        charger();
      } else {
        setActionMsg({ type: 'danger', text: j.message || 'Erreur' });
      }
    } catch { setActionMsg({ type: 'danger', text: 'Erreur réseau' }); }
    finally { setActionLoading(false); }
  };

  const handleRecouvrer = async () => {
    if (!modalRecouvrer || !recouvreMontant) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/comptabilite/factureAssurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payer',
          factureAssurId: modalRecouvrer._id,
          montant: Number(recouvreMontant),
          modePaiement: recouvreModePaiement,
          recuPar: recouvrePar || utilisateur,
          numeroCheque: recouvreNumCheque,
          banque: recouvreBanque,
          entrepriseId,
        }),
      });
      const j = await res.json();
      if (j.success) {
        setActionMsg({ type: 'success', text: `Paiement enregistré pour ${modalRecouvrer.Reference}` });
        setModalRecouvrer(null); setRecouvreMontant(''); setRecouvrePar(''); setRecouvreModePaiement(''); setRecouvreNumCheque(''); setRecouvreBanque('');
        charger();
      } else {
        setActionMsg({ type: 'danger', text: j.message || 'Erreur' });
      }
    } catch { setActionMsg({ type: 'danger', text: 'Erreur réseau' }); }
    finally { setActionLoading(false); }
  };

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
    <LicenceModuleGuard module="facturation">
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
          <div style={{ borderTop: '2px solid #c62828', overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
            {actionMsg && (
              <div style={{ padding: '6px 14px', background: actionMsg.type === 'success' ? '#e8f5e9' : '#ffebee', color: actionMsg.type === 'success' ? '#2e7d32' : '#b71c1c', fontSize: '0.72rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{actionMsg.text}</span>
                <button onClick={() => setActionMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>&times;</button>
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: '#ffebee', zIndex: 1 }}>
                  {['Référence', 'Assurance', 'Date', 'Part Assurance', 'Payé', 'Reste', 'Dépôt', 'Statut', 'Actions'].map((h, i) => (
                    <th key={i} style={{ padding: '6px 10px', borderBottom: '1px solid #ef9a9a', color: '#b71c1c', fontWeight: 700, textAlign: i >= 3 && i <= 5 ? 'right' : i === 8 ? 'center' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailAssur.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: '#90a4ae' }}>Aucune facture assurance pour cette période</td></tr>
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
                        {depose ? <><span>{new Date(f.DateDepot).toLocaleDateString('fr-FR')}</span>{f.DepotPar && <span style={{ display: 'block', fontSize: '0.6rem', color: '#78909c' }}>{f.DepotPar}</span>}</> : '—'}
                      </td>
                      <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                        <span style={{ background: solde ? '#e8f5e9' : depose ? '#e3f2fd' : '#fff3e0', color: solde ? '#2e7d32' : depose ? '#1565c0' : '#e65100', borderRadius: 10, fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                          {solde ? 'Recouvré' : depose ? 'Déposé' : 'À déposer'}
                        </span>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                          <button
                            onClick={() => setModalAnnuler(f)}
                            title="Annuler le bordereau"
                            disabled={depose || solde}
                            style={{ background: (!depose && !solde) ? '#ffebee' : '#f5f5f5', border: '1px solid #ef9a9a', borderRadius: 4, padding: '2px 6px', cursor: (!depose && !solde) ? 'pointer' : 'not-allowed', fontSize: '0.68rem', color: (!depose && !solde) ? '#b71c1c' : '#bdbdbd', opacity: (!depose && !solde) ? 1 : 0.5 }}
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                          <button
                            onClick={() => { setModalDeposer(f); setDepotPar(utilisateur); }}
                            title="Déposer"
                            disabled={depose || solde}
                            style={{ background: (!depose && !solde) ? '#e3f2fd' : '#f5f5f5', border: '1px solid #90caf9', borderRadius: 4, padding: '2px 6px', cursor: (!depose && !solde) ? 'pointer' : 'not-allowed', fontSize: '0.68rem', color: (!depose && !solde) ? '#1565c0' : '#bdbdbd', opacity: (!depose && !solde) ? 1 : 0.5 }}
                          >
                            <i className="bi bi-send"></i>
                          </button>
                          <button
                            onClick={() => { setModalRecouvrer(f); setRecouvreMontant(String(f.resteAPayer || 0)); setRecouvrePar(utilisateur); }}
                            title="Recouvrer"
                            disabled={!depose || solde}
                            style={{ background: (depose && !solde) ? '#e8f5e9' : '#f5f5f5', border: '1px solid #a5d6a7', borderRadius: 4, padding: '2px 6px', cursor: (depose && !solde) ? 'pointer' : 'not-allowed', fontSize: '0.68rem', color: (depose && !solde) ? '#2e7d32' : '#bdbdbd', opacity: (depose && !solde) ? 1 : 0.5 }}
                          >
                            <i className="bi bi-cash-stack"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== MODAL ANNULER ===== */}
      <Modal show={!!modalAnnuler} onHide={() => setModalAnnuler(null)} centered size="sm">
        <Modal.Header closeButton style={{ background: '#ffebee', borderBottom: '2px solid #ef9a9a' }}>
          <Modal.Title style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b71c1c' }}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>Annuler le bordereau
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: '0.78rem', color: '#37474f' }}>
            Voulez-vous vraiment annuler le bordereau <strong>{modalAnnuler?.Reference}</strong> ?
          </p>
          <p style={{ fontSize: '0.72rem', color: '#b71c1c' }}>
            <i className="bi bi-info-circle me-1"></i>
            Cette action supprimera définitivement ce bordereau et toutes ses lignes associées.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setModalAnnuler(null)}>Non</Button>
          <Button variant="danger" size="sm" onClick={handleAnnuler} disabled={actionLoading}>
            {actionLoading ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-trash me-1"></i>Oui, annuler</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== MODAL DÉPOSER ===== */}
      <Modal show={!!modalDeposer} onHide={() => setModalDeposer(null)} centered size="sm">
        <Modal.Header closeButton style={{ background: '#e3f2fd', borderBottom: '2px solid #90caf9' }}>
          <Modal.Title style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1565c0' }}>
            <i className="bi bi-send-fill me-2"></i>Déposer le bordereau
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: '0.75rem', color: '#37474f', marginBottom: 10 }}>
            Bordereau : <strong>{modalDeposer?.Reference}</strong> — {modalDeposer?.Assurance}
          </p>
          <Form.Group>
            <Form.Label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#546e7a' }}>Déposé par</Form.Label>
            <Form.Control size="sm" value={depotPar} onChange={e => setDepotPar(e.target.value)} placeholder="Nom du déposant" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setModalDeposer(null)}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleDeposer} disabled={actionLoading}>
            {actionLoading ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-send me-1"></i>Déposer</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== MODAL RECOUVRER ===== */}
      <Modal show={!!modalRecouvrer} onHide={() => setModalRecouvrer(null)} centered>
        <Modal.Header closeButton style={{ background: '#e8f5e9', borderBottom: '2px solid #a5d6a7' }}>
          <Modal.Title style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2e7d32' }}>
            <i className="bi bi-cash-stack me-2"></i>Recouvrer le bordereau
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: '0.75rem', color: '#37474f', marginBottom: 10 }}>
            Bordereau : <strong>{modalRecouvrer?.Reference}</strong> — {modalRecouvrer?.Assurance}<br />
            Part assurance : <strong>{fmt(modalRecouvrer?.PartAssurance || 0)} F</strong> — Reste : <strong style={{ color: '#b71c1c' }}>{fmt(modalRecouvrer?.resteAPayer || 0)} F</strong>
          </p>
          <Form.Group className="mb-2">
            <Form.Label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#546e7a' }}>Montant reçu (F)</Form.Label>
            <Form.Control size="sm" type="number" value={recouvreMontant} onChange={e => setRecouvreMontant(e.target.value)} min={1} max={modalRecouvrer?.resteAPayer || 0} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#546e7a' }}>Mode de paiement</Form.Label>
            <Form.Select size="sm" value={recouvreModePaiement} onChange={e => setRecouvreModePaiement(e.target.value)}>
              <option value="">-- Sélectionner --</option>
              {modesPaiement.map(m => <option key={m._id} value={m.Modepaiement}>{m.Modepaiement}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#546e7a' }}>Reçu par</Form.Label>
            <Form.Control size="sm" value={recouvrePar} onChange={e => setRecouvrePar(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#546e7a' }}>N° Chèque (optionnel)</Form.Label>
            <Form.Control size="sm" value={recouvreNumCheque} onChange={e => setRecouvreNumCheque(e.target.value)} />
          </Form.Group>
          <Form.Group>
            <Form.Label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#546e7a' }}>Banque (optionnel)</Form.Label>
            <Form.Control size="sm" value={recouvreBanque} onChange={e => setRecouvreBanque(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setModalRecouvrer(null)}>Annuler</Button>
          <Button variant="success" size="sm" onClick={handleRecouvrer} disabled={actionLoading || !recouvreMontant || Number(recouvreMontant) <= 0}>
            {actionLoading ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-check-circle me-1"></i>Valider le paiement</>}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
    </LicenceModuleGuard>
  );
}
