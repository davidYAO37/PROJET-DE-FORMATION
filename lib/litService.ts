import mongoose from "mongoose";
import { getTenantModel } from "@/lib/tenantModels";
import { IExamenHospitalisation } from "@/models/examenHospit";
import { ILit } from "@/models/lit";
import { IChambre } from "@/models/chambre";
import { IPatient } from "@/models/patient";
import { IMouvementHospitalisation } from "@/models/hospitalisation/MouvementHospitalisation";

export class LitServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

interface AffecterLitOptions {
    hospitalisationId: string;
    litId: string;
    chambreId?: string;
    auteurId?: mongoose.Types.ObjectId;
    session?: mongoose.ClientSession;
}

/**
 * Affecte ou remplace le lit d'un séjour (ExamenHospitalisation).
 * - Vérifie que le lit appartient à la chambre et qu'il est libre (ou déjà occupé par ce patient).
 * - Libère l'ancien lit s'il était occupé par ce même patient.
 * - Met à jour le séjour (litId, IDCHAMBRE, Chambre, statut en_cours) et resynchronise
 *   Code_dossier depuis la fiche patient.
 * - Écrit un mouvement "admission" (premier lit) ou "transfert" (changement de lit).
 */
export async function affecterLitSejour(
    connection: Parameters<typeof getTenantModel>[0],
    options: AffecterLitOptions
) {
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, "ExamenHospitalisation");
    const Lit = getTenantModel<ILit>(connection, "Lit");
    const Chambre = getTenantModel<IChambre>(connection, "Chambre");
    const Patient = getTenantModel<IPatient>(connection, "Patient");
    const Mouvement = getTenantModel<IMouvementHospitalisation>(connection, "MouvementHospitalisation");
    const session = options.session;

    const q = <T>(query: T) => (session ? (query as any).session(session) : query);

    if (!mongoose.isValidObjectId(options.hospitalisationId) || !mongoose.isValidObjectId(options.litId)) {
        throw new LitServiceError("Identifiants de séjour ou de lit invalides");
    }

    const sejour = await q(ExamenHospitalisation.findById(options.hospitalisationId));
    if (!sejour) throw new LitServiceError("Séjour introuvable", 404);
    if (sejour.statutHospitalisation && sejour.statutHospitalisation !== "en_cours") {
        throw new LitServiceError("Impossible d'attribuer un lit à un séjour clôturé", 409);
    }
    if (!sejour.IdPatient) throw new LitServiceError("Le séjour n'est pas rattaché à un patient", 409);

    const patient = await q(Patient.findById(sejour.IdPatient).lean<IPatient | null>());
    if (!patient) throw new LitServiceError("Patient du séjour introuvable", 404);

    // Le lit détermine la chambre ; chambreId optionnel sert de contrôle de cohérence
    const lit = await q(Lit.findById(options.litId).lean<ILit | null>());
    if (!lit) throw new LitServiceError("Lit introuvable", 404);
    if (options.chambreId && String(lit.chambreId) !== String(options.chambreId)) {
        throw new LitServiceError("Le lit n'appartient pas à la chambre sélectionnée");
    }
    const chambre = await q(Chambre.findById(lit.chambreId).lean<IChambre | null>());
    if (!chambre) throw new LitServiceError("Chambre du lit introuvable", 404);
    if (["maintenance", "fermee"].includes(chambre.etat)) {
        throw new LitServiceError("Chambre indisponible", 409);
    }

    const previousLitId = sejour.litId ? String(sejour.litId) : null;
    const previousChambreId = sejour.IDCHAMBRE ? String(sejour.IDCHAMBRE) : null;
    const patientId = patient._id;

    // Réservation atomique : lit libre, ou déjà occupé par ce même patient (réaffectation)
    const reserved = await q(Lit.findOneAndUpdate(
        {
            _id: lit._id,
            $or: [{ etat: "libre" }, { patientId }],
        },
        {
            $set: { etat: "occupe", patientId, dateOccupation: new Date() },
            $unset: { dateLiberation: 1 },
        },
        { new: true }
    ).lean<ILit | null>());
    if (!reserved) {
        throw new LitServiceError("Lit indisponible", 409);
    }

    // Libérer l'ancien lit seulement s'il était encore occupé par ce patient
    if (previousLitId && previousLitId !== String(lit._id)) {
        await q(Lit.updateMany(
            { _id: previousLitId, patientId },
            { $set: { etat: "libre", dateLiberation: new Date() }, $unset: { patientId: 1 } }
        ));
    }
    if (previousChambreId && previousChambreId !== String(chambre._id)) {
        const autreSejour = await q(ExamenHospitalisation.exists({
            IDCHAMBRE: previousChambreId,
            statutHospitalisation: "en_cours",
            _id: { $ne: sejour._id },
        }));
        if (!autreSejour) {
            await q(Chambre.updateOne({ _id: previousChambreId }, { $set: { etat: "libre" } }));
        }
    }

    await q(Chambre.updateOne({ _id: chambre._id }, { $set: { etat: "occupee" } }));

    sejour.litId = lit._id as any;
    sejour.IDCHAMBRE = chambre._id as any;
    sejour.Chambre = chambre.numero;
    sejour.statutHospitalisation = "en_cours";
    // Resynchronise le code dossier du séjour avec la fiche patient
    sejour.Code_dossier = patient.Code_dossier;
    sejour.PatientP = `${patient.Nom} ${patient.Prenoms}`.trim();
    await sejour.save(session ? { session } : undefined as any);

    await q(new Mouvement({
        hospitalisationId: sejour._id,
        patientId,
        type: previousLitId ? "transfert" : "admission",
        date: new Date(),
        heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        chambreIdSource: previousChambreId || undefined,
        litIdSource: previousLitId || undefined,
        chambreIdCible: chambre._id,
        litIdCible: lit._id,
        auteurId: options.auteurId,
        motif: previousLitId ? "Changement de lit" : "Attribution du lit",
    }).save(session ? { session } : undefined as any));

    return sejour;
}

interface LigneAvecActe {
    IDACTE?: string;
    litId?: string;
    chambreId?: string;
    [key: string]: any;
}

/**
 * Détecte les lignes dont l'acte est lié à une chambre (Chambre.acteCliniqueId)
 * et applique l'admission réelle au séjour : lit obligatoire, réservation,
 * synchronisation du code dossier et mouvement d'admission/transfert.
 * Retourne true si une affectation a été effectuée.
 */
export async function affecterLitDepuisLignes(
    connection: Parameters<typeof getTenantModel>[0],
    options: {
        lignes: LigneAvecActe[];
        hospitalisationId: string;
        chambreId?: string;
        auteurId?: mongoose.Types.ObjectId;
        session?: mongoose.ClientSession;
    }
): Promise<boolean> {
    const Chambre = getTenantModel<IChambre>(connection, "Chambre");
    const session = options.session;
    const lignes = Array.isArray(options.lignes) ? options.lignes : [];

    const acteIds = lignes
        .map((l) => l.IDACTE)
        .filter((id): id is string => typeof id === "string" && mongoose.isValidObjectId(id));
    if (acteIds.length === 0) return false;

    const chambresLiees = await (session
        ? Chambre.find({ acteCliniqueId: { $in: acteIds } }).session(session).lean()
        : Chambre.find({ acteCliniqueId: { $in: acteIds } }).lean());
    const acteToChambre = new Map(chambresLiees.map((c: any) => [String(c.acteCliniqueId), c]));
    const lignesChambre = lignes.filter((l) => l.IDACTE && acteToChambre.has(String(l.IDACTE)));
    if (lignesChambre.length === 0) return false;

    const litIds = new Set(
        lignesChambre
            .map((l) => l.litId)
            .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    );
    if (litIds.size === 0) {
        throw new LitServiceError(
            "Sélectionnez un lit pour l'acte de chambre : il matérialise l'admission du patient.",
            400
        );
    }
    if (litIds.size > 1) {
        throw new LitServiceError("Un seul lit peut être attribué au séjour.", 400);
    }

    const litId = [...litIds][0];
    const chambreId =
        lignesChambre.find((l) => l.litId)?.chambreId || options.chambreId;

    await affecterLitSejour(connection, {
        hospitalisationId: options.hospitalisationId,
        litId,
        chambreId: chambreId ? String(chambreId) : undefined,
        auteurId: options.auteurId,
        session: options.session,
    });
    return true;
}
