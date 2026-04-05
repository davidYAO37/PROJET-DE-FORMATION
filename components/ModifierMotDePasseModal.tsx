'use client';
import { useState } from 'react';
import { Modal, Button, Form, Alert, InputGroup } from 'react-bootstrap';
import { auth } from '@/firebase/configConnect';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

interface ModifierMotDePasseModalProps {
    show: boolean;
    onHide: () => void;
}

export default function ModifierMotDePasseModal({ show, onHide }: ModifierMotDePasseModalProps) {
    const [ancienMotDePasse, setAncienMotDePasse] = useState('');
    const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
    const [confirmerMotDePasse, setConfirmerMotDePasse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const [showAncienMotDePasse, setShowAncienMotDePasse] = useState(false);
    const [showNouveauMotDePasse, setShowNouveauMotDePasse] = useState(false);
    const [showConfirmerMotDePasse, setShowConfirmerMotDePasse] = useState(false);

    const calculatePasswordStrength = (password: string) => {
        let strength = 0;
        let feedback = [];

        if (password.length >= 6) strength++;
        else feedback.push('Au moins 6 caractères');

        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('Une majuscule');

        if (/[a-z]/.test(password)) strength++;
        else feedback.push('Une minuscule');

        if (/\d/.test(password)) strength++;
        else feedback.push('Un chiffre');

        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
        else feedback.push('Un caractère spécial');

        if (strength <= 2) return { level: 'Faible', color: 'danger', feedback };
        if (strength <= 3) return { level: 'Moyen', color: 'warning', feedback };
        if (strength <= 4) return { level: 'Bon', color: 'info', feedback };
        return { level: 'Fort', color: 'success', feedback: [] };
    };

    const handlePasswordChange = (value: string) => {
        setNouveauMotDePasse(value);
        if (value) {
            const strength = calculatePasswordStrength(value);
            setPasswordStrength(strength.level);
        } else {
            setPasswordStrength('');
        }
        // Re-check password match
        setPasswordsMatch(confirmerMotDePasse === value);
    };

    const handleConfirmPasswordChange = (value: string) => {
        setConfirmerMotDePasse(value);
        setPasswordsMatch(value === nouveauMotDePasse);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validation des champs obligatoires
        if (!ancienMotDePasse.trim()) {
            setError('Le champ "Ancien mot de passe" est obligatoire.');
            setLoading(false);
            return;
        }

        if (!nouveauMotDePasse.trim()) {
            setError('Le champ "Nouveau mot de passe" est obligatoire.');
            setLoading(false);
            return;
        }

        if (!confirmerMotDePasse.trim()) {
            setError('Le champ "Confirmer mot de passe" est obligatoire.');
            setLoading(false);
            return;
        }

        if (nouveauMotDePasse !== confirmerMotDePasse) {
            setError('Les mots de passe ne correspondent pas.');
            setLoading(false);
            return;
        }

        if (nouveauMotDePasse.length < 6) {
            setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
            setLoading(false);
            return;
        }

        // Vérification de la force du mot de passe
        const hasUpperCase = /[A-Z]/.test(nouveauMotDePasse);
        const hasLowerCase = /[a-z]/.test(nouveauMotDePasse);
        const hasNumbers = /\d/.test(nouveauMotDePasse);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(nouveauMotDePasse);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            setError('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.');
            setLoading(false);
            return;
        }

        // Demande de confirmation
        const confirmChange = window.confirm(
            'Êtes-vous sûr de vouloir modifier votre mot de passe ? Cette action est irréversible.'
        );

        if (!confirmChange) {
            setLoading(false);
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user || !user.email) {
                setError('Vous n\'êtes pas connecté. Veuillez vous reconnecter.');
                setLoading(false);
                return;
            }

            // Réauthentifier l'utilisateur avec l'ancien mot de passe
            try {
                const credential = EmailAuthProvider.credential(user.email, ancienMotDePasse);
                await reauthenticateWithCredential(user, credential);
            } catch (authError: any) {
                // L'ancien mot de passe est incorrect
                setError('L\'ancien mot de passe saisi est incorrect. Veuillez vérifier et réessayer.');
                setLoading(false);
                return;
            }

            // Mettre à jour le mot de passe
            try {
                await updatePassword(user, nouveauMotDePasse);
            } catch (updateError: any) {
                if (updateError.code === 'auth/weak-password') {
                    setError('Le nouveau mot de passe ne respecte pas les critères de sécurité requis.');
                } else if (updateError.code === 'auth/requires-recent-login') {
                    setError('Votre session a expiré. Veuillez vous reconnecter et réessayer.');
                } else {
                    setError('Impossible de mettre à jour le mot de passe. Veuillez réessayer.');
                }
                setLoading(false);
                return;
            }

            setSuccess('Mot de passe modifié avec succès.');
            // Réinitialiser les champs
            setAncienMotDePasse('');
            setNouveauMotDePasse('');
            setConfirmerMotDePasse('');
            // Fermer le modal après un délai
            setTimeout(() => {
                onHide();
                setSuccess('');
            }, 2000);
        } catch (error: any) {
            console.error('Erreur lors de la modification du mot de passe:', error);
            setError('Une erreur inattendue s\'est produite. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const handleHide = () => {
        setAncienMotDePasse('');
        setNouveauMotDePasse('');
        setConfirmerMotDePasse('');
        setError('');
        setSuccess('');
        setPasswordStrength('');
        setPasswordsMatch(true);
        setShowAncienMotDePasse(false);
        setShowNouveauMotDePasse(false);
        setShowConfirmerMotDePasse(false);
        onHide();
    };

    return (
        <Modal show={show} onHide={handleHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Modifier le mot de passe</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Ancien mot de passe <span className="text-danger">*</span></Form.Label>
                        <InputGroup>
                            <Form.Control
                                type={showAncienMotDePasse ? 'text' : 'password'}
                                value={ancienMotDePasse}
                                onChange={(e) => setAncienMotDePasse(e.target.value)}
                                required
                                placeholder="Entrez votre ancien mot de passe"
                            />
                            <Button
                                variant="outline-secondary"
                                onClick={() => setShowAncienMotDePasse(!showAncienMotDePasse)}
                                style={{ border: '1px solid #ced4da' }}
                            >
                                <i className={`bi ${showAncienMotDePasse ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </Button>
                        </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Nouveau mot de passe <span className="text-danger">*</span></Form.Label>
                        <InputGroup>
                            <Form.Control
                                type={showNouveauMotDePasse ? 'text' : 'password'}
                                value={nouveauMotDePasse}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                                required
                                placeholder="Au moins 6 caractères avec majuscule, minuscule et chiffre"
                            />
                            <Button
                                variant="outline-secondary"
                                onClick={() => setShowNouveauMotDePasse(!showNouveauMotDePasse)}
                                style={{ border: '1px solid #ced4da' }}
                            >
                                <i className={`bi ${showNouveauMotDePasse ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </Button>
                        </InputGroup>
                        {passwordStrength && (
                            <div className="mt-2">
                                <small className={`text-${calculatePasswordStrength(nouveauMotDePasse).color}`}>
                                    Force du mot de passe: <strong>{calculatePasswordStrength(nouveauMotDePasse).level}</strong>
                                </small>
                                {calculatePasswordStrength(nouveauMotDePasse).feedback.length > 0 && (
                                    <div className="mt-1">
                                        <small className="text-muted">
                                            Manque: {calculatePasswordStrength(nouveauMotDePasse).feedback.join(', ')}
                                        </small>
                                    </div>
                                )}
                            </div>
                        )}
                        <Form.Text className="text-muted">
                            Le mot de passe doit contenir au moins 6 caractères avec une majuscule, une minuscule et un chiffre.
                        </Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Confirmer mot de passe <span className="text-danger">*</span></Form.Label>
                        <InputGroup>
                            <Form.Control
                                type={showConfirmerMotDePasse ? 'text' : 'password'}
                                value={confirmerMotDePasse}
                                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                required
                                placeholder="Répétez le nouveau mot de passe"
                                isInvalid={!passwordsMatch && confirmerMotDePasse.length > 0}
                                isValid={passwordsMatch && confirmerMotDePasse.length > 0}
                            />
                            <Button
                                variant="outline-secondary"
                                onClick={() => setShowConfirmerMotDePasse(!showConfirmerMotDePasse)}
                                style={{ border: '1px solid #ced4da' }}
                            >
                                <i className={`bi ${showConfirmerMotDePasse ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </Button>
                        </InputGroup>
                        {!passwordsMatch && confirmerMotDePasse.length > 0 && (
                            <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                                Les mots de passe ne correspondent pas.
                            </Form.Control.Feedback>
                        )}
                        {passwordsMatch && confirmerMotDePasse.length > 0 && (
                            <Form.Control.Feedback type="valid" style={{ display: 'block' }}>
                                Les mots de passe correspondent.
                            </Form.Control.Feedback>
                        )}
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                        <Button variant="secondary" onClick={handleHide} className="me-2">
                            Annuler
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Modification...' : 'Valider'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}