"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface EntrepriseItem {
  _id: string;
  nom: string;
  logo?: string;
}

export default function PortailLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [entreprises, setEntreprises] = useState<EntrepriseItem[]>([]);
  const [entrepriseId, setEntrepriseId] = useState("");
  const [codeDossier, setCodeDossier] = useState("");
  const [password, setPassword] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [contact, setContact] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"danger" | "success" | "info" | "warning">("info");

  useEffect(() => {
    axios
      .get("/api/portail/entreprises")
      .then((res) => {
        const list = res.data?.entreprises || [];
        setEntreprises(list);
        if (list.length === 1) setEntrepriseId(list[0]._id);
      })
      .catch(() => setEntreprises([]));
  }, []);

  const resetMessages = () => {
    setMessage("");
    setMessageType("info");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/portail/login",
        { entrepriseId, codeDossier, password },
        { withCredentials: true }
      );
      if (res.data?.needsSetup) {
        setMode("setup");
        setMessage("Première connexion : créez votre mot de passe pour sécuriser votre espace.");
        setMessageType("info");
        return;
      }
      router.push("/portail/dashboard");
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Erreur de connexion");
      setMessageType("danger");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (password !== confirmPassword) {
      setMessage("Les deux mots de passe ne correspondent pas");
      setMessageType("danger");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        "/api/portail/setup-password",
        { entrepriseId, codeDossier, dateNaissance, contact, password },
        { withCredentials: true }
      );
      router.push("/portail/dashboard");
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Vérification impossible");
      setMessageType("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pp-login-page">
      <div className="pp-login-inner">
        <div className="pp-hero">
          <div className="pp-hero-badge">
            <i className="bi bi-shield-check" /> Espace sécurisé
          </div>
          <h1>Votre santé,
            <br />
            accessible en ligne
          </h1>
          <p>
            Connectez-vous avec votre numéro de dossier pour consulter vos
            résultats d'examens, votre dossier médical et demander vos
            rendez-vous directement en ligne.
          </p>
          <div className="pp-hero-features">
            <div className="pp-hero-feature">
              <i className="bi bi-file-earmark-medical" />
              <span>Dossier médical et antécédents</span>
            </div>
            <div className="pp-hero-feature">
              <i className="bi bi-clipboard2-pulse" />
              <span>Résultats de laboratoire et d'imagerie</span>
            </div>
            <div className="pp-hero-feature">
              <i className="bi bi-calendar2-check" />
              <span>Demandes de rendez-vous en ligne</span>
            </div>
          </div>
        </div>

        <div className="pp-login-card">
          <div className="pp-card-icon">
            <i className="bi bi-person-heart" />
          </div>
          <h2>{mode === "login" ? "Connexion au portail" : "Créer votre mot de passe"}</h2>
          <p className="pp-subtitle">
            {mode === "login"
              ? "Accédez à votre espace patient sécurisé"
              : "Vérifiez votre identité puis choisissez un mot de passe"}
          </p>

          {message && (
            <div className={`alert alert-${messageType} py-2`} role="alert" style={{ fontSize: "0.88rem" }}>
              {message}
            </div>
          )}

          <form onSubmit={mode === "login" ? handleLogin : handleSetup}>
            <div className="mb-3">
              <label className="form-label">Établissement</label>
              <select
                className="form-select"
                value={entrepriseId}
                onChange={(e) => setEntrepriseId(e.target.value)}
                required
              >
                <option value="">Sélectionnez votre clinique…</option>
                {entreprises.map((en) => (
                  <option key={en._id} value={en._id}>
                    {en.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Numéro de dossier</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex : DOS-000123"
                value={codeDossier}
                onChange={(e) => setCodeDossier(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            {mode === "setup" && (
              <>
                <div className="mb-3">
                  <label className="form-label">Date de naissance</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateNaissance}
                    onChange={(e) => setDateNaissance(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Numéro de téléphone enregistré</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Celui communiqué à l'accueil"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="mb-3">
              <label className="form-label">
                {mode === "setup" ? "Nouveau mot de passe" : "Mot de passe"}
              </label>
              <input
                type="password"
                className="form-control"
                placeholder={mode === "setup" ? "6 caractères minimum" : "Votre mot de passe"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "setup" ? 6 : undefined}
                autoComplete={mode === "setup" ? "new-password" : "current-password"}
              />
            </div>

            {mode === "setup" && (
              <div className="mb-3">
                <label className="form-label">Confirmer le mot de passe</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Retapez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            <button type="submit" className="pp-btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Vérification…
                </>
              ) : mode === "login" ? (
                "Se connecter"
              ) : (
                "Créer mon compte"
              )}
            </button>

            {mode === "setup" && (
              <div className="text-center mt-3">
                <button type="button" className="pp-back-link" onClick={() => { setMode("login"); resetMessages(); }}>
                  <i className="bi bi-arrow-left me-1" /> Retour à la connexion
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
