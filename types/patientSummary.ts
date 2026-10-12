export type MedicalAlertLevel = "info" | "warning" | "critical";

export interface MedicalAlert {
  code: string;
  label: string;
  level: MedicalAlertLevel;
}

export interface PatientSummaryEvent {
  id: string;
  type: "consultation" | "prescription" | "biologie" | "radiologie" | "hospitalisation";
  date: string;
  title: string;
  detail?: string;
  status?: string;
}

export interface PatientSummary {
  patient: {
    id: string;
    fullName: string;
    birthDate?: string;
    age?: number;
    sex?: string;
    fileNumber: string;
    contact?: string;
    insurance?: string;
  };
  vigilance: {
    allergiesStatus: "known" | "unknown";
    allergies?: string;
    alerts: MedicalAlert[];
    missingInformation: string[];
  };
  history: {
    medical?: string;
    surgical?: string;
    family?: string;
    other?: string;
  };
  latestVitals?: {
    date: string;
    temperature?: string;
    bloodPressure?: string;
    pulse?: string;
    weight?: string;
  };
  latestConsultation?: {
    id: string;
    date: string;
    doctor?: string;
    reason?: string;
    diagnosis?: string;
    examination?: string;
    treatment?: string;
    conclusion?: string;
  };
  recentEvents: PatientSummaryEvent[];
  counts: {
    consultations: number;
    prescriptions: number;
    biologicalExams: number;
    radiologyReports: number;
    hospitalisations: number;
  };
  generatedAt: string;
}
