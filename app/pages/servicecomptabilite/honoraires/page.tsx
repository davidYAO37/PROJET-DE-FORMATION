'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Row, Col, Button, Form, Table, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { useEntreprise } from '@/hooks/useEntreprise';
import { generatePrintHeader, generatePrintFooter, createPrintWindow } from '@/utils/printRecu';

interface Medecin {
  _id: string;
  nom: string;
  prenoms?: string;
  specialite?: string;
  TauxHonoraire?: number;
  TauxPrescription?: number;
  TauxExecution?: number;
  TauxAideOperatoire?: number;
  TauxAnesthesiste?: number;
}

interface Acte {
  idActe: string;
  date: string;
  type: string;
  acte: string;
  totalActe: number;
  totalMedecin: number;
  taxe: number;
  netAPayer: number;
  patient: string;
}

interface HonoraireHistorique {
  _id: string;
  date?: string;
  Heure?: string;
  MontantJour?: number;
  Totalretenue?: number;
  Totalnetapayer?: number;
  MontantPayé?: number;
  Restapayer?: number;
  Medecin?: string | { _id: string; nom?: string; prenoms?: string };
  DEBUTD?: string;
  FIND?: string;
  NBHONRAIRE?: number;
  NBPRESCRIPTION?: number;
  NBEXECUTANT?: number;
  NBAideOperatoire?: number;
  NBAnestesiste?: number;
  montanttotalhono?: number;
  montanttaotalPrescrip?: number;
  MontanttotalExeut?: number;
  MontantAideTotal?: number;
  MontantTotalAnestesiste?: number;
  parthonoraire?: number;
  partpres?: number;
  partexcu?: number;
  ParAide?: number;
  ParAnesthesiste?: number;
  paiements?: {
    _id: string;
    Date?: string;
    Heure?: string;
    MontantPayé?: number;
    Restapayer?: number;
    PayéPar?: string;
    Recupar?: string;
    Modepaiement?: string;
    BanqueC?: string;
    NCheque?: string;
  }[];
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');
const today = () => new Date().toISOString().split('T')[0];

const typeBadge = (type: string) => {
  if (type.includes('CONSULTATION')) return 'primary';
  if (type.includes('PRESCRIPTION')) return 'success';
  if (type.includes('EXECUTANT')) return 'info';
  if (type.includes('AIDE')) return 'warning';
  if (type.includes('ANESTHESISTE')) return 'danger';
  return 'secondary';
};

export default function HonorairesPage() {
  const { entreprise } = useEntreprise();
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [actes, setActes] = useState<Acte[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateDebut, setDateDebut] = useState(today());
  const [dateFin, setDateFin] = useState(today());
  const [medecinId, setMedecinId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [ongletActif, setOngletActif] = useState<'actes' | 'historique'>('actes');
  const [historique, setHistorique] = useState<HonoraireHistorique[]>([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => setExpandedRows(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Modal modifier paiement
  const [showModalModifierPaiement, setShowModalModifierPaiement] = useState(false);
  const [paiementAModifier, setPaiementAModifier] = useState<NonNullable<HonoraireHistorique['paiements']>[number] | null>(null);
  const [honorairePaiementEdit, setHonorairePaiementEdit] = useState<HonoraireHistorique | null>(null);
  const [montantEdit, setMontantEdit] = useState('');
  const [recuParEdit, setRecuParEdit] = useState('');
  const [modePaiementEdit, setModePaiementEdit] = useState('Espèce');
  const [banqueEdit, setBanqueEdit] = useState('');
  const [nChequeEdit, setNChequeEdit] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const ouvrirModifierPaiement = (p: NonNullable<HonoraireHistorique['paiements']>[number], h: HonoraireHistorique) => {
    setPaiementAModifier(p);
    setHonorairePaiementEdit(h);
    setMontantEdit(String(p.MontantPayé || ''));
    setRecuParEdit(p.Recupar || p.PayéPar || '');
    setModePaiementEdit(p.Modepaiement || 'Espèce');
    setBanqueEdit(p.BanqueC || '');
    setNChequeEdit(p.NCheque || '');
    setShowModalModifierPaiement(true);
  };

  const fermerModifierPaiement = () => {
    setShowModalModifierPaiement(false);
    setPaiementAModifier(null);
    setHonorairePaiementEdit(null);
  };

  const handleModifierPaiement = async () => {
    if (!paiementAModifier?._id || !honorairePaiementEdit?._id) return;
    const montant = parseInt(montantEdit, 10);
    if (isNaN(montant) || montant <= 0) {
      setMessage({ type: 'danger', text: 'Montant invalide.' });
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/comptabilite/honoraires/payer/${paiementAModifier._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          honoraireId: honorairePaiementEdit._id,
          ancienMontant: paiementAModifier.MontantPayé || 0,
          montant,
          modePaiement: modePaiementEdit,
          banque: banqueEdit,
          numeroCheque: nChequeEdit,
          payePar: recuParEdit,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Paiement modifié avec succès.' });
        fermerModifierPaiement();
        await chargerHistorique();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur lors de la modification.' });
      }
    } catch {
      setMessage({ type: 'danger', text: 'Erreur serveur.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAnnulerPaiement = async (p: NonNullable<HonoraireHistorique['paiements']>[number], h: HonoraireHistorique) => {
    if (!window.confirm(`Annuler ce paiement de ${fmt(p.MontantPayé || 0)} F ?`)) return;
    try {
      const res = await fetch(`/api/comptabilite/honoraires/payer/${p._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ honoraireId: h._id, montant: p.MontantPayé || 0 }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Paiement annulé avec succès.' });
        await chargerHistorique();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur lors de l\'annulation du paiement.' });
      }
    } catch {
      setMessage({ type: 'danger', text: 'Erreur serveur.' });
    }
  };

  // Modal de paiement
  const [showModalPaiement, setShowModalPaiement] = useState(false);
  const [honorairePaiement, setHonorairePaiement] = useState<HonoraireHistorique | null>(null);
  const [montantClient, setMontantClient] = useState('');
  const [recuPar, setRecuPar] = useState('');
  const [modePaiement, setModePaiement] = useState('Espèce');
  const [banque, setBanque] = useState('');
  const [nCheque, setNCheque] = useState('');
  const [datePaiement, setDatePaiement] = useState(today());

  useEffect(() => {
    chargerMedecins();
  }, []);

  const chargerMedecins = async () => {
    try {
      const res = await fetch('/api/medecins');
      if (res.ok) {
        const data = await res.json();
        setMedecins(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur chargement médecins:', error);
    }
  };

  const charger = useCallback(async () => {
    if (!medecinId) {
      setActes([]);
      setSelected(new Set());
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/comptabilite/bordereau-honoraire?medecinId=${medecinId}&dateDebut=${dateDebut}&dateFin=${dateFin}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const json = await res.json();
      const data = json.data || [];
      setActes(data);
      setSelected(new Set(data.map((a: Acte) => a.idActe + '|' + a.type)));
    } catch (error) {
      console.error('Erreur chargement actes:', error);
      setMessage({ type: 'danger', text: 'Erreur lors du chargement des actes.' });
      setActes([]);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }, [medecinId, dateDebut, dateFin]);

  const chargerHistorique = useCallback(async () => {
    if (!medecinId) {
      setHistorique([]);
      return;
    }
    setLoadingHistorique(true);
    try {
      const res = await fetch(`/api/comptabilite/honoraires?medecinId=${medecinId}&dateDebut=${dateDebut}&dateFin=${dateFin}`);
      if (!res.ok) throw new Error('Erreur chargement historique');
      const json = await res.json();
      setHistorique(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      setMessage({ type: 'danger', text: 'Erreur lors du chargement de l\'historique.' });
      setHistorique([]);
    } finally {
      setLoadingHistorique(false);
    }
  }, [medecinId, dateDebut, dateFin]);

  useEffect(() => {
    if (ongletActif === 'historique') {
      chargerHistorique();
    } else if (ongletActif === 'actes' && medecinId) {
      charger();
    }
  }, [ongletActif, medecinId, dateDebut, dateFin, chargerHistorique, charger]);

  const selectedActes = useMemo(() => {
    return actes.filter(a => selected.has(a.idActe + '|' + a.type));
  }, [actes, selected]);

  const totals = useMemo(() => {
    return selectedActes.reduce((s, a) => ({
      totalActe: s.totalActe + a.totalActe,
      totalMedecin: s.totalMedecin + a.totalMedecin,
      totalTaxe: s.totalTaxe + a.taxe,
      netAPayer: s.netAPayer + a.netAPayer,
    }), { totalActe: 0, totalMedecin: 0, totalTaxe: 0, netAPayer: 0 });
  }, [selectedActes]);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(actes.map(a => a.idActe + '|' + a.type)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleOne = (key: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(key);
    else next.delete(key);
    setSelected(next);
  };

  const ouvrirPaiement = (h: HonoraireHistorique) => {
    setHonorairePaiement(h);
    setMontantClient(String(h.Restapayer || 0));
    const medPop = h.Medecin && typeof h.Medecin === 'object' ? h.Medecin as any : null;
    const medIdStr = medPop ? String(medPop._id) : String(h.Medecin || '');
    const medObj = medecins.find(m => String(m._id) === medIdStr) ?? medPop ?? null;
    setRecuPar(medObj ? `${medObj.prenoms || ''} ${medObj.nom || ''}`.trim() : '');
    setModePaiement('Espèce');
    setBanque('');
    setNCheque('');
    setDatePaiement(today());
    setShowModalPaiement(true);
  };

  const fermerPaiement = () => {
    setShowModalPaiement(false);
    setHonorairePaiement(null);
  };

  const handlePayer = async () => {
    if (!honorairePaiement) return;
    const montant = Number(montantClient);
    if (!montant || montant <= 0) {
      setMessage({ type: 'danger', text: 'Veuillez saisir un montant valide.' });
      return;
    }
    if (montant > (honorairePaiement.Restapayer || 0)) {
      setMessage({ type: 'danger', text: 'Le montant dépasse le reste à payer.' });
      return;
    }
    if (!recuPar.trim()) {
      setMessage({ type: 'danger', text: 'Veuillez indiquer qui reçoit le paiement.' });
      return;
    }
    if (modePaiement === 'Chèque' && (!banque.trim() || !nCheque.trim())) {
      setMessage({ type: 'danger', text: 'Veuillez renseigner la banque et le numéro de chèque.' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/comptabilite/honoraires/payer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          honoraireId: honorairePaiement._id,
          montantClient: montant,
          recuPar,
          modePaiement,
          banque,
          nCheque,
          datePaiement,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Médecin payé avec succès.' });
        fermerPaiement();
        await chargerHistorique();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur lors du paiement.' });
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      setMessage({ type: 'danger', text: 'Erreur serveur.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAnnuler = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment annuler ce bordereau ?')) return;
    try {
      const res = await fetch(`/api/comptabilite/honoraires/${id}/annuler`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Bordereau annulé avec succès.' });
        await chargerHistorique();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur lors de l\'annulation.' });
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
      setMessage({ type: 'danger', text: 'Erreur serveur.' });
    }
  };

  const imprimerListe = async (id: string) => {
    try {
      const res = await fetch(`/api/comptabilite/honoraires/${id}/lignes`);
      const json = await res.json();
      if (!json.success) return;

      const lignes = json.data || [];
      const honoraire = json.honoraire || {};
      const medPop = honoraire.Medecin && typeof honoraire.Medecin === 'object' ? honoraire.Medecin : null;
      const medIdStr = medPop ? String(medPop._id) : String(honoraire.Medecin || '');
      const medecinObj = medecins.find(m => String(m._id) === medIdStr) ?? medPop ?? null;
      const nomMedecin = medecinObj
        ? `${medecinObj.prenoms || ''} ${medecinObj.nom || ''}`.trim()
        : 'Médecin';

      const lignesHTML = lignes.map((l: any) => `
        <tr>
          <td style="padding:4px;border:1px solid #000;">${l.DatePres ? new Date(l.DatePres).toLocaleDateString('fr-FR') : '-'}</td>
          <td style="padding:4px;border:1px solid #000;">${l.Patient || '-'}</td>
          <td style="padding:4px;border:1px solid #000;">${l.PrestationMed || '-'}</td>
          <td style="padding:4px;border:1px solid #000;text-align:right;">${fmt(l.Totalacte || 0)}</td>
          <td style="padding:4px;border:1px solid #000;text-align:right;">${fmt(l.Montantpres || 0)}</td>
          <td style="padding:4px;border:1px solid #000;text-align:right;">${fmt(l.TAXE || 0)}</td>
          <td style="padding:4px;border:1px solid #000;text-align:right;">${fmt(l.Netapayer || 0)}</td>
        </tr>
      `).join('');

      const totalActe  = lignes.reduce((s: number, l: any) => s + (l.Totalacte  || 0), 0);
      const totalPart  = lignes.reduce((s: number, l: any) => s + (l.Montantpres || 0), 0);
      const totalTaxe  = lignes.reduce((s: number, l: any) => s + (l.TAXE       || 0), 0);
      const totalNet   = lignes.reduce((s: number, l: any) => s + (l.Netapayer  || 0), 0);

      const contentHTML = `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <div style="text-align:center;margin-bottom:8px;">
            <h4 style="font-weight:bold;font-size:18px;margin-bottom:6px;">LISTE DES ACTES</h4>
            <div style="font-size:13px;"><strong>Liste des Actes et Honoraires de : ${nomMedecin}</strong></div>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-top:20px;">
            <thead>
              <tr>
                <th style="background:#f0f0f0;padding:6px 4px;border:1px solid #000;">Date Prestation</th>
                <th style="background:#f0f0f0;padding:6px 4px;border:1px solid #000;">Patient</th>
                <th style="background:#f0f0f0;padding:6px 4px;border:1px solid #000;">Acte</th>
                <th style="background:#f0f0f0;padding:6px 4px;border:1px solid #000;text-align:right;">Total acte</th>
                <th style="background:#f0f0f0;padding:6px 4px;border:1px solid #000;text-align:right;">Part Médecin</th>
                <th style="background:#f0f0f0;padding:6px 4px;border:1px solid #000;text-align:right;">Taxe</th>
                <th style="background:#f0f0f0;padding:6px 4px;border:1px solid #000;text-align:right;">Net à payer</th>
              </tr>
            </thead>
            <tbody>
              ${lignesHTML}
              <tr style="background:#f0f0f0;font-weight:bold;border-top:2px solid #000;">
                <td style="padding:6px 4px;border:1px solid #000;" colspan="3">TOTAL (${lignes.length} acte(s))</td>
                <td style="padding:6px 4px;border:1px solid #000;text-align:right;">${fmt(totalActe)}</td>
                <td style="padding:6px 4px;border:1px solid #000;text-align:right;">${fmt(totalPart)}</td>
                <td style="padding:6px 4px;border:1px solid #000;text-align:right;">${fmt(totalTaxe)}</td>
                <td style="padding:6px 4px;border:1px solid #000;text-align:right;color:#006064;">${fmt(totalNet)}</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top:14px;font-size:12px;font-style:italic;color:#555;">
            Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      `;

      const headerHTML = generatePrintHeader(entreprise);
      const footerHTML = generatePrintFooter(entreprise);
      createPrintWindow('Liste des actes', headerHTML, contentHTML, footerHTML);
    } catch (error) {
      console.error('Erreur impression liste:', error);
      setMessage({ type: 'danger', text: 'Erreur lors de l\'impression de la liste.' });
    }
  };

  const imprimerRecuPaiement = (
    p: NonNullable<HonoraireHistorique['paiements']>[number],
    h: HonoraireHistorique
  ) => {
    const medecinPopulate = h.Medecin && typeof h.Medecin === 'object' ? h.Medecin as any : null;
    const medecinIdStr = medecinPopulate ? String(medecinPopulate._id) : String(h.Medecin || '');
    const medecinObj = medecins.find(m => String(m._id) === medecinIdStr) ?? medecinPopulate ?? null;
    const nomMedecin = medecinObj
      ? `${medecinObj.prenoms || ''} ${medecinObj.nom || ''}`.trim()
      : 'Médecin';

    const datePaie = p.Date ? new Date(p.Date).toLocaleDateString('fr-FR') : '-';
    const heurePaie = p.Heure || '-';
    const debut = h.DEBUTD ? new Date(h.DEBUTD).toLocaleDateString('fr-FR') : '-';
    const fin = h.FIND ? new Date(h.FIND).toLocaleDateString('fr-FR') : '-';
    const payePar = p.PayéPar && p.PayéPar !== p.Recupar ? p.PayéPar : '';

    const chequeInfo = (p.Modepaiement || '').toLowerCase().includes('cheque') || (p.Modepaiement || '').toLowerCase().includes('chèque')
      ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;color:#555;">Banque</td><td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;font-weight:bold;">${p.BanqueC || '-'}</td></tr>
         <tr><td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;color:#555;">N° Chèque</td><td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;font-weight:bold;">${p.NCheque || '-'}</td></tr>`
      : '';

    const payeParRow = payePar
      ? `<tr style="background:#f5f5f5;"><td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;color:#555;">Payé par</td><td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;font-weight:bold;">${payePar}</td></tr>`
      : '';

    const contentHTML = `
      <div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#2e7d32;color:#fff;padding:6px 24px;border-radius:4px;font-size:16px;font-weight:bold;letter-spacing:1px;">
            REÇU DE PAIEMENT MÉDECIN
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px;">
          <tr style="background:#f5f5f5;">
            <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;color:#555;width:40%;">Médecin</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;font-weight:bold;">${nomMedecin}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;color:#555;">Période</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;">Du <strong>${debut}</strong> au <strong>${fin}</strong></td>
          </tr>
          <tr style="background:#f5f5f5;">
            <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;color:#555;">Date paiement</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;">${datePaie} à ${heurePaie}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;color:#555;">Reçu par</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;font-weight:bold;">${p.Recupar || nomMedecin}</td>
          </tr>
          ${payeParRow}
          <tr style="background:#f5f5f5;">
            <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;color:#555;">Mode de paiement</td>
            <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;">${p.Modepaiement || '-'}</td>
          </tr>
          ${chequeInfo}
        </table>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
          <tr style="background:#e8f5e9;">
            <td style="padding:10px 14px;border:1px solid #a5d6a7;color:#1b5e20;font-weight:bold;">Net à payer (bordereau)</td>
            <td style="padding:10px 14px;border:1px solid #a5d6a7;text-align:right;font-size:15px;font-weight:bold;color:#1b5e20;">${fmt(h.Totalnetapayer || 0)} F</td>
          </tr>
          <tr style="background:#fff9c4;">
            <td style="padding:10px 14px;border:1px solid #f9a825;font-weight:bold;color:#e65100;">Montant payé</td>
            <td style="padding:10px 14px;border:1px solid #f9a825;text-align:right;font-size:16px;font-weight:bold;color:#e65100;">${fmt(p.MontantPayé || 0)} F</td>
          </tr>
          <tr style="background:#ffebee;">
            <td style="padding:10px 14px;border:1px solid #ef9a9a;font-weight:bold;color:#c62828;">Reste à payer</td>
            <td style="padding:10px 14px;border:1px solid #ef9a9a;text-align:right;font-size:15px;font-weight:bold;color:#c62828;">${fmt(p.Restapayer || 0)} F</td>
          </tr>
        </table>

        <div style="text-align:center;margin-top:30px;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:10px;">
          Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    `;

    const headerHTML = generatePrintHeader(entreprise);
    const footerHTML = generatePrintFooter(entreprise);
    createPrintWindow('Reçu paiement médecin', headerHTML, contentHTML, footerHTML);
  };

  const imprimerBordereau = async (id: string, h: HonoraireHistorique) => {
    try {
      const medecinPopulate = h.Medecin && typeof h.Medecin === 'object' ? h.Medecin as any : null;
      const medecinIdStr = medecinPopulate ? String(medecinPopulate._id) : String(h.Medecin || '');
      const medecinFromList = medecins.find(m => String(m._id) === medecinIdStr);
      const medecinObj = medecinFromList ?? medecinPopulate ?? null;
      const nomMedecin = medecinObj
        ? `${medecinObj.prenoms || ''} ${medecinObj.nom || ''}`.trim()
        : 'Médecin';

      const TAX_RATE = 0.075;

      const debut = h.DEBUTD ? new Date(h.DEBUTD).toLocaleDateString('fr-FR') : '-';
      const fin = h.FIND ? new Date(h.FIND).toLocaleDateString('fr-FR') : '-';

      const allLignes = [
        {
          label: 'CONSULTATION',
          taux: medecinObj?.TauxHonoraire ?? 0,
          nb: h.NBHONRAIRE || 0,
          total: h.montanttotalhono || 0,
          part: h.parthonoraire || 0,
        },
        {
          label: 'PRESCRIPTION',
          taux: medecinObj?.TauxPrescription ?? 0,
          nb: h.NBPRESCRIPTION || 0,
          total: h.montanttaotalPrescrip || 0,
          part: h.partpres || 0,
        },
        {
          label: "EXÉCUTION D'ACTES",
          taux: medecinObj?.TauxExecution ?? 0,
          nb: h.NBEXECUTANT || 0,
          total: h.MontanttotalExeut || 0,
          part: h.partexcu || 0,
        },
        {
          label: 'AIDE OPÉRATOIRE',
          taux: medecinObj?.TauxAideOperatoire ?? 0,
          nb: h.NBAideOperatoire || 0,
          total: h.MontantAideTotal || 0,
          part: h.ParAide || 0,
        },
        {
          label: 'ANESTHÉSISTE',
          taux: medecinObj?.TauxAnesthesiste ?? 0,
          nb: h.NBAnestesiste || 0,
          total: h.MontantTotalAnestesiste || 0,
          part: h.ParAnesthesiste || 0,
        },
      ].filter(row => row.taux > 0 || row.part > 0);

      const lignesTableHTML = allLignes.map(row => {
        const taxe = Math.round(row.part * TAX_RATE);
        const net = row.part - taxe;
        return `
          <tr>
            <td style="padding:6px 8px;border:1px solid #000;">${row.label}</td>
            <td style="padding:6px 8px;border:1px solid #000;text-align:right;">${row.nb}</td>
            <td style="padding:6px 8px;border:1px solid #000;text-align:right;">${fmt(row.total)}</td>
            <td style="padding:6px 8px;border:1px solid #000;text-align:right;">${row.taux > 0 ? row.taux + ' %' : '-'}</td>
            <td style="padding:6px 8px;border:1px solid #000;text-align:right;">${fmt(row.part)}</td>
            <td style="padding:6px 8px;border:1px solid #000;text-align:right;">${fmt(taxe)}</td>
            <td style="padding:6px 8px;border:1px solid #000;text-align:right;font-weight:bold;">${fmt(net)}</td>
          </tr>
        `;
      }).join('');

      const totauxHTML = [
        { label: 'TOTAL BRUT HONORAIRE', val: h.MontantJour || 0, bold: false },
        { label: 'RETENUE (7,5%)',        val: h.Totalretenue || 0, bold: false },
        { label: 'NET À PAYER',           val: h.Totalnetapayer || 0, bold: true, bg: '#f5f5f5' },
        { label: 'MONTANT PAYÉ',          val: h.MontantPayé || 0, bold: false },
        { label: 'RESTE À PAYER',         val: h.Restapayer || 0, bold: false },
      ].map(r => `
        <div style="display:flex;justify-content:space-between;border:1px solid #ccc;padding:6px 10px;${r.bg ? `background:${r.bg};` : ''}">
          <span>${r.label}</span>
          <${r.bold ? 'strong' : 'span'}>${fmt(r.val)} F</${r.bold ? 'strong' : 'span'}>
        </div>
      `).join('');

      const contentHTML = `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <div style="text-align:center;margin-bottom:16px;">
            <h4 style="font-weight:bold;font-size:18px;margin-bottom:4px;">FICHE HONORAIRE</h4>
            <div style="font-size:13px;">Du <strong>${debut}</strong> Au <strong>${fin}</strong></div>
            <div style="font-size:13px;margin-top:6px;"><strong>MÉDECIN : ${nomMedecin}</strong></div>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-top:20px;">
            <thead>
              <tr>
                <th style="background:#f0f0f0;padding:6px 8px;border:1px solid #000;text-align:left;">Type</th>
                <th style="background:#f0f0f0;padding:6px 8px;border:1px solid #000;text-align:right;">NB</th>
                <th style="background:#f0f0f0;padding:6px 8px;border:1px solid #000;text-align:right;">Montant total</th>
                <th style="background:#f0f0f0;padding:6px 8px;border:1px solid #000;text-align:right;">Taux</th>
                <th style="background:#f0f0f0;padding:6px 8px;border:1px solid #000;text-align:right;">Part Médecin</th>
                <th style="background:#f0f0f0;padding:6px 8px;border:1px solid #000;text-align:right;">Taxe</th>
                <th style="background:#f0f0f0;padding:6px 8px;border:1px solid #000;text-align:right;">Net à payer</th>
              </tr>
            </thead>
            <tbody>${allLignes.length > 0 ? lignesTableHTML : '<tr><td colspan="7" style="text-align:center;padding:10px;">Aucune ligne</td></tr>'}</tbody>
          </table>
          <div style="display:flex;justify-content:flex-end;margin-top:24px;">
            <div style="width:340px;">${totauxHTML}</div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:20px;font-size:12px;font-style:italic;">
            <span>Imprimé le ${new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      `;

      const headerHTML = generatePrintHeader(entreprise);
      const footerHTML = generatePrintFooter(entreprise);
      createPrintWindow('Fiche Honoraire', headerHTML, contentHTML, footerHTML);
    } catch (error) {
      console.error('Erreur impression bordereau:', error);
      setMessage({ type: 'danger', text: "Erreur lors de l'impression du bordereau." });
    }
  };

  const handleCreerBordereau = async () => {
    if (!medecinId) return;
    if (selectedActes.length === 0) {
      setMessage({ type: 'danger', text: 'Veuillez sélectionner au moins un acte.' });
      return;
    }
    const confirm = window.confirm(
      `Voulez-vous valider le bordereau du médecin pour ${selectedActes.length} acte(s) ?\n\nNet à payer : ${fmt(totals.netAPayer)} F`
    );
    if (!confirm) return;
    setSaving(true);
    try {
      const res = await fetch('/api/comptabilite/bordereau-honoraire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medecinId,
          dateDebut,
          dateFin,
          actes: selectedActes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Bordereau médecin créé avec succès.' });
        await charger();
      } else {
        setMessage({ type: 'danger', text: json.message || 'Erreur lors de la création.' });
      }
    } catch (error) {
      console.error('Erreur création bordereau:', error);
      setMessage({ type: 'danger', text: 'Erreur serveur.' });
    } finally {
      setSaving(false);
    }
  };

  const periode = `${dateDebut.split('-').reverse().join('/')} — ${dateFin.split('-').reverse().join('/')}`;
  const allChecked = actes.length > 0 && selected.size === actes.length;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '8px 10px' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#e65100 0%,#f9a825 50%,#fdd835 100%)', borderRadius: 8, padding: '8px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(230,81,0,0.3)' }}>
        <div>
          <div style={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Module Comptabilité</div>
          <div style={{ color: '#000', fontSize: '1.05rem', fontWeight: 800, letterSpacing: 1 }}>Bordereau Honoraire Médecin</div>
          <div style={{ color: 'rgba(0,0,0,0.55)', fontSize: '0.72rem', marginTop: 1 }}>{periode}</div>
        </div>
        <i className="bi bi-person-badge-fill" style={{ fontSize: '1.8rem', color: 'rgba(0,0,0,0.15)' }}></i>
      </div>

      {message && <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="py-2 mb-2" style={{ fontSize: '0.8rem' }}>{message.text}</Alert>}

      {/* KPIs */}
      <Row className="g-2 mb-2">
        {[
          { label: 'Total Acte', value: totals.totalActe, bg: 'linear-gradient(135deg,#1565c0,#42a5f5)', icon: 'bi-cash-coin' },
          { label: 'Part total Médecin', value: totals.totalMedecin, bg: 'linear-gradient(135deg,#1b5e20,#66bb6a)', icon: 'bi-person-check-fill' },
          { label: 'Total retenu', value: totals.totalTaxe, bg: 'linear-gradient(135deg,#e65100,#ffb74d)', icon: 'bi-percent' },
          { label: 'Net à payer', value: totals.netAPayer, bg: 'linear-gradient(135deg,#006064,#26c6da)', icon: 'bi-wallet2' },
          { label: 'Nb Actes', value: selectedActes.length, bg: 'linear-gradient(135deg,#6a1b9a,#ce93d8)', icon: 'bi-list-check', isCount: true },
        ].map((kpi, ki) => (
          <Col key={ki} xs={6} md={2}>
            <div style={{ background: kpi.bg, borderRadius: 8, padding: '8px 10px', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: 2 }}>{(kpi as any).isCount ? kpi.value : `${fmt(kpi.value)} F`}</div>
                </div>
                <i className={`bi ${kpi.icon}`} style={{ fontSize: '1rem', opacity: 0.35 }}></i>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* FILTRES */}
      <Card className="mb-2" style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <Card.Body style={{ padding: '8px 14px' }}>
          <Row className="g-2 align-items-end">
            <Col xs="auto">
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Début</Form.Label>
              <Form.Control type="date" size="sm" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 130 }} />
            </Col>
            <Col xs="auto">
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Fin</Form.Label>
              <Form.Control type="date" size="sm" value={dateFin} onChange={e => setDateFin(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem', width: 130 }} />
            </Col>
            <Col xs={12} md={4}>
              <Form.Label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#546e7a', letterSpacing: 1, textTransform: 'uppercase' }}>Médecin</Form.Label>
              <Form.Select size="sm" value={medecinId} onChange={e => setMedecinId(e.target.value)} style={{ borderRadius: 6, borderColor: '#b0bec5', fontSize: '0.76rem' }}>
                <option value="">Sélectionner un médecin</option>
                {medecins.map(m => <option key={m._id} value={m._id}>{m.nom} {m.prenoms || ''} — {m.specialite || ''}</option>)}
              </Form.Select>
            </Col>
            <Col xs="auto" className="ms-auto d-flex gap-2">
              <Button onClick={charger} disabled={loading || !medecinId} style={{ background: 'linear-gradient(135deg,#e65100,#f9a825)', border: 'none', color: '#000', fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6 }}>
                {loading ? <><Spinner size="sm" animation="border" className="me-1" />…</> : <><i className="bi bi-search me-1"></i>Afficher</>}
              </Button>
              <Button
                variant="success"
                onClick={handleCreerBordereau}
                disabled={saving || selectedActes.length === 0 || !medecinId}
                style={{ fontWeight: 700, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6 }}
              >
                {saving ? <><Spinner size="sm" animation="border" className="me-1" />…</> : <><i className="bi bi-check-circle me-1"></i>Créer le Bordereau</>}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ONGLETS */}
      <div className="mb-2" style={{ display: 'flex', gap: 8 }}>
        {[
          { key: 'actes', label: 'Actes à payer', icon: 'bi-list-check' },
          { key: 'historique', label: 'Historique', icon: 'bi-clock-history' },
        ].map(o => (
          <button
            key={o.key}
            onClick={() => setOngletActif(o.key as 'actes' | 'historique')}
            style={{
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: ongletActif === o.key ? 'linear-gradient(135deg,#e65100,#f9a825)' : '#fff',
              color: ongletActif === o.key ? '#000' : '#546e7a',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <i className={`bi ${o.icon}`}></i>{o.label}
          </button>
        ))}
      </div>

      {/* TABLEAU ACTES */}
      {ongletActif === 'actes' && (
      <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ background: 'linear-gradient(90deg,#e65100,#f9a825)', color: '#000', padding: '7px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-table me-2"></i>ACTES DU MÉDECIN — {periode}</span>
          <Form.Check
            type="checkbox"
            label={<span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Cocher tout</span>}
            checked={allChecked}
            onChange={e => toggleAll(e.target.checked)}
            disabled={actes.length === 0}
          />
        </div>
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto', maxHeight: '52vh', overflowY: 'auto' }}>
            <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  {['Date Prestation', 'Type', 'ACTE', 'Total acte', 'Total Médecin', 'Taxe (-7.5%)', 'Net à payer', 'Patient', 'A payer'].map((h, hi) => (
                    <th key={hi} style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: [3, 4, 5, 6].includes(hi) ? 'right' : 'center', borderRight: '1px solid #b0bec5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                ) : actes.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>Aucun acte à payer pour ce médecin
                  </td></tr>
                ) : actes.map((a, i) => {
                  const key = a.idActe + '|' + a.type;
                  const checked = selected.has(key);
                  return (
                    <tr key={key} style={{ background: i % 2 === 0 ? '#fff' : '#fffde7', borderLeft: `3px solid ${checked ? '#2e7d32' : '#f57c00'}` }}>
                      <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>{a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '-'}</td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}><Badge bg={typeBadge(a.type)} style={{ fontSize: '0.6rem' }}>{a.type.replace('HONORAIRE ', '')}</Badge></td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{a.acte}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(a.totalActe)}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(a.totalMedecin)}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(a.taxe)}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', color: '#006064', borderRight: '1px solid #e0e0e0' }}>{fmt(a.netAPayer)}</td>
                      <td style={{ padding: '3px 8px', borderRight: '1px solid #e0e0e0' }}>{a.patient}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'center' }}>
                        <Form.Check type="checkbox" checked={checked} onChange={e => toggleOne(key, e.target.checked)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #cfd8dc' }}>
          <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{actes.length} acte(s) trouvé(s) | {selectedActes.length} sélectionné(s)</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#1565c0', textTransform: 'uppercase' }}>Total Acte</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1565c0' }}>{fmt(totals.totalActe)} F</div></div>
            <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#e65100', textTransform: 'uppercase' }}>Total retenu</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#e65100' }}>{fmt(totals.totalTaxe)} F</div></div>
            <div style={{ width: 1, height: 28, background: '#b0bec5' }}></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#006064', textTransform: 'uppercase' }}>Net à payer</div><div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#006064' }}>{fmt(totals.netAPayer)} F</div></div>
          </div>
        </div>
      </Card>
      )}

      {/* TABLEAU HISTORIQUE */}
      {ongletActif === 'historique' && (
      <Card style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ background: 'linear-gradient(90deg,#1565c0,#42a5f5)', color: '#fff', padding: '7px 14px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}><i className="bi bi-clock-history me-2"></i>HISTORIQUE DES HONORAIRES — {periode}</span>
        </div>
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto', maxHeight: '52vh', overflowY: 'auto' }}>
            <Table bordered className="mb-0" style={{ fontSize: '0.73rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  {['N°', 'Date', 'Heure', 'Honoraires Médecin', 'Taxe', 'Net à payer', 'Montant Reçu', 'Reste à payer', 'Début', 'Fin', 'Actions'].map((h, hi) => (
                    <th key={hi} style={{ background: '#cfd8dc', color: '#37474f', padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: [3, 4, 5, 6, 7].includes(hi) ? 'right' : 'center', borderRight: '1px solid #b0bec5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingHistorique ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#78909c' }}><Spinner animation="border" size="sm" className="me-2" />Chargement…</td></tr>
                ) : historique.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '50px', color: '#90a4ae' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}></i>Aucun honoraire trouvé pour ce médecin
                  </td></tr>
                ) : historique.map((h, i) => {
                  const expanded = expandedRows.has(h._id);
                  const paiements = h.paiements || [];
                  return (
                    <React.Fragment key={h._id}>
                      <tr style={{ background: i % 2 === 0 ? '#fff' : '#e3f2fd' }}>
                        <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {i + 1}
                            {paiements.length > 0 && (
                              <span
                                onClick={() => toggleExpand(h._id)}
                                style={{ cursor: 'pointer', color: '#1565c0', fontSize: '0.8rem', userSelect: 'none', lineHeight: 1 }}
                                title={expanded ? 'Masquer paiements' : 'Voir paiements'}
                              >
                                <i className={`bi bi-chevron-${expanded ? 'up' : 'down'}`}></i>
                              </span>
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0' }}>{h.date ? new Date(h.date).toLocaleDateString('fr-FR') : '-'}</td>
                        <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>{h.Heure || '-'}</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>{fmt(h.MontantJour || 0)}</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(h.Totalretenue || 0)}</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', color: '#006064', borderRight: '1px solid #e0e0e0' }}>{fmt(h.Totalnetapayer || 0)}</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', borderRight: '1px solid #e0e0e0' }}>{fmt(h.MontantPayé || 0)}</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', color: '#c62828', borderRight: '1px solid #e0e0e0' }}>{fmt(h.Restapayer || 0)}</td>
                        <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>{h.DEBUTD ? new Date(h.DEBUTD).toLocaleDateString('fr-FR') : '-'}</td>
                        <td style={{ padding: '3px 8px', whiteSpace: 'nowrap', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>{h.FIND ? new Date(h.FIND).toLocaleDateString('fr-FR') : '-'}</td>
                        <td style={{ padding: '3px 6px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <Button variant="success" size="sm" className="me-1 py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => ouvrirPaiement(h)} title="Payer"><i className="bi bi-cash-coin"></i></Button>
                          <Button variant="info" size="sm" className="me-1 py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => imprimerListe(h._id)} title="Liste détaillée"><i className="bi bi-list-ul"></i></Button>
                          <Button variant="primary" size="sm" className="me-1 py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => imprimerBordereau(h._id, h)} title="Bordereau"><i className="bi bi-file-earmark-text"></i></Button>
                          <Button variant="danger" size="sm" className="py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => handleAnnuler(h._id)} title="Annuler"><i className="bi bi-trash"></i></Button>
                        </td>
                      </tr>
                      {expanded && paiements.length > 0 && (
                        <tr key={`${h._id}-paiements`} style={{ background: '#e8f5e9' }}>
                          <td colSpan={11} style={{ padding: '6px 24px', borderTop: '1px dashed #a5d6a7' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2e7d32', marginBottom: 4 }}>
                              <i className="bi bi-credit-card me-1"></i>Détail des paiements
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                              <thead>
                                <tr style={{ background: '#c8e6c9' }}>
                                  <th style={{ padding: '3px 8px', border: '1px solid #a5d6a7', textAlign: 'center' }}>Date</th>
                                  <th style={{ padding: '3px 8px', border: '1px solid #a5d6a7', textAlign: 'center' }}>Heure</th>
                                  <th style={{ padding: '3px 8px', border: '1px solid #a5d6a7', textAlign: 'right' }}>Montant payé</th>
                                  <th style={{ padding: '3px 8px', border: '1px solid #a5d6a7', textAlign: 'right' }}>Reste après</th>
                                  <th style={{ padding: '3px 8px', border: '1px solid #a5d6a7', textAlign: 'center' }}>Reçu par</th>
                                  <th style={{ padding: '3px 8px', border: '1px solid #a5d6a7', textAlign: 'center' }}>Mode</th>
                                  <th style={{ padding: '3px 8px', border: '1px solid #a5d6a7', textAlign: 'center' }}>Banque</th>
                                  <th style={{ padding: '3px 8px', border: '1px solid #a5d6a7', textAlign: 'center' }}>N° Chèque</th>
                                  <th style={{ padding: '3px 8px', border: '1px solid #a5d6a7', textAlign: 'center' }}>Reçu</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paiements.map((p, pi) => (
                                  <tr key={p._id || pi} style={{ background: pi % 2 === 0 ? '#f1f8e9' : '#fff' }}>
                                    <td style={{ padding: '3px 8px', border: '1px solid #dcedc8', textAlign: 'center' }}>{p.Date ? new Date(p.Date).toLocaleDateString('fr-FR') : '-'}</td>
                                    <td style={{ padding: '3px 8px', border: '1px solid #dcedc8', textAlign: 'center' }}>{p.Heure || '-'}</td>
                                    <td style={{ padding: '3px 8px', border: '1px solid #dcedc8', textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>{fmt(p.MontantPayé || 0)} F</td>
                                    <td style={{ padding: '3px 8px', border: '1px solid #dcedc8', textAlign: 'right', color: '#c62828' }}>{fmt(p.Restapayer || 0)} F</td>
                                    <td style={{ padding: '3px 8px', border: '1px solid #dcedc8', textAlign: 'center' }}>{p.Recupar || p.PayéPar || '-'}</td>
                                    <td style={{ padding: '3px 8px', border: '1px solid #dcedc8', textAlign: 'center' }}>{p.Modepaiement || '-'}</td>
                                    <td style={{ padding: '3px 8px', border: '1px solid #dcedc8', textAlign: 'center' }}>{p.BanqueC || '-'}</td>
                                    <td style={{ padding: '3px 8px', border: '1px solid #dcedc8', textAlign: 'center' }}>{p.NCheque || '-'}</td>
                                    <td style={{ padding: '3px 6px', border: '1px solid #dcedc8', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                      <Button variant="outline-success" size="sm" className="py-0 px-1 me-1" style={{ fontSize: '0.65rem' }} onClick={() => imprimerRecuPaiement(p, h)} title="Imprimer le reçu">
                                        <i className="bi bi-printer"></i>
                                      </Button>
                                      <Button variant="outline-primary" size="sm" className="py-0 px-1 me-1" style={{ fontSize: '0.65rem' }} onClick={() => ouvrirModifierPaiement(p, h)} title="Modifier">
                                        <i className="bi bi-pencil"></i>
                                      </Button>
                                      <Button variant="outline-danger" size="sm" className="py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => handleAnnulerPaiement(p, h)} title="Annuler ce paiement">
                                        <i className="bi bi-x-circle"></i>
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        <div style={{ background: '#eceff1', borderRadius: '0 0 8px 8px', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #cfd8dc' }}>
          <span style={{ fontSize: '0.72rem', color: '#78909c' }}>{historique.length} honoraire(s) trouvé(s)</span>
        </div>
      </Card>
      )}

      {/* MODAL MODIFIER PAIEMENT */}
      <Modal show={showModalModifierPaiement} onHide={fermerModifierPaiement} centered size="lg">
        <Modal.Header closeButton style={{ background: 'linear-gradient(90deg,#1565c0,#42a5f5)', color: '#fff' }}>
          <Modal.Title style={{ fontSize: '0.95rem' }}><i className="bi bi-pencil me-2"></i>Modifier le paiement</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: '0.8rem' }}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Montant payé actuel</Form.Label>
                <Form.Control type="text" readOnly value={`${fmt(paiementAModifier?.MontantPayé || 0)} F`} style={{ background: '#e3f2fd', fontWeight: 'bold' }} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Nouveau montant</Form.Label>
                <Form.Control type="number" value={montantEdit} onChange={e => setMontantEdit(e.target.value)} min={1} style={{ fontWeight: 'bold', color: '#1565c0' }} />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Reçu par</Form.Label>
                <Form.Control type="text" value={recuParEdit} onChange={e => setRecuParEdit(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Mode de paiement</Form.Label>
                <Form.Select value={modePaiementEdit} onChange={e => setModePaiementEdit(e.target.value)}>
                  <option value="Espèce">Espèce</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Virement">Virement</option>
                  <option value="Mobile Money">Mobile Money</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          {modePaiementEdit === 'Chèque' && (
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Banque</Form.Label>
                  <Form.Control type="text" value={banqueEdit} onChange={e => setBanqueEdit(e.target.value)} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>N° chèque</Form.Label>
                  <Form.Control type="text" value={nChequeEdit} onChange={e => setNChequeEdit(e.target.value)} />
                </Form.Group>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={fermerModifierPaiement}>Fermer</Button>
          <Button variant="primary" size="sm" onClick={handleModifierPaiement} disabled={savingEdit}>
            {savingEdit ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL DE PAIEMENT */}
      <Modal show={showModalPaiement} onHide={fermerPaiement} centered size="lg">
        <Modal.Header closeButton style={{ background: 'linear-gradient(90deg,#2e7d32,#66bb6a)', color: '#fff' }}>
          <Modal.Title style={{ fontSize: '0.95rem' }}><i className="bi bi-cash-coin me-2"></i>Recouvrement médecin</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: '0.8rem' }}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Reste à payer</Form.Label>
                <Form.Control type="text" readOnly value={`${fmt(honorairePaiement?.Restapayer || 0)} F`} style={{ fontWeight: 'bold', color: '#c62828', background: '#ffebee' }} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Montant à payer</Form.Label>
                <Form.Control type="number" value={montantClient} onChange={e => setMontantClient(e.target.value)} min={1} style={{ fontWeight: 'bold', color: '#2e7d32' }} />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Reçu par</Form.Label>
                <Form.Control type="text" value={recuPar} onChange={e => setRecuPar(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date de paiement</Form.Label>
                <Form.Control type="date" value={datePaiement} onChange={e => setDatePaiement(e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Mode de paiement</Form.Label>
                <Form.Select value={modePaiement} onChange={e => setModePaiement(e.target.value)}>
                  <option value="Espèce">Espèce</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Virement">Virement</option>
                  <option value="Mobile Money">Mobile Money</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {modePaiement === 'Chèque' && (
              <>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Banque</Form.Label>
                    <Form.Control type="text" value={banque} onChange={e => setBanque(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>N° chèque</Form.Label>
                    <Form.Control type="text" value={nCheque} onChange={e => setNCheque(e.target.value)} />
                  </Form.Group>
                </Col>
              </>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={fermerPaiement}>Annuler</Button>
          <Button variant="success" size="sm" onClick={handlePayer} disabled={saving}>
            {saving ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Valider le paiement
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
