import { generatePrintHeader, generatePrintFooter, createPrintWindow } from "@/utils/printRecu";
import { useEntreprise } from "@/hooks/useEntreprise";
import { NumberToLetter } from "@mandarvl/convertir-nombre-lettre";
import { Button } from "react-bootstrap";
import { FaPrint } from "react-icons/fa";

interface ComptePatient {
  _id?: string;
  DateAjout?: string | Date;
  MontantClient?: number;
  TypeCompte?: 'Paiement' | 'Remboursement';
  ModePaiement?: string;
  RecuDe?: string;
  RecuPar?: string;
  MotifCompte?: string;
  IDPARTIENT?: any;
}

interface RecuComptePatientProps {
  compte: ComptePatient;
}

export function generateRecuComptePatientHTML(compte: ComptePatient): string {
  const patient = compte.IDPARTIENT || {};
  const date = compte.DateAjout ? new Date(compte.DateAjout).toLocaleDateString() : new Date().toLocaleDateString();
  const heure = compte.DateAjout ? new Date(compte.DateAjout).toLocaleTimeString() : new Date().toLocaleTimeString();
  const montant = Math.abs(compte.MontantClient || 0);
  const type = compte.TypeCompte || 'Paiement';
  const isPaiement = type === 'Paiement';
  const titre = isPaiement ? 'REÇU DE PAIEMENT' : 'REÇU DE REMBOURSEMENT';
  const couleur = isPaiement ? '#198754' : '#dc3545';
  const bgClair = isPaiement ? '#f0fff4' : '#fff5f5';
  const numero = compte._id ? compte._id.toString().slice(-6).toUpperCase() : '';
  const montantLettres = NumberToLetter(montant);
  const labelRecuDe = isPaiement ? 'Reçu de' : 'Remboursé à';
  const labelRecuPar = isPaiement ? 'Reçu par' : 'Remboursé par';
  const labelLibelle = isPaiement ? 'Paiement reçu' : 'Remboursement effectué';

  return `
    <div class="print-area" style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #222;">
      <div style="border-radius: 10px; overflow: hidden; border: 1px solid #e0e0e0; box-shadow: 0 3px 10px rgba(0,0,0,0.06);">
        <!-- En-tête coloré -->
        <div style="background: ${couleur}; color: #fff; padding: 16px 22px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 18px; font-weight: 700; letter-spacing: 0.8px;">${titre}</div>
          <div style="font-size: 11px; text-align: right; opacity: 0.95;">
            <div style="font-weight: 600;">N° ${numero}</div>
            <div>${date} à ${heure}</div>
          </div>
        </div>

        <div style="padding: 22px;">
          <!-- Blocs Patient + Opération -->
          <div style="display: flex; gap: 16px; margin-bottom: 20px;">
            <div style="flex: 1; background: #f8f9fa; border-radius: 8px; padding: 14px; border-left: 4px solid ${couleur};">
              <div style="font-size: 10px; color: #777; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Patient</div>
              <div style="font-size: 15px; font-weight: 700; color: #000;">${patient.Nom || ''} ${patient.Prenoms || ''}</div>
              <div style="font-size: 12px; color: #555; margin-top: 4px;">N° Dossier : ${patient.Code_dossier || '-'}</div>
              <div style="font-size: 12px; color: #555;">Contact : ${patient.Contact || '-'}</div>
            </div>

            <div style="flex: 1; background: #f8f9fa; border-radius: 8px; padding: 14px; border-left: 4px solid ${couleur};">
              <div style="font-size: 10px; color: #777; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Opération</div>
              <div style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; color: #fff; background: ${couleur}; margin-bottom: 6px;">
                ${type.toUpperCase()}
              </div>
              <div style="font-size: 12px; color: #555;">Mode : ${compte.ModePaiement || '-'}</div>
              <div style="font-size: 12px; color: #555;">Date : ${date}</div>
            </div>
          </div>

          <!-- Détails -->
          <div style="margin-bottom: 22px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #ddd;">
              <span style="color: #666;">${labelRecuDe}</span>
              <span style="font-weight: 600;">${compte.RecuDe || '-'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #ddd;">
              <span style="color: #666;">${labelRecuPar}</span>
              <span style="font-weight: 600;">${compte.RecuPar || '-'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #ddd;">
              <span style="color: #666;">Motif</span>
              <span style="font-weight: 600; text-align: right; max-width: 70%;">${compte.MotifCompte || '-'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #ddd;">
              <span style="color: #666;">Libellé</span>
              <span style="font-weight: 600;">${labelLibelle}</span>
            </div>
          </div>

          <!-- Montant en évidence -->
          <div style="text-align: center; padding: 26px; border-radius: 10px; background: ${bgClair}; border: 2px solid ${couleur}; margin-bottom: 24px;">
            <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px;">
              Montant ${isPaiement ? 'payé' : 'remboursé'}
            </div>
            <div style="font-size: 34px; font-weight: 800; color: ${couleur}; line-height: 1;">
              ${montant.toLocaleString()} <span style="font-size: 18px; font-weight: 600;">FCFA</span>
            </div>
            <div style="font-size: 13px; color: #555; font-style: italic; margin-top: 12px;">
              soit ${montantLettres} Francs CFA
            </div>
          </div>

          <!-- Signatures -->
          <div style="display: flex; justify-content: space-between; margin-top: 48px;">
            <div style="width: 40%; text-align: center;">
              <div style="border-top: 1px solid #333; padding-top: 6px; font-size: 11px; font-weight: 600;">Signature du patient</div>
            </div>
            <div style="width: 40%; text-align: center;">
              <div style="border-top: 1px solid #333; padding-top: 6px; font-size: 11px; font-weight: 600;">Signature du caissier</div>
            </div>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 18px; font-size: 11px; color: #888; font-style: italic;">
        Merci pour votre confiance
      </div>
    </div>
  `;
}

export default function RecuComptePatient({ compte }: RecuComptePatientProps) {
  const { entreprise } = useEntreprise();
  const type = compte.TypeCompte || 'Paiement';
  const isPaiement = type === 'Paiement';

  const handlePrint = () => {
    const content = generateRecuComptePatientHTML(compte);
    createPrintWindow('Reçu compte patient', generatePrintHeader(entreprise), content, generatePrintFooter(entreprise));
  };

  return (
    <Button
      variant={isPaiement ? 'outline-success' : 'outline-danger'}
      size="sm"
      onClick={handlePrint}
      title="Imprimer le reçu"
    >
      <FaPrint className="me-1" /> Imprimer
    </Button>
  );
}
