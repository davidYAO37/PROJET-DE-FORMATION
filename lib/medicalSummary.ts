import { MedicalAlert } from "@/types/patientSummary";

export interface VitalValues {
  temperature?: string;
  tension?: string;
  pouls?: string;
}

const parseNumber = (value?: string) => {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBloodPressure = (value?: string) => {
  if (!value) return null;
  const values = value.split("/").map((part) => parseNumber(part.trim()));
  if (values.length < 2 || values[0] === null || values[1] === null) return null;
  return { systolic: values[0], diastolic: values[1] };
};

export function calculateVitalPriority(vitals: VitalValues): "basse" | "normale" | "urgente" {
  const temperature = parseNumber(vitals.temperature);
  const pressure = parseBloodPressure(vitals.tension);
  const pulse = parseNumber(vitals.pouls);
  let score = 0;

  if (temperature !== null) {
    if (temperature > 39 || temperature < 35) score += 3;
    else if (temperature > 38 || temperature < 36) score += 1;
  }

  if (pressure) {
    if (pressure.systolic > 160 || pressure.systolic < 90 || pressure.diastolic > 100 || pressure.diastolic < 60) score += 3;
    else if (pressure.systolic > 140 || pressure.systolic < 100 || pressure.diastolic > 90 || pressure.diastolic < 70) score += 1;
  }

  if (pulse !== null) {
    if (pulse > 140 || pulse < 40) score += 3;
    else if (pulse > 100 || pulse < 60) score += 1;
  }

  if (score >= 3) return "urgente";
  if (score >= 1) return "normale";
  return "basse";
}

export function buildVitalAlerts(vitals: VitalValues): MedicalAlert[] {
  const alerts: MedicalAlert[] = [];
  const temperature = parseNumber(vitals.temperature);
  const pressure = parseBloodPressure(vitals.tension);
  const pulse = parseNumber(vitals.pouls);

  if (temperature !== null && (temperature > 39 || temperature < 35)) {
    alerts.push({ code: "temperature-critical", label: `Température critique : ${vitals.temperature} °C`, level: "critical" });
  } else if (temperature !== null && (temperature > 38 || temperature < 36)) {
    alerts.push({ code: "temperature-warning", label: `Température à surveiller : ${vitals.temperature} °C`, level: "warning" });
  }

  if (pressure && (pressure.systolic > 160 || pressure.systolic < 90 || pressure.diastolic > 100 || pressure.diastolic < 60)) {
    alerts.push({ code: "pressure-critical", label: `Tension critique : ${vitals.tension} mmHg`, level: "critical" });
  } else if (pressure && (pressure.systolic > 140 || pressure.systolic < 100 || pressure.diastolic > 90 || pressure.diastolic < 70)) {
    alerts.push({ code: "pressure-warning", label: `Tension à surveiller : ${vitals.tension} mmHg`, level: "warning" });
  }

  if (pulse !== null && (pulse > 140 || pulse < 40)) {
    alerts.push({ code: "pulse-critical", label: `Pouls critique : ${vitals.pouls} bpm`, level: "critical" });
  } else if (pulse !== null && (pulse > 100 || pulse < 60)) {
    alerts.push({ code: "pulse-warning", label: `Pouls à surveiller : ${vitals.pouls} bpm`, level: "warning" });
  }

  return alerts;
}
