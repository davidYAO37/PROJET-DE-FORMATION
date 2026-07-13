'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from 'react-bootstrap';
import { useEntreprise } from '@/hooks/useEntreprise';
import {
  generatePrintHeader,
  generatePrintFooter,
  createPrintWindow,
  createPrintWindowWithoutHeader,
  extractContentWithoutHeaderAndFooter,
} from '@/utils/printRecu';

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

interface Ligne {
  date: string; matricule: string; patient: string; libelle: string;
  montantTotal: number; partPatient: number; partAssurance: number; societePatient: string;
}
interface Totaux { montantTotal: number; partPatient: number; partAssurance: number; }

export default function ImpressionConsultationPage() {
  const searchParams = useSearchParams();
  const numfacture = searchParams.get('numfacture') || '';
  const debutF = searchParams.get('debutF') || '';
  const finF = searchParams.get('finF') || '';
  const assurance = searchParams.get('assurance') || '';
  const parGarant = searchParams.get('parGarant') === '1';

  const { entreprise } = useEntreprise();
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [totaux, setTotaux] = useState<Totaux>({ montantTotal: 0, partPatient: 0, partAssurance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!numfacture) { setError('Référence facture manquante'); setLoading(false); return; }
    fetch(`/api/comptabilite/impression-bordereau/consultation?numfacture=${encodeURIComponent(numfacture)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) { setLignes(data.lignes); setTotaux(data.totaux); }
        else setError(data.message || 'Erreur');
        setLoading(false);
      })
      .catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [numfacture]);

  const handlePrint = () => {
    const printContent = document.getElementById('print-content');
    if (!printContent) return;
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
    createPrintWindow('Consultations & Visites — ' + assurance, headerHTML, restContent, footerHTML);
  };

  const handlePrintSansEntete = () => {
    const printContent = document.getElementById('print-content');
    if (!printContent) return;
    const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
    createPrintWindowWithoutHeader('Consultations & Visites (sans entête)', restContent);
  };

  const today = new Date().toLocaleDateString('fr-FR');
  const debutStr = debutF ? new Date(debutF).toLocaleDateString('fr-FR') : '';
  const finStr = finF ? new Date(finF).toLocaleDateString('fr-FR') : '';

  const groupes: { societe: string; lignes: Ligne[] }[] = [];
  if (parGarant) {
    const map = new Map<string, Ligne[]>();
    lignes.forEach(l => {
      const key = l.societePatient || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    });
    map.forEach((ls, s) => groupes.push({ societe: s, lignes: ls }));
  }

  if (loading) return <div style={{ padding: 40, fontFamily: 'Arial', fontSize: 13 }}>Chargement…</div>;
  if (error) return <div style={{ padding: 40, fontFamily: 'Arial', fontSize: 13, color: 'red' }}>{error}</div>;

  const renderTableHTML = (rows: Ligne[], tot: Totaux) => {
    const cols = parGarant
      ? `<th style="${thS}">Part Assurance</th><th style="${thS}">Part Patient</th>`
      : `<th style="${thS}">Part Patient</th><th style="${thS}">Part Assurance</th>`;
    const rows_html = rows.map((l, i) => {
      const bg = i % 2 === 0 ? '#fff' : '#f0f0f0';
      const vals = parGarant
        ? `<td style="${tdS}">${fmt(l.partAssurance)}</td><td style="${tdS}">${fmt(l.partPatient)}</td>`
        : `<td style="${tdS}">${fmt(l.partPatient)}</td><td style="${tdS}">${fmt(l.partAssurance)}</td>`;
      return `<tr style="background:${bg}"><td style="${tdS}">${l.date}</td><td style="${tdS}">${l.matricule}</td><td style="${tdS}">${l.patient}</td><td style="${tdS}">${l.libelle}</td><td style="${tdS};text-align:right">${fmt(l.montantTotal)}</td>${vals}</tr>`;
    }).join('');
    const totVals = parGarant
      ? `<td style="${tdS};text-align:right;font-weight:700">${fmt(tot.partAssurance)}</td><td style="${tdS};text-align:right;font-weight:700">${fmt(tot.partPatient)}</td>`
      : `<td style="${tdS};text-align:right;font-weight:700">${fmt(tot.partPatient)}</td><td style="${tdS};text-align:right;font-weight:700">${fmt(tot.partAssurance)}</td>`;
    return `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:6px">
      <thead><tr style="background:#4472c4;color:#fff">
        <th style="${thS}">Date</th><th style="${thS}">Matricule</th><th style="${thS}">Patient</th>
        <th style="${thS}">${parGarant ? 'Prestation' : 'Libellé'}</th>
        <th style="${thS};text-align:right">Montant Total</th>${cols}
      </tr></thead>
      <tbody>${rows_html}
        <tr style="background:#e0e0e0;font-weight:700">
          <td colSpan="4" style="${tdS};text-align:center">Total</td>
          <td style="${tdS};text-align:right;font-weight:700">${fmt(tot.montantTotal)}</td>${totVals}
        </tr>
      </tbody></table>`;
  };

  const corps = parGarant
    ? groupes.map(g => {
        const gt = {
          montantTotal: g.lignes.reduce((s, l) => s + l.montantTotal, 0),
          partPatient: g.lignes.reduce((s, l) => s + l.partPatient, 0),
          partAssurance: g.lignes.reduce((s, l) => s + l.partAssurance, 0),
        };
        return `<div style="margin-bottom:16px"><div style="font-weight:700;font-size:12px;margin-bottom:4px">Société : ${g.societe}</div>${renderTableHTML(g.lignes, gt)}</div>`;
      }).join('')
    : renderTableHTML(lignes, totaux);

  const netHTML = `
    <table style="width:100%;border-collapse:collapse;margin-top:8px">
      <tr>
        <td style="border:2px solid #000;padding:6px 12px;font-weight:800;font-size:14px;width:60%">NET A PAYER ${assurance} :</td>
        <td style="border:2px solid #000;padding:6px 12px;font-weight:800;font-size:16px;text-align:center">${fmt(totaux.partAssurance)}</td>
      </tr>
    </table>
    <div style="margin-top:14px;font-size:11px;border-top:1px solid #aaa;padding-top:8px">
      Arrêté la facture à la somme de : <strong>${nombreEnLettres(Math.round(totaux.partAssurance)).replace(/^\w/, c => c.toUpperCase())} FRANCS CFA</strong>
    </div>`;

  const contentHTML = `
    <div style="text-align:center;margin-bottom:14px;font-weight:800;font-size:16px;text-decoration:underline">
      Consultations &amp; Visites &nbsp; ${assurance}
    </div>
    ${!parGarant ? `<div style="margin-bottom:8px"><span style="font-weight:700;text-decoration:underline">DOIT :</span>&nbsp;&nbsp;<span style="font-weight:700;text-decoration:underline">${assurance}</span></div>` : ''}
    <div style="display:flex;justify-content:flex-end;margin-bottom:4px;font-size:11px">Édité Le &nbsp; <strong>${today}</strong></div>
    <div style="margin-bottom:10px;font-size:11px">
      <strong>Liste des Consultations &amp; Visites</strong>&nbsp; Du &nbsp;<strong>${debutStr}</strong>&nbsp; Au &nbsp;<strong>${finStr}</strong>&nbsp;&nbsp;&nbsp; Ref_Facture &nbsp;<strong>${numfacture}</strong>
    </div>
    ${parGarant ? `<div style="margin-bottom:8px;font-weight:700">DOIT : &nbsp; ${assurance}</div>` : ''}
    ${corps}
    ${netHTML}`;

  return (
    <>
      {/* BOUTONS — non imprimés */}
      <div className="text-end mb-3 no-print" style={{ padding: '12px 20px' }}>
        <Button variant="primary" onClick={handlePrint} className="me-2">
          🖨️ Imprimer avec entête
        </Button>
        <Button variant="secondary" onClick={handlePrintSansEntete}>
          📄 Imprimer sans entête
        </Button>
      </div>

      {/* ZONE DE PRÉVISUALISATION */}
      <div id="print-content" style={{ fontFamily: 'Arial, sans-serif', padding: '20px 30px', maxWidth: 950, margin: '0 auto', fontSize: 12, color: '#000', background: '#fff', border: '1px solid #ddd' }}>
        {/* En-tête entreprise */}
        {!entreprise?.LogoE && !entreprise?.EnteteSociete ? (
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 22, color: '#00AEEF', marginBottom: 15 }}>CENTRE MÉDICAL</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 15, gap: 20 }}>
            {entreprise?.LogoE && <img src={entreprise.LogoE} alt="Logo" style={{ maxHeight: 120, maxWidth: 120, objectFit: 'contain' }} />}
            {entreprise?.EnteteSociete && <div style={{ textAlign: 'center', fontSize: 14, color: '#666', flex: 1 }} dangerouslySetInnerHTML={{ __html: entreprise.EnteteSociete }} />}
          </div>
        )}

        {/* Corps du document */}
        <div dangerouslySetInnerHTML={{ __html: contentHTML }} />

        {/* Pied de page entreprise */}
        {entreprise?.PiedPageSociete ? (
          <div style={{ marginTop: 20, fontSize: 11, textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: 10 }} dangerouslySetInnerHTML={{ __html: entreprise.PiedPageSociete }} />
        ) : (
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, fontStyle: 'italic' }}>Merci pour votre confiance</div>
        )}
      </div>
    </>
  );
}

const thS = 'padding:4px 6px;border:1px solid #ccc;font-weight:700;text-align:left';
const tdS = 'padding:3px 6px;border:1px solid #ddd';
