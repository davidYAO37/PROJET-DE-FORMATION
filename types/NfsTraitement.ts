export interface NfsTraitement {
    Patient_Nom?: string;
    Patient_prenom?: string;
    PatientP?: string;
    Patient_ages?: string;
    Patient_Sexe?: string;
    Patient_numDossier?: string;
    NumNFs?: string;
    NFS_dateAnalyse?: Date;
    NFS_service?: string;
    NFS_idEchantillon?: string;
    diagnostiQ?: string;
    NFS_status?: string;
    NFS_unite?: string;
    NFS_parametres?: string;
    NFS_resultat?: string;
    NFS_plageRef?: string;
    NFS_id?: number;
    CodePrestation?: string;
    IDFAMILLE_ACTE_BIOLOGIE?: string;
    CodeAscii?: number;
    ValeurMaxNormale?: number;
    ValeurMinNormale?: number;
    DejaUtilise?: boolean;
}
