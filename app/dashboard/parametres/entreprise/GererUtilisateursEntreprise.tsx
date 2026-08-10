'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Table, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaTrash, FaPlus, FaLock, FaLockOpen } from 'react-icons/fa';
import { Entreprise } from '@/types/entreprise';

interface EntrepriseUser {
  _id: string;
  nom?: string;
  prenom?: string;
  name?: string;
  email: string;
  type: string;
  uid?: string;
  isLocked?: boolean;
  createdAt?: string;
}

interface GererUtilisateursEntrepriseProps {
  show: boolean;
  onHide: () => void;
  entreprise: Entreprise | null;
}

const ROLES = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'accueil', label: 'Service Accueil' },
  { value: 'biologiste', label: 'Biologiste' },
  { value: 'caisse', label: 'Caisse' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'infirmier', label: 'Infirmier' },
  { value: 'medecin', label: 'Médecin' },
  { value: 'pharmacien', label: 'Pharmacie' },
  { value: 'radiologue', label: 'Radiologue' },
  { value: 'technicienlabo', label: 'Technicien laboratoire' },
];


export default function GererUtilisateursEntreprise({
  show,
  onHide,
  entreprise,
}: GererUtilisateursEntrepriseProps) {
  const [users, setUsers] = useState<EntrepriseUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('medecin');
  const [password, setPassword] = useState('');

  const entrepriseId = entreprise?._id;

  const fetchUsers = async () => {
    if (!entrepriseId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/users?entrepriseId=${entrepriseId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur de chargement');
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && entrepriseId) {
      fetchUsers();
      setShowAddForm(false);
      resetForm();
    }
  }, [show, entrepriseId]);

  const resetForm = () => {
    setNom('');
    setPrenom('');
    setEmail('');
    setType('medecin');
    setPassword('');
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entrepriseId) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/new-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nom,
          prenom,
          email,
          type,
          password: password || undefined,
          entrepriseId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Erreur lors de la création');

      resetForm();
      setShowAddForm(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = async (u: EntrepriseUser) => {
    const nextLocked = !u.isLocked;
    if (!confirm(nextLocked ? 'Bloquer cet utilisateur ?' : 'Débloquer cet utilisateur ?')) return;
    setTogglingId(u._id);
    setError('');
    try {
      const res = await fetch(`/api/new-users/${u._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nom: u.nom,
          prenom: u.prenom,
          email: u.email,
          type: u.type,
          isLocked: nextLocked,
          ...(nextLocked
            ? {}
            : { failedAttempts: 0, remainingAttempts: 4, lockedUntil: null }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Erreur lors de la mise à jour');
      setUsers((prev) =>
        prev.map((usr) => (usr._id === u._id ? { ...usr, isLocked: nextLocked } : usr))
      );
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du statut');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    setError('');
    try {
      const res = await fetch(`/api/new-users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Erreur lors de la suppression');
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Utilisateurs de {entreprise?.NomSociete || 'l\'entreprise'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="text-muted">
            {users.length} utilisateur{users.length > 1 ? 's' : ''}
          </span>
          <Button
            variant="success"
            size="sm"
            onClick={() => setShowAddForm((v) => !v)}
          >
            <FaPlus className="me-2" />
            {showAddForm ? 'Annuler' : 'Ajouter un utilisateur'}
          </Button>
        </div>

        {showAddForm && (
          <Form onSubmit={handleAddUser} className="border rounded p-3 mb-3 bg-light">
            <Row className="g-2">
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Nom *</Form.Label>
                  <Form.Control
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Prénom *</Form.Label>
                  <Form.Control
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Rôle *</Form.Label>
                  <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">
                    Mot de passe (optionnel)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Par défaut : l'email sera utilisé comme mot de passe"
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="text-end">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? <Spinner size="sm" animation="border" /> : 'Créer l\'utilisateur'}
              </Button>
            </div>
          </Form>
        )}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table bordered hover size="sm" responsive>
            <thead className="table-light">
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-3">
                    Aucun utilisateur pour cette entreprise.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id}>
                    <td>{[u.nom, u.prenom].filter(Boolean).join(' ') || u.name || '—'}</td>
                    <td>{u.email}</td>
                    <td>
                      {ROLES.find((r) => r.value === u.type)?.label || u.type}
                    </td>
                    <td>
                      {u.isLocked ? (
                        <Badge bg="danger">Bloqué</Badge>
                      ) : (
                        <Badge bg="success">Actif</Badge>
                      )}
                    </td>
                    <td>
                      <Button
                        variant={u.isLocked ? 'outline-success' : 'outline-warning'}
                        size="sm"
                        className="me-2"
                        title={u.isLocked ? "Débloquer l'utilisateur" : "Bloquer l'utilisateur"}
                        disabled={togglingId === u._id}
                        onClick={() => handleToggleLock(u)}
                      >
                        {togglingId === u._id ? (
                          <Spinner size="sm" animation="border" />
                        ) : u.isLocked ? (
                          <FaLockOpen />
                        ) : (
                          <FaLock />
                        )}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        title="Supprimer l'utilisateur"
                        onClick={() => handleDeleteUser(u._id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
