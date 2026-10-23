import "./portail.css";

export const metadata = {
  title: "Portail Patient — EasyMedical",
  description: "Consultez votre dossier médical, vos résultats et demandez vos rendez-vous",
};

export default function PortailLayout({ children }: { children: React.ReactNode }) {
  return <div className="portail-root">{children}</div>;
}
