'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Container, Spinner, Table } from 'react-bootstrap';

const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');

export default function ImprimerBordereauPage() {
  const { id } = useParams<{ id: string }>();
  const [honoraire, setHonoraire] = useState<any>(null);
  const [medecin, setMedecin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/comptabilite/honoraires/${id}/lignes`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
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
    : `${honoraire?.Medecin?.prenoms || ''} ${honoraire?.Medecin?.nom || ''}`.trim();

  const debut = honoraire?.DEBUTD ? new Date(honoraire.DEBUTD).toLocaleDateString('fr-FR') : '-';
  const fin = honoraire?.FIND ? new Date(honoraire.FIND).toLocaleDateString('fr-FR') : '-';

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
        <h4>FICHE HONORAIRE</h4>
        <div>Du <strong>{debut}</strong> Au <strong>{fin}</strong></div>
        <div className="mt-2"><strong>MÉDECIN : {nomMedecin || '-'}</strong></div>
      </div>

      <Table bordered size="sm">
        <thead>
          <tr>
            <th>Type</th>
            <th className="text-end">NB</th>
            <th className="text-end">Montant total</th>
            <th className="text-end">Part Médecin</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CONSULTATION</td>
            <td className="text-end">{honoraire?.NBHONRAIRE || 0}</td>
            <td className="text-end">{fmt(honoraire?.montanttotalhono)}</td>
            <td className="text-end">{fmt(honoraire?.parthonoraire)}</td>
          </tr>
          <tr>
            <td>PRESCRIPTION</td>
            <td className="text-end">{honoraire?.NBPRESCRIPTION || 0}</td>
            <td className="text-end">{fmt(honoraire?.montanttaotalPrescrip)}</td>
            <td className="text-end">{fmt(honoraire?.partpres)}</td>
          </tr>
          <tr>
            <td>EXÉCUTION D&apos;ACTES</td>
            <td className="text-end">{honoraire?.NBEXECUTANT || 0}</td>
            <td className="text-end">{fmt(honoraire?.MontanttotalExeut)}</td>
            <td className="text-end">{fmt(honoraire?.partexcu)}</td>
          </tr>
          <tr>
            <td>AIDE OPÉRATOIRE</td>
            <td className="text-end">{honoraire?.NBAideOperatoire || 0}</td>
            <td className="text-end">{fmt(honoraire?.MontantAideTotal)}</td>
            <td className="text-end">{fmt(honoraire?.ParAide)}</td>
          </tr>
          <tr>
            <td>ANESTHÉSISTE</td>
            <td className="text-end">{honoraire?.NBAnestesiste || 0}</td>
            <td className="text-end">{fmt(honoraire?.MontantTotalAnestesiste)}</td>
            <td className="text-end">{fmt(honoraire?.ParAnesthesiste)}</td>
          </tr>
        </tbody>
      </Table>

      <div className="d-flex justify-content-end mt-4">
        <div style={{ width: 320 }}>
          <div className="d-flex justify-content-between border p-2">
            <span>TOTAL BRUT HONORAIRE</span>
            <strong>{fmt(honoraire?.MontantJour)} F</strong>
          </div>
          <div className="d-flex justify-content-between border p-2">
            <span>RETENUE (7,5%)</span>
            <strong>{fmt(honoraire?.Totalretenue)} F</strong>
          </div>
          <div className="d-flex justify-content-between border p-2 bg-light">
            <span>NET À PAYER</span>
            <strong>{fmt(honoraire?.Totalnetapayer)} F</strong>
          </div>
          <div className="d-flex justify-content-between border p-2">
            <span>MONTANT PAYÉ</span>
            <strong>{fmt(honoraire?.MontantPayé)} F</strong>
          </div>
          <div className="d-flex justify-content-between border p-2">
            <span>RESTE À PAYER</span>
            <strong>{fmt(honoraire?.Restapayer)} F</strong>
          </div>
        </div>
      </div>
    </Container>
  );
}
