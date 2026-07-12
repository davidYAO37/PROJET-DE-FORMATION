'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Table, Container, Spinner } from 'react-bootstrap';

interface Ligne {
  _id: string;
  DatePres?: string;
  PrestationMed?: string;
  Patient?: string;
  Totalacte?: number;
  Montantpres?: number;
  TAXE?: number;
  Netapayer?: number;
  TYPEACTE?: string;
}

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');

export default function ImprimerListePage() {
  const { id } = useParams<{ id: string }>();
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [honoraire, setHonoraire] = useState<any>(null);
  const [medecin, setMedecin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/comptabilite/honoraires/${id}/lignes`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setLignes(json.data || []);
          setHonoraire(json.honoraire);
          if (json.honoraire?.Medecin?._id) {
            fetch(`/api/comptabilite/honoraires?action=medecins`)
              .then(r => r.json())
              .then(m => {
                const found = (m.data || []).find((x: any) => String(x._id) === String(json.honoraire.Medecin._id));
                setMedecin(found);
              });
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const nomMedecin = medecin
    ? `${medecin.prenoms || ''} ${medecin.nom || ''}`.trim()
    : (honoraire?.Medecin?.prenoms || '') + ' ' + (honoraire?.Medecin?.nom || '').trim();

  if (loading) {
    return (
      <Container className="text-center p-5">
        <Spinner animation="border" size="sm" className="me-2" />Chargement…
      </Container>
    );
  }

  return (
    <Container fluid className="p-4" style={{ fontSize: '0.85rem' }}>
      <div className="text-center mb-4">
        <h4>LISTE DES ACTES</h4>
        <div><strong>{nomMedecin || 'Médecin'}</strong></div>
      </div>

      <Table bordered striped hover size="sm">
        <thead>
          <tr>
            <th>Date Prestation</th>
            <th>Patient</th>
            <th>Acte</th>
            <th className="text-end">Total acte</th>
            <th className="text-end">Part Médecin</th>
            <th className="text-end">Taxe</th>
            <th className="text-end">Net à payer</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={l._id || i}>
              <td>{l.DatePres ? new Date(l.DatePres).toLocaleDateString('fr-FR') : '-'}</td>
              <td>{l.Patient || '-'}</td>
              <td>{l.PrestationMed || '-'}</td>
              <td className="text-end">{fmt(l.Totalacte || 0)}</td>
              <td className="text-end">{fmt(l.Montantpres || 0)}</td>
              <td className="text-end">{fmt(l.TAXE || 0)}</td>
              <td className="text-end">{fmt(l.Netapayer || 0)}</td>
            </tr>
          ))}
          {lignes.length === 0 && (
            <tr><td colSpan={7} className="text-center">Aucune ligne</td></tr>
          )}
        </tbody>
      </Table>

      <div className="d-flex justify-content-between mt-4">
        <div>Imprimé le {new Date().toLocaleDateString('fr-FR')}</div>
        <div>Total : {fmt(lignes.reduce((s, l) => s + (l.Netapayer || 0), 0))} F</div>
      </div>
    </Container>
  );
}
