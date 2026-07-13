'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Spinner, Button, Alert } from 'react-bootstrap';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter } from '@/utils/printRecu';

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function nombreEnLettres(n: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  if (n === 0) return 'zéro';
  if (n < 0) return 'moins ' + nombreEnLettres(-n);
  let result = '';
  if (n >= 1000000) { result += nombreEnLettres(Math.floor(n / 1000000)) + ' million '; n %= 1000000; }
  if (n >= 1000) { result += nombreEnLettres(Math.floor(n / 1000)) + ' mille '; n %= 1000; }
  if (n >= 100) { result += (Math.floor(n / 100) > 1 ? unites[Math.floor(n / 100)] + ' ' : '') + 'cent '; n %= 100; }
  if (n >= 20) {
    const d = Math.floor(n / 10), u = n % 10;
    if (d === 7 || d === 9) result += dizaines[d] + '-' + unites[10 + u] + ' ';
    else result += dizaines[d] + (u > 0 ? '-' + unites[u] : '') + ' ';
  } else if (n > 0) result += unites[n] + ' ';
  return result.trim();
}

// Colonnes exactes de la requête SQL : Facture_Recap WHERE IDFactureAssur = ParamIDFactureAssur
interface LigneRecap {
  ACTE: string;
  montantacte: number;
  Partassure: number;
  PartAssurance: number;
  DebutF: string;
  FinF: string;
  DateSaisie: string;
  Numfacture: string;
  Assurance: string;
  NCC: string;
}

interface Totaux { montantacte: number; PartAssurance: number; Partassure: number; nbLignes: number; }

interface Entete {
  Assurance: string;
  NCC: string;
  Numfacture: string;
  DebutF: string;
  FinF: string;
  DateSaisie: string;
  etat_facture: boolean;
  TotalPaye: number;
  Restapayer: number;
}

export default function FactureRecapPage() {
  const searchParams = useSearchParams();
  const idFactureAssur = searchParams.get('idFactureAssur') || '';
  const { entreprise } = useEntreprise();

  const [lignes, setLignes] = useState<LigneRecap[]>([]);
  const [totaux, setTotaux] = useState<Totaux | null>(null);
  const [entete, setEntete] = useState<Entete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!idFactureAssur) { setError('Paramètre idFactureAssur manquant.'); setLoading(false); return; }
    fetch(`/api/comptabilite/impression-bordereau/facture-recap?idFactureAssur=${encodeURIComponent(idFactureAssur)}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message || 'Erreur');
        setLignes(json.lignes || []);
        setTotaux(json.totaux);
        setEntete(json.entete);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [idFactureAssur]);

  // Format identique à ETAT_FACTURE_ASSURANCE (WinDev)
  const handlePrint = () => {
    if (!entete || !totaux) return;
    const header = generatePrintHeader(entreprise);
    const footer = generatePrintFooter(entreprise);
    const montantLettres = nombreEnLettres(Math.round(totaux.PartAssurance));

    const lignesHTML = lignes.map((l, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f5f5f5'};">
        <td style="padding:4px 8px;border:1px solid #ccc;">${l.ACTE || '—'}</td>
        <td style="padding:4px 8px;border:1px solid #ccc;text-align:right;">${fmt(l.montantacte)}</td>
        <td style="padding:4px 8px;border:1px solid #ccc;text-align:right;">${fmt(l.Partassure)}</td>
        <td style="padding:4px 8px;border:1px solid #ccc;text-align:right;">${fmt(l.PartAssurance)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><title>Facture Récap — ${entete.Numfacture}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #222; }
      .header { display:flex; align-items:center; margin-bottom:10px; }
      .header img { max-height:80px; max-width:80px; margin-right:15px; }
      .entete-grid { display:grid; grid-template-columns:1fr 1fr; gap:2px 30px; margin-bottom:8px; font-size:11px; }
      .entete-row { display:flex; gap:6px; }
      .lbl { color:#555; min-width:90px; }
      .val { font-weight:700; }
      .periode { text-align:center; font-weight:700; margin:6px 0 10px; font-size:11px; }
      table { width:100%; border-collapse:collapse; font-size:11px; }
      th { background:#d0d0d0; padding:5px 8px; border:1px solid #bbb; font-weight:700; text-align:left; }
      th.right { text-align:right; }
      .total-row td { background:#e8e8e8; font-weight:700; border:1px solid #bbb; padding:5px 8px; }
      .total-row td.right { text-align:right; }
      .arrêté { margin-top:14px; font-size:11px; }
      @media print { body { margin:10px; } @page { margin:10mm; size:A4; } }
    </style></head><body>
    ${header}
    <div class="entete-grid">
      <div class="entete-row"><span class="lbl">Assurance :</span><span class="val">${entete.Assurance}</span></div>
      <div class="entete-row"><span class="lbl">Édité Le</span><span class="val">${fmtDate(entete.DateSaisie)}</span></div>
      <div class="entete-row"><span class="lbl">NCC</span><span class="val">${entete.NCC || '—'}</span></div>
      <div class="entete-row"><span class="lbl">Ref_Facture</span><span class="val">${entete.Numfacture}</span></div>
    </div>
    <div class="periode">Liste des Actes &nbsp;&nbsp; Du &nbsp; ${fmtDate(entete.DebutF)} &nbsp; Au &nbsp; ${fmtDate(entete.FinF)}</div>
    <table>
      <thead><tr>
        <th>Actes</th>
        <th class="right">Montant acte</th>
        <th class="right">Part assuré</th>
        <th class="right">Part Assurance</th>
      </tr></thead>
      <tbody>
        ${lignesHTML}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td>Cumule des Totaux</td>
          <td class="right">${fmt(totaux.montantacte)}</td>
          <td class="right">${fmt(totaux.Partassure)}</td>
          <td class="right">${fmt(totaux.PartAssurance)}</td>
        </tr>
      </tfoot>
    </table>
    <div class="arrêté">Arrêté la facture à la somme de : <strong>${montantLettres} francs CFA</strong></div>
    ${footer}
    <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <div className="text-muted small">Chargement de la facture récap…</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-4">
      <Alert variant="danger"><i className="bi bi-exclamation-triangle me-2"></i>{error}</Alert>
    </div>
  );

  if (!entete || !totaux) return null;

  // Aperçu fidèle au format ETAT_FACTURE_ASSURANCE
  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '16px' }}>
      {/* Bandeau impression */}
      <div style={{
        background: 'linear-gradient(135deg,#4a148c 0%,#6a1b9a 50%,#ce93d8 100%)',
        borderRadius: 8, padding: '10px 18px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(74,20,140,0.25)',
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Impression</div>
          <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 800 }}>Facture Récapitulative</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>Réf. {entete.Numfacture} — {entete.Assurance}</div>
        </div>
        <Button size="sm" variant="light" onClick={handlePrint}>
          <i className="bi bi-printer-fill me-1"></i>Imprimer
        </Button>
      </div>

      {/* Aperçu format état */}
      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.09)', padding: '20px 28px', maxWidth: 820, margin: '0 auto' }}>

        {/* Entête — Assurance / Édité Le / NCC / Ref_Facture */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 0', fontSize: '0.82rem', marginBottom: 10 }}>
          <div><span style={{ color: '#555' }}>Assurance :</span> <strong>{entete.Assurance}</strong></div>
          <div style={{ textAlign: 'right' }}><span style={{ color: '#555' }}>Édité Le</span> <strong>{fmtDate(entete.DateSaisie)}</strong></div>
          <div><span style={{ color: '#555' }}>NCC</span> <strong>{entete.NCC || '—'}</strong></div>
          <div style={{ textAlign: 'right' }}><span style={{ color: '#555' }}>Ref_Facture</span> <strong>{entete.Numfacture}</strong></div>
        </div>

        {/* Période — Liste des Actes Du ... Au ... */}
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', marginBottom: 14 }}>
          Liste des Actes &nbsp;&nbsp;
          <span style={{ color: '#555', fontWeight: 400 }}>Du</span> &nbsp; <strong>{fmtDate(entete.DebutF)}</strong>
          &nbsp;&nbsp; <span style={{ color: '#555', fontWeight: 400 }}>Au</span> &nbsp; <strong>{fmtDate(entete.FinF)}</strong>
        </div>

        {/* Tableau — Actes / Montant acte / Part assuré / Part Assurance */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              {[['Actes', 'left'], ['Montant acte', 'right'], ['Part assuré', 'right'], ['Part Assurance', 'right']].map(([h, align], i) => (
                <th key={i} style={{ background: '#d0d0d0', padding: '6px 10px', border: '1px solid #bbb', fontWeight: 700, textAlign: align as any }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#90a4ae', border: '1px solid #eee' }}>
                <i className="bi bi-inbox me-2"></i>Aucune ligne dans la table Facture_Recap pour ce bordereau
              </td></tr>
            ) : (
              lignes.map((l, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f5f5f5' }}>
                  <td style={{ padding: '5px 10px', border: '1px solid #ddd' }}>{l.ACTE || '—'}</td>
                  <td style={{ padding: '5px 10px', border: '1px solid #ddd', textAlign: 'right' }}>{fmt(l.montantacte)}</td>
                  <td style={{ padding: '5px 10px', border: '1px solid #ddd', textAlign: 'right' }}>{fmt(l.Partassure)}</td>
                  <td style={{ padding: '5px 10px', border: '1px solid #ddd', textAlign: 'right' }}>{fmt(l.PartAssurance)}</td>
                </tr>
              ))
            )}
          </tbody>
          {/* Cumule des Totaux */}
          <tfoot>
            <tr style={{ background: '#e8e8e8', fontWeight: 700 }}>
              <td style={{ padding: '6px 10px', border: '1px solid #bbb', textAlign: 'center' }}>Cumule des Totaux</td>
              <td style={{ padding: '6px 10px', border: '1px solid #bbb', textAlign: 'right' }}>{fmt(totaux.montantacte)}</td>
              <td style={{ padding: '6px 10px', border: '1px solid #bbb', textAlign: 'right' }}>{fmt(totaux.Partassure)}</td>
              <td style={{ padding: '6px 10px', border: '1px solid #bbb', textAlign: 'right' }}>{fmt(totaux.PartAssurance)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Arrêté la facture à la somme de */}
        <div style={{ marginTop: 16, fontSize: '0.82rem' }}>
          Arrêté la facture à la somme de : <strong>{nombreEnLettres(Math.round(totaux.PartAssurance))} francs CFA</strong>
        </div>
      </div>
    </div>
  );
}
