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

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

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
  date: string; beneficiaire: string; matricule: string; acte: string;
  totalacte: number; partAssurance: number; partAssure: number; societePatient: string; numBon: string;
}
interface Totaux { totalacte: number; partAssurance: number; partAssure: number; }
interface FactureInfo { reference: string; assurance: string; debutF: string; finF: string; date: string; }

const thS = 'padding:4px 6px;border:1px solid #ccc;font-weight:700;text-align:left;font-size:11px';
const tdS = 'padding:3px 6px;border:1px solid #ddd;font-size:11px';

export default function ImpressionSoinsExamensPage() {
  const searchParams = useSearchParams();
  const idFactureAssur = searchParams.get('idFactureAssur') || '';
  const parGarant = searchParams.get('parGarant') === '1';

  const { entreprise } = useEntreprise();
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [totaux, setTotaux] = useState<Totaux>({ totalacte: 0, partAssurance: 0, partAssure: 0 });
  const [facture, setFacture] = useState<FactureInfo>({ reference: '', assurance: '', debutF: '', finF: '', date: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!idFactureAssur) { setError('ID Bordereau manquant'); setLoading(false); return; }
    fetch(`/api/comptabilite/impression-bordereau/soins-examens?idFactureAssur=${encodeURIComponent(idFactureAssur)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setLignes(data.lignes);
          setTotaux(data.totaux);
          setFacture(data.facture);
        } else setError(data.message || 'Erreur');
        setLoading(false);
      })
      .catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [idFactureAssur]);

  const handlePrint = () => {
    const printContent = document.getElementById('print-content');
    if (!printContent) return;
    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
    createPrintWindow(`Analyse & Autres Prestations — ${facture.assurance}`, headerHTML, restContent, footerHTML);
  };

  const handlePrintSansEntete = () => {
    const printContent = document.getElementById('print-content');
    if (!printContent) return;
    const restContent = extractContentWithoutHeaderAndFooter(printContent.innerHTML);
    createPrintWindowWithoutHeader('Analyse & Autres Prestations (sans entête)', restContent);
  };

  const today = new Date().toLocaleDateString('fr-FR');
  const debutStr = facture.debutF ? new Date(facture.debutF).toLocaleDateString('fr-FR') : '';
  const finStr = facture.finF ? new Date(facture.finF).toLocaleDateString('fr-FR') : '';

  // Grouper par société pour PAR GARANT
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
    const rows_html = rows.map((l, i) => {
      const bg = i % 2 === 0 ? '#fff' : '#f0f0f0';
      return `<tr style="background:${bg}">
        <td style="${tdS}">${l.date}</td>
        <td style="${tdS}">${l.beneficiaire}</td>
        <td style="${tdS}">${l.matricule}</td>
        <td style="${tdS}">${l.acte}</td>
        <td style="${tdS};text-align:right">${fmt(l.totalacte)}</td>
        <td style="${tdS};text-align:right">${fmt(l.partAssurance)}</td>
        <td style="${tdS};text-align:right">${fmt(l.partAssure)}</td>
      </tr>`;
    }).join('');
    return `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:6px">
      <thead><tr style="background:#4472c4;color:#fff">
        <th style="${thS}">Date</th>
        <th style="${thS}">Bénéficiaire</th>
        <th style="${thS}">Matricule</th>
        <th style="${thS}">ACTE</th>
        <th style="${thS};text-align:right">Totalacte</th>
        <th style="${thS};text-align:right">Part Assurance</th>
        <th style="${thS};text-align:right">Part assuré</th>
      </tr></thead>
      <tbody>${rows_html}
        <tr style="background:#e0e0e0;font-weight:700">
          <td colspan="4" style="${tdS};text-align:center;font-weight:700">Total</td>
          <td style="${tdS};text-align:right;font-weight:700">${fmt(tot.totalacte)}</td>
          <td style="${tdS};text-align:right;font-weight:700">${fmt(tot.partAssurance)}</td>
          <td style="${tdS};text-align:right;font-weight:700">${fmt(tot.partAssure)}</td>
        </tr>
      </tbody></table>`;
  };

  const enteteDoc = `
    <div style="text-align:center;margin-bottom:14px;font-weight:800;font-size:16px;text-decoration:underline">
      ANALYSE ET AUTRES PRESTATIONS &nbsp; ${facture.assurance}
    </div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:4px;font-size:11px">Édité Le &nbsp; <strong>${today}</strong></div>
    <div style="margin-bottom:8px;font-size:11px">
      <strong>ANALYSE ET AUTRES PRESTATIONS</strong>&nbsp;&nbsp;
      Du &nbsp;<strong>${debutStr}</strong>&nbsp; Au &nbsp;<strong>${finStr}</strong>
      &nbsp;&nbsp;&nbsp; Ref_Facture &nbsp;<strong>${facture.reference}</strong>
    </div>`;

  const netHTML = (netAPayer: number) => `
    <table style="width:100%;border-collapse:collapse;margin-top:8px">
      <tr>
        <td style="border:2px solid #000;padding:6px 12px;font-weight:800;font-size:14px;width:60%">NET A PAYER ${facture.assurance}:</td>
        <td style="border:2px solid #000;padding:6px 12px;font-weight:800;font-size:16px;text-align:center">${fmt(netAPayer)}</td>
      </tr>
    </table>
    <div style="margin-top:14px;font-size:11px">
      Arrêté la facture à la somme de: &nbsp;<strong>${nombreEnLettres(Math.round(netAPayer)).replace(/^\w/, c => c.toUpperCase())} FRANCS CFA</strong>
    </div>`;

  // SANS GARANT : tout en un seul bloc
  const corpsSansGarant = `
    <div style="margin-bottom:8px;font-weight:700;text-decoration:underline">DOIT : &nbsp; <span style="text-decoration:underline">${facture.assurance}</span></div>
    ${renderTableHTML(lignes, totaux)}
    ${netHTML(totaux.partAssurance)}`;

  // PAR GARANT : un bloc par société avec saut de page
  const corpsParGarant = groupes.map((g, gi) => {
    const gt = {
      totalacte: g.lignes.reduce((s, l) => s + l.totalacte, 0),
      partAssurance: g.lignes.reduce((s, l) => s + l.partAssurance, 0),
      partAssure: g.lignes.reduce((s, l) => s + l.partAssure, 0),
    };
    const pageBreak = gi > 0 ? 'page-break-before:always;' : '';
    return `<div style="${pageBreak}margin-bottom:16px">
      <div style="font-weight:700;margin-bottom:6px">DOIT : &nbsp; <strong>${g.societe}</strong></div>
      ${renderTableHTML(g.lignes, gt)}
      ${netHTML(gt.partAssurance)}
    </div>`;
  }).join('');

  const contentHTML = `${enteteDoc}${parGarant ? corpsParGarant : corpsSansGarant}`;

  return (
    <>
      {/* BOUTONS */}
      <div className="text-end mb-3 no-print" style={{ padding: '12px 20px' }}>
        <Button variant="primary" onClick={handlePrint} className="me-2">
          🖨️ Imprimer avec entête
        </Button>
        <Button variant="secondary" onClick={handlePrintSansEntete}>
          📄 Imprimer sans entête
        </Button>
      </div>

      {/* PRÉVISUALISATION */}
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

        {/* Corps */}
        <div dangerouslySetInnerHTML={{ __html: contentHTML }} />

        {/* Pied de page */}
        {entreprise?.PiedPageSociete ? (
          <div style={{ marginTop: 20, fontSize: 11, textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: 10 }} dangerouslySetInnerHTML={{ __html: entreprise.PiedPageSociete }} />
        ) : (
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, fontStyle: 'italic' }}>Merci pour votre confiance</div>
        )}
      </div>
    </>
  );
}
