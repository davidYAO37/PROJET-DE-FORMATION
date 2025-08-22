"use client";
import { auth } from "@/firebase/configConnect";
import axios from "axios";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import React, { useState } from "react";

const SignupForm = () => {
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", type: "" });
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("Création du compte en cours...");

    try {
      // Création Firebase Auth
      const data = await createUserWithEmailAndPassword(auth, form.email, password);
      await sendEmailVerification(data.user);

      // Sauvegarde MongoDB
      await axios.post("/api/new-users", { ...form, uid: data.user.uid });

      setMessage("✅ Compte créé avec succès. Vérifiez votre email !");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setMessage("❌ Cet email est déjà utilisé.");
      } else if (error.code === "auth/weak-password") {
        setMessage("❌ Le mot de passe doit contenir au moins 6 caractères.");
      } else {
        setMessage("❌ Une erreur s'est produite.");
      }
    }
  };

  return (
    <div className="container mt-4">
      <form onSubmit={handleSubmit} className="  rounded bg-light">
        <h3 className="text-center mb-3">Nouveau compte</h3>
        {message && <div className="alert alert-info">{message}</div>}

        <input type="text" className="form-control mb-3" name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} required />
        <input type="text" className="form-control mb-3" name="prenom" placeholder="Prénom" value={form.prenom} onChange={handleChange} required />
        <input type="email" className="form-control mb-3" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input type="password" className="form-control mb-3" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <select className="form-select mb-3" name="type" value={form.type} onChange={handleChange} required>
          <option value="">Sélectionnez un rôle</option>
          <option value="patient">Service Accueil</option>
          <option value="medecin">Médecin</option>
          <option value="admin">Administrateur</option>
        </select>

        <button type="submit" className="btn btn-primary w-100">Ajouter l'utlisateur</button>
      </form>
    </div>
  );
};

export default SignupForm;
