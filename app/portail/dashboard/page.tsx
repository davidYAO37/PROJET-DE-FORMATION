"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type Tab = "accueil" | "dossier" | "resultats" | "rdv";

interface PatientInfo {
  _id: string;
  nom: string;
  prenoms: string;
  codeDossier: string;
  sexe?: string;
  dateNaissance?: string;
  contact?: string;
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "accueil", label: "Accueil", icon: "bi-house-heart" },
  { key: "dossier", label: "Mon dossier", icon: "bi-file-earmark-medical" },
  { key: "resultats", label: "Mes résultats", icon: "bi-clipboard2-pulse" },
  { key: "rdv", label: "Rendez-vous", icon: "bi-calendar2-check" },
];

function formatDate(d?: string | Date | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function statutBadge(code: string, label: string) {
  const cls =
    code === "0" ? "warning" : code === "1" ? "info" : code === "2" ? "success" : code === "3" ? "danger" : "muted";
  const icon =
    code === "0" ? "bi-hourglass-split" : code === "3" ? "bi-x-circle" : "bi-check-circle";
  return (
    <span className={`pp-badge ${cls}`}>
      <i className={`bi ${icon}`} /> {label}
    </span>
  );
}

export default function PortailDashboard() {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [tab, setTab] = useState<Tab>("accueil");
  const [booted, setBooted] = useState(false);

  const [dossier, setDossier] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [examens, setExamens] = useState<any[]>([]);
  const [rdvs, setRdvs] = useState<any[]>([]);
  const [medecins, setMedecins] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [expandedExamen, setExpandedExamen] = useState<string | null>(null);

  const [rdvMedecin, setRdvMedecin] = useState("");
  const [rdvDate, setRdvDate] = useState("");
  const [creneaux, setCreneaux] = useState<{ _id: string; date: string }[]>([]);
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);

  useEffect(() => {
    let active = true;
    setRdvDate("");
    setCreneaux([]);
    if (!rdvMedecin) { setLoadingCreneaux(false); return; }
    setLoadingCreneaux(true);
    axios.get(`/api/portail/rendez-vous?medecinId=${encodeURIComponent(rdvMedecin)}`)
      .then((res) => { if (active) setCreneaux(res.data.creneaux || []); })
      .catch(() => { if (active) setRdvFeedback({ type: "danger", text: "Impossible de charger le planning du médecin." }); })
      .finally(() => { if (active) setLoadingCreneaux(false); });
    return () => { active = false; };
  }, [rdvMedecin]);
  const [rdvMotif, setRdvMotif] = useState("");
  const [rdvSending, setRdvSending] = useState(false);
  const [rdvFeedback, setRdvFeedback] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    axios
      .get("/api/portail/me", { withCredentials: true })
      .then((res) => {
        setPatient(res.data.patient);
        setBooted(true);
      })
      .catch(() => router.push("/portail"));
  }, [router]);

  useEffect(() => {
    if (!patient) return;
    setLoadingTab(true);
    setLoadError("");
    const onLoadError = () => setLoadError("Impossible de charger certaines données. Réessayez en rouvrant cet onglet.");
    const cfg = { withCredentials: true as const };

    if (tab === "dossier" && !dossier) {
      axios.get("/api/portail/dossier", cfg).then((res) => {
        setDossier(res.data.dossier);
        setConsultations(res.data.consultations || []);
      }).catch(onLoadError).finally(() => setLoadingTab(false));
    } else if (tab === "resultats" && examens.length === 0) {
      axios.get("/api/portail/resultats", cfg).then((res) => {
        setExamens(res.data.examens || []);
      }).catch(onLoadError).finally(() => setLoadingTab(false));
    } else if (tab === "rdv") {
      Promise.all([
        axios.get("/api/portail/rendez-vous", cfg),
        axios.get("/api/portail/medecins", cfg),
      ]).then(([r, m]) => {
        setRdvs(r.data.rendezVous || []);
        setMedecins(m.data.medecins || []);
      }).catch(onLoadError).finally(() => setLoadingTab(false));
    } else {
      setLoadingTab(false);
      // Précharge les RDV pour les stats d'accueil
      if (rdvs.length === 0) {
        axios.get("/api/portail/rendez-vous", cfg).then((r) => setRdvs(r.data.rendezVous || [])).catch(onLoadError);
      }
      if (examens.length === 0) {
        axios.get("/api/portail/resultats", cfg).then((r) => setExamens(r.data.examens || [])).catch(onLoadError);
      }
    }
  }, [tab, patient, dossier, examens.length, rdvs.length]);

  useEffect(() => {
    if (!patient || tab !== "resultats") return;
    let active = true;
    const refresh = () => {
      if (document.hidden) return;
      axios.get("/api/portail/resultats", { withCredentials: true })
        .then((res) => { if (active) setExamens(res.data.examens || []); })
        .catch(() => {});
    };
    refresh();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [patient, tab]);

  const handleLogout = async () => {
    try {
      await axios.post("/api/portail/logout", {}, { withCredentials: true });
    } finally {
      router.push("/portail");
    }
  };

  const submitRdv = async (e: React.FormEvent) => {
    e.preventDefault();
    setRdvFeedback(null);
    setRdvSending(true);
    try {
      const res = await axios.post(
        "/api/portail/rendez-vous",
        { medecinId: rdvMedecin, creneauId: rdvDate, motif: rdvMotif },
        { withCredentials: true }
      );
      setRdvFeedback({ type: "success", text: res.data.message });
      setRdvDate("");
      setRdvMotif("");
      setRdvMedecin("");
      const r = await axios.get("/api/portail/rendez-vous", { withCredentials: true });
      setRdvs(r.data.rendezVous || []);
    } catch (err: any) {
      setRdvFeedback({
        type: "danger",
        text: err?.response?.data?.message || "Envoi impossible",
      });
    } finally {
      setRdvSending(false);
    }
  };

  if (!booted || !patient) {
    return (
      <div className="pp-dash">
        <div className="pp-loading">
          <div className="text-center">
            <div className="spinner-border mb-3" />
            <div>Chargement de votre espace…</div>
          </div>
        </div>
      </div>
    );
  }

  const initials = `${(patient.nom || " ")[0] || ""}${(patient.prenoms || " ")[0] || ""}`.toUpperCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rdvAVenir = rdvs.filter((r) => r.date && new Date(r.date) >= today && r.statutCode !== "3");
  const rdvEnAttente = rdvs.filter((r) => r.statutCode === "0");

  return (
    <div className="pp-dash">
      <header className="pp-topbar">
        <div className="pp-brand">
          <i className="bi bi-heart-pulse-fill" />
          <span>Mon Espace Santé</span>
        </div>
        <div className="pp-user">
          <div className="pp-avatar">{initials}</div>
          <div className="pp-user-name">
            {patient.prenoms} {patient.nom}
            <small>Dossier n° {patient.codeDossier}</small>
          </div>
          <button className="pp-logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1" />
            <span className="d-none d-sm-inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <nav className="pp-nav" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`pp-nav-item ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
            role="tab"
            aria-selected={tab === t.key}
          >
            <i className={`bi ${t.icon}`} /> {t.label}
          </button>
        ))}
      </nav>

      <main className="pp-content">
        {loadError && <div className="alert alert-danger" role="alert">{loadError}</div>}
        {loadingTab && tab !== "accueil" ? (
          <div className="pp-loading">
            <div className="spinner-border" />
          </div>
        ) : (
          <>
            {tab === "accueil" && (
              <>
                <div className="pp-card-box">
                  <h5>
                    <i className="bi bi-hand-wave" /> Bonjour, {patient.prenoms}
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
                    Bienvenue sur votre espace patient. Consultez vos résultats,
                    votre dossier médical et gérez vos rendez-vous en toute simplicité.
                  </p>
                </div>

                <div className="pp-stat-grid">
                  <div className="pp-stat teal">
                    <i className="bi bi-calendar2-week" />
                    <div>
                      <div className="pp-stat-value">{rdvAVenir.length}</div>
                      <div className="pp-stat-label">Rendez-vous à venir</div>
                    </div>
                  </div>
                  <div className="pp-stat amber">
                    <i className="bi bi-hourglass-split" />
                    <div>
                      <div className="pp-stat-value">{rdvEnAttente.length}</div>
                      <div className="pp-stat-label">Demandes en attente</div>
                    </div>
                  </div>
                  <div className="pp-stat blue">
                    <i className="bi bi-clipboard2-pulse" />
                    <div>
                      <div className="pp-stat-value">{examens.filter((ex) => ex.valide).length}</div>
                      <div className="pp-stat-label">Résultats disponibles</div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <div className="pp-card-box mb-0 h-100">
                      <h5>
                        <i className="bi bi-calendar2-check" /> Prochains rendez-vous
                      </h5>
                      {rdvAVenir.length === 0 ? (
                        <div className="pp-empty">
                          <i className="bi bi-calendar-x" />
                          Aucun rendez-vous à venir
                        </div>
                      ) : (
                        rdvAVenir.slice(0, 3).map((r) => (
                          <div key={r._id} className={`pp-rdv-card ${r.statutCode === "0" ? "attente" : ""}`}>
                            <div className="pp-rdv-top">
                              <div className="pp-rdv-date">
                                <i className="bi bi-calendar-event" />
                                {formatDate(r.date)} {r.date && new Date(r.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                              {statutBadge(r.statutCode, r.statut)}
                            </div>
                            <div className="pp-rdv-meta">
                              <span>
                                <i className="bi bi-person-badge me-1" />
                                {r.medecin}
                              </span>
                              <span>
                                <i className="bi bi-journal-text me-1" />
                                {r.libelle}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                      <button className="pp-btn-primary mt-3" onClick={() => setTab("rdv")}>
                        <i className="bi bi-plus-circle me-2" />
                        Demander un rendez-vous
                      </button>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="pp-card-box mb-0 h-100">
                      <h5>
                        <i className="bi bi-lightning-charge" /> Accès rapide
                      </h5>
                      <div className="d-grid gap-2">
                        <button className="btn btn-outline-secondary text-start" onClick={() => setTab("dossier")}>
                          <i className="bi bi-file-earmark-medical me-2 text-success" />
                          Consulter mon dossier médical
                        </button>
                        <button className="btn btn-outline-secondary text-start" onClick={() => setTab("resultats")}>
                          <i className="bi bi-clipboard2-pulse me-2 text-primary" />
                          Voir mes résultats d'examens
                        </button>
                        <button className="btn btn-outline-secondary text-start" onClick={() => setTab("rdv")}>
                          <i className="bi bi-calendar2-plus me-2 text-warning" />
                          Demander un rendez-vous
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === "dossier" && dossier && (
              <>
                <div className="pp-card-box">
                  <h5>
                    <i className="bi bi-person-vcard" /> Informations personnelles
                  </h5>
                  <div className="pp-info-grid">
                    <div className="pp-info-item">
                      <div className="lbl">Nom complet</div>
                      <div className="val">{dossier.prenoms} {dossier.nom}</div>
                    </div>
                    <div className="pp-info-item">
                      <div className="lbl">N° de dossier</div>
                      <div className="val">{dossier.codeDossier}</div>
                    </div>
                    <div className="pp-info-item">
                      <div className="lbl">Date de naissance</div>
                      <div className="val">{formatDate(dossier.dateNaissance)}</div>
                    </div>
                    <div className="pp-info-item">
                      <div className="lbl">Sexe</div>
                      <div className="val">{dossier.sexe || "—"}</div>
                    </div>
                    <div className="pp-info-item">
                      <div className="lbl">Contact</div>
                      <div className="val">{dossier.contact || "—"}</div>
                    </div>
                    <div className="pp-info-item">
                      <div className="lbl">Situation géographique</div>
                      <div className="val">{dossier.situationgeo || "—"}</div>
                    </div>
                    <div className="pp-info-item">
                      <div className="lbl">Assurance</div>
                      <div className="val">{dossier.assurance || "—"}</div>
                    </div>
                  </div>
                </div>

                <div className="pp-card-box">
                  <h5>
                    <i className="bi bi-journal-medical" /> Antécédents &amp; allergies
                  </h5>
                  <div className="pp-info-grid">
                    <div className="pp-info-item">
                      <div className="lbl">Antécédents médicaux</div>
                      <div className="val">{dossier.antecedentMedico || "Aucun renseigné"}</div>
                    </div>
                    <div className="pp-info-item">
                      <div className="lbl">Antécédents chirurgicaux</div>
                      <div className="val">{dossier.anteChirurgico || "Aucun renseigné"}</div>
                    </div>
                    <div className="pp-info-item">
                      <div className="lbl">Antécédents familiaux</div>
                      <div className="val">{dossier.anteFamille || "Aucun renseigné"}</div>
                    </div>
                    <div className="pp-info-item">
                      <div className="lbl">Allergies</div>
                      <div className="val">
                        {dossier.allergies ? (
                          <span className="pp-badge danger">
                            <i className="bi bi-exclamation-triangle" /> {dossier.allergies}
                          </span>
                        ) : (
                          "Aucune connue"
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pp-card-box">
                  <h5>
                    <i className="bi bi-clock-history" /> Historique des consultations
                  </h5>
                  {consultations.length === 0 ? (
                    <div className="pp-empty">
                      <i className="bi bi-clipboard-x" />
                      Aucune consultation enregistrée
                    </div>
                  ) : (
                    <div className="pp-timeline">
                      {consultations.map((c: any) => (
                        <div key={c._id} className="pp-timeline-item">
                          <div className="pp-tl-date">
                            {formatDate(c.Date_consulation)}
                            {c.Heure_Consultation ? ` — ${c.Heure_Consultation}` : ""}
                          </div>
                          <div className="pp-tl-title">
                            {c.designationC || "Consultation"}
                            {c.Medecin ? ` · Dr ${c.Medecin}` : ""}
                          </div>
                          <div className="pp-tl-body">
                            {c.MotifConsultation && (
                              <div className="pp-tl-field"><strong>Motif :</strong> {c.MotifConsultation}</div>
                            )}
                            {c.Diagnostic && (
                              <div className="pp-tl-field"><strong>Diagnostic :</strong> {c.Diagnostic}</div>
                            )}
                            {c.ConclusionClinique && (
                              <div className="pp-tl-field"><strong>Conclusion :</strong> {c.ConclusionClinique}</div>
                            )}
                            {(c.Temperature || c.Tension || c.Poids) && (
                              <div className="pp-tl-field">
                                <strong>Constantes :</strong>{" "}
                                {[
                                  c.Temperature && `T° ${c.Temperature}`,
                                  c.Tension && `TA ${c.Tension}`,
                                  c.Poids && `${c.Poids}`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === "resultats" && (
              <div className="pp-card-box">
                <h5>
                  <i className="bi bi-clipboard2-pulse" /> Suivi des résultats — Biologie et radiologie
                </h5>
                <p className="text-muted">Consultez la disponibilité de vos résultats et la liste des examens prescrits. La clinique vous fournira les résultats et les comptes rendus.</p>
                {examens.length === 0 ? (
                  <div className="pp-empty">
                    <i className="bi bi-clipboard2-x" />
                    Aucun résultat disponible pour le moment
                  </div>
                ) : (
                  examens.map((ex) => (
                    <div key={ex._id} className="pp-examen-card">
                      <div
                        className="pp-examen-head"

                      >
                        <div>
                          <div className="t">{ex.prestation} {ex.code && `· N° ${ex.code}`}</div>
                          <div className="d">
                            {formatDate(ex.date)}
                            {` · Prescrit par : ${ex.medecinPrescripteur || "Non renseigné"}`}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {ex.remis ? (
                            <span className="pp-badge info"><i className="bi bi-check2-all" /> Résultat reçu / remis</span>
                          ) : ex.valide ? (
                            <span className="pp-badge success"><i className="bi bi-patch-check" /> Validé — Résultat disponible</span>
                          ) : (
                            <span className="pp-badge warning"><i className="bi bi-hourglass-split" /> {ex.statut} — Résultat non disponible</span>
                          )}
                          <button type="button" className="btn btn-outline-primary btn-sm" aria-expanded={expandedExamen === ex._id}
                            onClick={() => setExpandedExamen(expandedExamen === ex._id ? null : ex._id)}>
                            {expandedExamen === ex._id ? "Masquer" : "Détail"}
                          </button>
                        </div>
                      </div>
                      {expandedExamen === ex._id && (
                        <div className="pp-examen-body">
                          <h6>{ex.type === "biologie" ? "Liste des examens biologiques" : "Liste des examens radiologiques"}</h6>
                          {ex.examens?.length ? (
                            <ul className="list-group list-group-flush">
                              {ex.examens.map((item: { _id: string; libelle: string }) => (
                                <li key={item._id} className="list-group-item px-0">{item.libelle || "Examen"}</li>
                              ))}
                            </ul>
                          ) : <p className="text-muted">Liste des examens non renseignée.</p>}
                          {ex.valide && ex.dateValidation && <p className="mt-2 mb-0">Validé le {formatDate(ex.dateValidation)}</p>}
                          {ex.remis && ex.dateRemise && <p className="mt-2 mb-0">Remise enregistrée par la clinique le {new Date(ex.dateRemise).toLocaleString("fr-FR")}.</p>}
                          <p className="text-muted mt-2 mb-0">Les résultats et comptes rendus vous sont remis par la clinique.</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "rdv" && (
              <div className="row g-3">
                <div className="col-lg-5">
                  <div className="pp-card-box">
                    <h5>
                      <i className="bi bi-calendar2-plus" /> Demander un rendez-vous
                    </h5>
                    {rdvFeedback && (
                      <div className={`alert alert-${rdvFeedback.type} py-2`} style={{ fontSize: "0.88rem" }}>
                        {rdvFeedback.text}
                      </div>
                    )}
                    <form onSubmit={submitRdv}>
                      <div className="mb-3">
                        <label className="form-label">Médecin *</label>
                        <select
                          className="form-select"
                          value={rdvMedecin}
                          onChange={(e) => setRdvMedecin(e.target.value)}
                        >
                          <option value="">Sélectionnez un médecin</option>
                          {medecins.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.nom}
                              {m.specialite ? ` — ${m.specialite}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Créneau du planning *</label>
                        <select className="form-select" value={rdvDate} onChange={(e) => setRdvDate(e.target.value)}
                          required disabled={!rdvMedecin || loadingCreneaux || rdvSending}>
                          <option value="">{loadingCreneaux ? "Chargement du planning…" : "Choisissez une date et une heure"}</option>
                          {creneaux.map((slot) => <option key={slot._id} value={slot._id}>
                            {new Date(slot.date).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
                          </option>)}
                        </select>
                        {rdvMedecin && !loadingCreneaux && !creneaux.length && <p className="small text-muted mt-2">Aucun créneau disponible pour ce médecin. Contactez l’accueil.</p>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Motif de la consultation *</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Décrivez brièvement le motif…"
                          value={rdvMotif}
                          onChange={(e) => setRdvMotif(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" className="pp-btn-primary" disabled={rdvSending || loadingCreneaux || !rdvDate || !rdvMedecin}>
                        {rdvSending ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Envoi…
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send me-2" />
                            Envoyer la demande
                          </>
                        )}
                      </button>
                      <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.8rem" }}>
                        Votre demande sera confirmée par l'accueil de l'établissement.
                      </p>
                    </form>
                  </div>
                </div>
                <div className="col-lg-7">
                  <div className="pp-card-box">
                    <h5>
                      <i className="bi bi-calendar2-week" /> Mes rendez-vous
                    </h5>
                    {rdvs.length === 0 ? (
                      <div className="pp-empty">
                        <i className="bi bi-calendar-x" />
                        Aucun rendez-vous pour le moment
                      </div>
                    ) : (
                      rdvs.map((r) => (
                        <div
                          key={r._id}
                          className={`pp-rdv-card ${r.statutCode === "0" ? "attente" : ""} ${
                            r.statutCode === "3" ? "annule" : ""
                          }`}
                        >
                          <div className="pp-rdv-top">
                            <div className="pp-rdv-date">
                              <i className="bi bi-calendar-event" />
                              {formatDate(r.date)} {r.date && new Date(r.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            {statutBadge(r.statutCode, r.statut)}
                          </div>
                          <div className="pp-rdv-meta">
                            <span>
                              <i className="bi bi-person-badge me-1" />
                              {r.medecin}
                            </span>
                            {r.specialite && (
                              <span>
                                <i className="bi bi-stethoscope me-1" />
                                {r.specialite}
                              </span>
                            )}
                            <span>
                              <i className="bi bi-journal-text me-1" />
                              {r.libelle}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
