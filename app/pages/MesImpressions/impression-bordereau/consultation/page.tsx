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
  Date_consulation: string;
  numero_carte: string;
  PatientP: string;
  designationC: string;
  PrixClinique: number;
  montantapayer: number;
  PartAssurance: number;
  SOCIETE_PATIENT: string;
  assurance: string;
  NumBon: string;
}
interface Totaux { PrixClinique: number; montantapayer: number; PartAssurance: number; }

const thS = 'padding:4px 6px;border:1px solid #ccc;font-weight:700;text-align:left';
const tdS = 'padding:3px 6px;border:1px solid #ddd';

export default function ImpressionConsultationPage() {
  const searchParams = useSearchParams();
  const numfacture = searchParams.get('numfacture') || '';
  const debutF = searchParams.get('debutF') || '';
  const finF = searchParams.get('finF') || '';
  const assurance = searchParams.get('assurance') || '';
  const parGarant = searchParams.get('parGarant') === '1';

  const { entreprise } = useEntreprise();
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [totaux, setTotaux] = useState<Totaux>({ PrixClinique: 0, montantapayer: 0, PartAssurance: 0 });
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
    const el = document.getElementById('print-content');
    if (!el) return;
    createPrintWindow('Consultations & Visites — ' + assurance, generatePrintHeader(entreprise), extractContentWithoutHeaderAndFooter(el.innerHTML), generatePrintFooter(entreprise));
  };

  const handlePrintSansEntete = () => {
    const el = document.getElementById('print-content');
    if (!el) return;
    createPrintWindowWithoutHeader('Consultations & Visites (sans entête)', extractContentWithoutHeaderAndFooter(el.innerHTML));
  };

  const today = new Date().toLocaleDateString('fr-FR');
  const debutStr = debutF ? new Date(debutF).toLocaleDateString('fr-FR') : '';
  const finStr = finF ? new Date(finF).toLocaleDateString('fr-FR') : '';

  const groupes: { societe: string; lignes: Ligne[] }[] = [];
  if (parGarant) {
    const map = new Map<string, Ligne[]>();
    lignes.forEach(l => { const k = l.SOCIETE_PATIENT || '—'; if (!map.has(k)) map.set(k, []); map.get(k)!.push(l); });
    map.forEach((ls, s) => groupes.push({ societe: s, lignes: ls }));
  }

  if (loading) return <div style={{ padding: 40, fontFamily: 'Arial', fontSize: 13 }}>Chargement…</div>;
  if (error) return <div style={{ padding: 40, fontFamily: 'Arial', fontSize: 13, color: 'red' }}>{error}</div>;

  const renderTableHTML = (rows: Ligne[], tot: Totaux) => {
    const cols = parGarant
      ? `<th style="${thS}">Part Assurance</th><th style="${thS}">Part Patient</th>`
      : `<th style="${thS}">Part Patient</th><th style="${thS}">Part Assurance</th>`;
    const rowsHtml = rows.map((l, i) => {
      const bg = i % 2 === 0 ? '#fff' : '#f0f0f0';
      const date = l.Date_consulation ? new Date(l.Date_consulation).toLocaleDateString('fr-FR') : '';
      const vals = parGarant
        ? `<td style="${tdS};text-align:right">${fmt(l.PartAssurance)}</td><td style="${tdS};text-align:right">${fmt(l.montantapayer)}</td>`
        : `<td style="${tdS};text-align:right">${fmt(l.montantapayer)}</td><td style="${tdS};text-align:right">${fmt(l.PartAssurance)}</td>`;
      return `<tr style="background:${bg}"><td style="${tdS}">${date}</td><td style="${tdS}">${l.numero_carte || ''}</td><td style="${tdS}">${l.PatientP || ''}</td><td style="${tdS}">${l.designationC || ''}</td><td style="${tdS};text-align:right">${fmt(l.PrixClinique)}</td>${vals}</tr>`;
    }).join('');
    const totVals = parGarant
      ? `<td style="${tdS};text-align:right;font-weight:700">${fmt(tot.PartAssurance)}</td><td style="${tdS};text-align:right;font-weight:700">${fmt(tot.montantapayer)}</td>`
      : `<td style="${tdS};text-align:right;font-weight:700">${fmt(tot.montantapayer)}</td><td style="${tdS};text-align:right;font-weight:700">${fmt(tot.PartAssurance)}</td>`;
    return `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:6px"><thead><tr style="background:#4472c4;color:#fff"><th style="${thS}">Date</th><th style="${thS}">Matricule</th><th style="${thS}">Patient</th><th style="${thS}">${parGarant ? 'Prestation' : 'Libellé'}</th><th style="${thS};text-align:right">Montant Total</th>${cols}</tr></thead><tbody>${rowsHtml}<tr style="background:#e0e0e0;font-weight:700"><td colspan="4" style="${tdS};text-align:center">Total</td><td style="${tdS};text-align:right;font-weight:700">${fmt(tot.PrixClinique)}</td>${totVals}</tr></tbody></table>`;
  };

  const makeNetHTML = (doit: string, net: number) =>
    `<table style="width:100%;border-collapse:collapse;margin-top:8px"><tr><td style="border:2px solid #000;padding:6px 12px;font-weight:800;font-size:14px;width:60%">NET A PAYER ${doit} :</td><td style="border:2px solid #000;padding:6px 12px;font-weight:800;font-size:16px;text-align:center">${fmt(net)}</td></tr></table><div style="margin-top:14px;font-size:11px;border-top:1px solid #aaa;padding-top:8px">Arrêté la facture à la somme de : <strong>${nombreEnLettres(Math.round(net)).replace(/^\w/, c => c.toUpperCase())} FRANCS CFA</strong></div>`;

  const entete = `<div style="text-align:center;margin-bottom:14px;font-weight:800;font-size:16px;text-decoration:underline">Consultations &amp; Visites &nbsp; ${assurance}</div><div style="display:flex;justify-content:flex-end;margin-bottom:4px;font-size:11px">Édité Le &nbsp; <strong>${today}</strong></div><div style="margin-bottom:10px;font-size:11px"><strong>Liste des Consultations &amp; Visites</strong>&nbsp; Du &nbsp;<strong>${debutStr}</strong>&nbsp; Au &nbsp;<strong>${finStr}</strong>&nbsp;&nbsp;&nbsp; Ref_Facture &nbsp;<strong>${numfacture}</strong></div>`;

  // SANS GARANT : tout regroupé, DOIT = assurance
  const corpsSansGarant = `<div style="margin-bottom:8px;font-weight:700;text-decoration:underline">DOIT : &nbsp; ${assurance}</div>${renderTableHTML(lignes, totaux)}${makeNetHTML(assurance, totaux.PartAssurance)}`;

  // PAR GARANT : un bloc par SOCIETE_PATIENT, DOIT = société, saut de page entre groupes
  const corpsParGarant = groupes.map((g, gi) => {
    const gt = {
      PrixClinique: g.lignes.reduce((s, l) => s + (l.PrixClinique || 0), 0),
      montantapayer: g.lignes.reduce((s, l) => s + (l.montantapayer || 0), 0),
      PartAssurance: g.lignes.reduce((s, l) => s + (l.PartAssurance || 0), 0),
    };
    const pb = gi > 0 ? 'page-break-before:always;' : '';
    return `<div style="${pb}margin-bottom:16px"><div style="margin-bottom:6px;font-weight:700;text-decoration:underline">DOIT : &nbsp; ${g.societe}</div>${renderTableHTML(g.lignes, gt)}${makeNetHTML(g.societe, gt.PartAssurance)}</div>`;
  }).join('');

  const contentHTML = `${entete}${parGarant ? corpsParGarant : corpsSansGarant}`;

  return (
    <>
      <div className="text-end mb-3" style={{ padding: '12px 20px' }}>
        <Button variant="primary" onClick={handlePrint} className="me-2">🖨️ Imprimer avec entête</Button>
        <Button variant="secondary" onClick={handlePrintSansEntete}>📄 Imprimer sans entête</Button>
      </div>
      <div id="print-content" style={{ fontFamily: 'Arial, sans-serif', padding: '20px 30px', maxWidth: 950, margin: '0 auto', fontSize: 12, color: '#000', background: '#fff', border: '1px solid #ddd' }}>
        {!entreprise?.LogoE && !entreprise?.EnteteSociete ? (
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 22, color: '#00AEEF', marginBottom: 15 }}>CENTRE MÉDICAL</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 15, gap: 20 }}>
            {entreprise?.LogoE && <img src={entreprise.LogoE} alt="Logo" style={{ maxHeight: 120, maxWidth: 120, objectFit: 'contain' }} />}
            {entreprise?.EnteteSociete && <div style={{ textAlign: 'center', fontSize: 14, color: '#666', flex: 1 }} dangerouslySetInnerHTML={{ __html: entreprise.EnteteSociete }} />}
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: contentHTML }} />
        {entreprise?.PiedPageSociete ? (
          <div style={{ marginTop: 20, fontSize: 11, textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: 10 }} dangerouslySetInnerHTML={{ __html: entreprise.PiedPageSociete }} />
        ) : (
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, fontStyle: 'italic' }}>Merci pour votre confiance</div>
        )}
      </div>
    </>
  );
}
