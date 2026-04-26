"use client";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";

const SignupForm = () => {
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", type: "", entrepriseId: "" });
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [entrepriseInfo, setEntrepriseInfo] = useState<string>("");
  const [entrepriseId, setEntrepriseId] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [unlockingUser, setUnlockingUser] = useState<any | null>(null);
  const [unlockMessage, setUnlockMessage] = useState("");
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  useEffect(() => {
    // Récupérer l'ID entreprise de l'utilisateur connecté
    const idEntreprise = localStorage.getItem('IdEntreprise');
    if (idEntreprise) {
      setForm(prev => ({ ...prev, entrepriseId: idEntreprise }));
      setEntrepriseId(idEntreprise);
      setEntrepriseInfo(`ID: ${idEntreprise}`);
    } else {
      setEntrepriseId("");
      setEntrepriseInfo("Non assignée (utilisateur sans entreprise)");
    }
  }, []); // Configuration initiale

  useEffect(() => {
    // Appeler fetchUsers chaque fois que entrepriseId change
    // Cela garantit le filtrage correct même après actualisation
    fetchUsers();
  }, [entrepriseId]); // Dépend de entrepriseId

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Débogage : Vérifier l'état actuel
      console.log("🔄 fetchUsers appelé");
      console.log("🏢 entrepriseId actuel:", entrepriseId);
      console.log("💾 localStorage IdEntreprise:", localStorage.getItem('IdEntreprise'));
      
      const response = await axios.get("/api/check-users");
      const allUsers = response.data.users || [];
      
      console.log("📥 Utilisateurs reçus de l'API:", allUsers.length);
      
      // SignupForm: Filtrer les utilisateurs par entrepriseId depuis localStorage
      // Seuls les utilisateurs avec le même entrepriseId sont affichés
      const filteredUsers = entrepriseId 
        ? allUsers.filter((user: any) => {
            const match = user.entrepriseId === entrepriseId;
            console.log(`👤 ${user.nom} (${user.entrepriseId}) === ${entrepriseId} ? ${match}`);
            return match;
          })
        : allUsers; // Si pas d'entrepriseId, afficher tous les utilisateurs
      
      console.log("✅ Utilisateurs filtrés:", filteredUsers.length);
      
      setUsers(filteredUsers);
      setCurrentPage(1); // Reset to first page when fetching new data
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filtrer les utilisateurs selon le terme de recherche
  const filteredUsers = users.filter(user => 
    user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculer les utilisateurs pour la page actuelle
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Changer de page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Gérer le changement de recherche
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Gérer la suppression d'utilisateur
  const handleDeleteUser = (user: any) => {
    // Vérifier si l'utilisateur a un ID valide
    if (!user._id || user._id === "undefined") {
      setDeleteMessage("❌ Impossible de supprimer : ID utilisateur invalide");
      return;
    }
    
    setDeletingUser(user);
    setDeleteMessage("");
    setShowDeleteModal(true);
  };

  // Annuler la suppression
  const handleCancelDelete = () => {
    setDeletingUser(null);
    setDeleteMessage("");
    setShowDeleteModal(false);
  };

  // Confirmer la suppression
  const handleConfirmDelete = async () => {
    if (!deletingUser || !deletingUser._id || deletingUser._id === "undefined") {
      setDeleteMessage("❌ ID utilisateur invalide");
      return;
    }

    setDeleteMessage("Suppression en cours...");

    try {
      const response = await axios.delete(`/api/new-users/${deletingUser._id}`);

      if (response.status === 200) {
        setDeleteMessage("✅ Utilisateur supprimé avec succès !");
        // Mettre à jour la liste des utilisateurs
        setUsers(users.filter(user => user._id !== deletingUser._id));
        
        // Fermer la modal après un délai
        setTimeout(() => {
          setShowDeleteModal(false);
          setDeletingUser(null);
          setDeleteMessage("");
        }, 2000);
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        setDeleteMessage("❌ " + error.response.data.message);
      } else {
        setDeleteMessage("❌ Une erreur s'est produite lors de la suppression.");
      }
    }
  };

  // Gérer le déblocage d'utilisateur
  const handleUnlockUser = (user: any) => {
    setUnlockingUser(user);
    setUnlockMessage("");
    setShowUnlockModal(true);
  };

  // Annuler le déblocage
  const handleCancelUnlock = () => {
    setUnlockingUser(null);
    setUnlockMessage("");
    setShowUnlockModal(false);
  };

  // Confirmer le déblocage
  const handleConfirmUnlock = async () => {
    if (!unlockingUser) return;

    setUnlockMessage("Déblocage en cours...");

    try {
      const response = await axios.post("/api/unlock-user", { 
        email: unlockingUser.email 
      });

      if (response.status === 200) {
        setUnlockMessage("✅ Compte débloqué avec succès !");
        // Mettre à jour la liste des utilisateurs
        setUsers(users.map(user => 
          user._id === unlockingUser._id 
            ? { ...user, isLocked: false, failedAttempts: 0, remainingAttempts: 4 }
            : user
        ));
        
        // Fermer la modal après un délai
        setTimeout(() => {
          setShowUnlockModal(false);
          setUnlockingUser(null);
          setUnlockMessage("");
        }, 2000);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setUnlockMessage("❌ " + error.response.data.message);
      } else {
        setUnlockMessage("❌ Une erreur s'est produite lors du déblocage.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("Création du compte en cours...");

    try {
      // Validation du mot de passe
      if (password.length < 6) {
        setMessage("❌ Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }

      // Création utilisateur via API locale
      const response = await axios.post("/api/new-users", { 
        ...form, 
        password: password 
      });

      if (response.status === 201) {
        setMessage("✅ Compte créé avec succès. Vous pouvez maintenant vous connecter !");
        // Réinitialiser le formulaire
        setForm({ nom: "", prenom: "", email: "", type: "", entrepriseId: "" });
        setPassword("");
        // Rafraîchir la liste des utilisateurs
        fetchUsers();
        // Fermer la modal après un délai
        setTimeout(() => {
          setShowNewUserModal(false);
          setMessage("");
        }, 2000);
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        setMessage("❌ " + error.response.data.message);
      } else {
        setMessage("❌ Une erreur s'est produite lors de la création du compte.");
      }
    }
  };

  return (
    <div className="container mt-4">
      {/* Bouton Nouveau utilisateur */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="mb-0 fw-bold">
                <i className="bi bi-people me-2"></i>
                Gestion des utilisateurs
              </h3>{/* 
              {entrepriseId && (
                <small className="text-muted">
                  <i className="bi bi-building me-1"></i>
                  Filtré par entreprise: {entrepriseId}
                  <span className="badge bg-info ms-2" style={{ fontSize: '0.7em' }}>
                    DEBUG: localStorage IdEntreprise
                  </span>
                </small>
              )} */}
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowNewUserModal(true)}
              className="d-flex align-items-center"
            >
              <i className="bi bi-person-plus me-2"></i>
              Nouveau utilisateur
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Nouveau compte */}
      <Modal 
        show={showNewUserModal} 
        onHide={() => setShowNewUserModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-plus me-2"></i>
            Nouveau compte utilisateur
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message && <div className="alert alert-info">{message}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nom</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="nom" 
                  placeholder="Nom" 
                  value={form.nom} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Prénom</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="prenom" 
                  placeholder="Prénom" 
                  value={form.prenom} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  name="email" 
                  placeholder="Email" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Mot de passe</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Mot de passe" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <div className="col-12">
                <label className="form-label">Rôle</label>
                <select 
                  className="form-select" 
                  name="type" 
                  value={form.type} 
                  onChange={handleChange} 
                  required
                >
                  <option value="">Sélectionnez un rôle</option>
                  <option value="admin">Administrateur</option>
                  <option value="accueil">Service Accueil</option>
                  <option value="biologiste">Biologiste</option>
                  <option value="caisse">Caisse</option>
                  <option value="comptable">Comptable</option>
                  <option value="infirmier">Infirmier</option>
                  <option value="medecin">Medecin</option>
                  <option value="pharmacien">Pharmacie</option>
                  <option value="radiologue">Radiologue</option>
                  <option value="technicienlabo">Technicien laboratoire</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="form-label text-muted">
                <small>
                  <i className="bi bi-building me-1"></i>
                  Entreprise assignée automatiquement: {entrepriseInfo}
                </small>
              </label>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowNewUserModal(false)}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary">
                <i className="bi bi-check me-1"></i>
                Créer le compte
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      <div className="row">
        {/* Liste des utilisateurs existants */}
        <div className="col-12">
          <div className="rounded bg-light p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Utilisateurs existants</h5>
              <button 
                className="btn btn-sm btn-outline-primary" 
                onClick={fetchUsers}
                disabled={loadingUsers}
              >
                {loadingUsers ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Chargement...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Rafraîchir
                  </>
                )}
              </button>
            </div>

            {/* Champ de recherche */}
            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher par nom, prénom, email ou rôle..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
              {searchTerm && (
                <small className="text-muted mt-1 d-block">
                  {filteredUsers.length} résultat{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
                </small>
              )}
            </div>

            {loadingUsers ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2 text-muted">Chargement des utilisateurs...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((user, index) => (
                      <tr key={user._id || index}>
                        <td>{user.nom}</td>
                        <td>{user.prenom}</td>
                        <td className="text-truncate" style={{ maxWidth: '150px' }} title={user.email}>
                          {user.email}
                        </td>
                        <td>
                          <span className="badge bg-primary">
                            {user.type}
                          </span>
                        </td>
                        <td>
                          {user.isLocked ? (
                            <span className="badge bg-danger">
                              <i className="bi bi-lock me-1"></i>
                              Bloqué
                            </span>
                          ) : (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1"></i>
                              Actif
                            </span>
                          )}
                          {user.failedAttempts > 0 && !user.isLocked && (
                            <div className="small text-warning mt-1">
                              {user.remainingAttempts}/4 tentatives
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            {user.isLocked && (
                              <button 
                                className="btn btn-sm btn-outline-success me-1"
                                onClick={() => handleUnlockUser(user)}
                                title="Débloquer l'utilisateur"
                                disabled={!user._id || user._id === "undefined"}
                                style={{ 
                                  opacity: (!user._id || user._id === "undefined") ? 0.5 : 1,
                                  cursor: (!user._id || user._id === "undefined") ? 'not-allowed' : 'pointer'
                                }}
                              >
                                <i className="bi bi-unlock"></i>
                              </button>
                            )}
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteUser(user)}
                              title="Supprimer l'utilisateur"
                              disabled={!user._id || user._id === "undefined"}
                              style={{ 
                                opacity: (!user._id || user._id === "undefined") ? 0.5 : 1,
                                cursor: (!user._id || user._id === "undefined") ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="bi bi-people text-muted" style={{ fontSize: '2rem' }}></i>
                <p className="text-muted mt-2">Aucun utilisateur trouvé</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <li 
                          key={pageNumber} 
                          className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
                        >
                          <button 
                            className="page-link" 
                            onClick={() => paginate(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        </li>
                      );
                    })}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}

            <div className="mt-3 text-muted">
              <small>
                <i className="bi bi-info-circle me-1"></i>
                {searchTerm ? (
                  <>
                    {filteredUsers.length} résultat{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
                    {totalPages > 1 && (
                      <> - Page {currentPage} sur {totalPages}</>
                    )}
                  </>
                ) : (
                  <>
                    {entrepriseId ? (
                      <>
                        {users.length} utilisateur{users.length > 1 ? 's' : ''} pour l'entreprise {entrepriseId}
                        {totalPages > 1 && (
                          <> - Page {currentPage} sur {totalPages}</>
                        )}
                      </>
                    ) : (
                      <>
                        Total: {users.length} utilisateur{users.length > 1 ? 's' : ''}
                        {totalPages > 1 && (
                          <> - Page {currentPage} sur {totalPages}</>
                        )}
                      </>
                    )}
                  </>
                )}
              </small>
            </div>
          </div>

            {/* Modal de suppression */}
            <Modal 
              show={showDeleteModal} 
              onHide={handleCancelDelete}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>
                  <i className="bi bi-exclamation-triangle text-danger me-2"></i>
                  Confirmer la suppression
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {deleteMessage && (
                  <div className={`alert ${deleteMessage.includes('✅') ? 'alert-success' : 'alert-info'} mb-3`}>
                    {deleteMessage}
                  </div>
                )}

                {!deleteMessage.includes('✅') && (
                  <>
                    <div className="alert alert-warning d-flex align-items-center">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <div>
                        <strong>Attention!</strong> Cette action est irréversible.
                      </div>
                    </div>

                    <p className="mb-3">
                      Êtes-vous sûr de vouloir supprimer l'utilisateur :
                    </p>

                    <div className="bg-light p-3 rounded mb-3">
                      <strong>{deletingUser?.nom} {deletingUser?.prenom}</strong><br/>
                      <small className="text-muted">{deletingUser?.email}</small><br/>
                      <span className="badge bg-primary">{deletingUser?.type}</span>
                    </div>

                    <p className="text-muted small mb-0">
                      Toutes les données associées à cet utilisateur seront définitivement perdues.
                    </p>
                  </>
                )}
              </Modal.Body>
              <Modal.Footer>
                {!deleteMessage.includes('✅') ? (
                  <>
                    <Button 
                      variant="secondary"
                      onClick={handleCancelDelete}
                    >
                      Annuler
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={handleConfirmDelete}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Supprimer
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="success"
                    onClick={handleCancelDelete}
                  >
                    <i className="bi bi-check me-1"></i>
                    OK
                  </Button>
                )}
              </Modal.Footer>
            </Modal>

            {/* Modal de déblocage */}
            <Modal 
              show={showUnlockModal} 
              onHide={handleCancelUnlock}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>
                  <i className="bi bi-unlock text-success me-2"></i>
                  Débloquer le compte utilisateur
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {unlockMessage && (
                  <div className={`alert ${unlockMessage.includes('✅') ? 'alert-success' : 'alert-info'} mb-3`}>
                    {unlockMessage}
                  </div>
                )}

                {!unlockMessage.includes('✅') && (
                  <>
                    <div className="alert alert-info d-flex align-items-center">
                      <i className="bi bi-info-circle-fill me-2"></i>
                      <div>
                        <strong>Déblocage du compte</strong> : Cette action réinitialisera les tentatives de connexion.
                      </div>
                    </div>

                    <p className="mb-3">
                      Êtes-vous sûr de vouloir débloquer le compte de :
                    </p>

                    <div className="bg-light p-3 rounded mb-3">
                      <strong>{unlockingUser?.nom} {unlockingUser?.prenom}</strong><br/>
                      <small className="text-muted">{unlockingUser?.email}</small><br/>
                      <span className="badge bg-primary">{unlockingUser?.type}</span><br/>
                      {unlockingUser?.entrepriseId && (
                        <small className="text-muted">Entreprise: {unlockingUser.entrepriseId}</small>
                      )}
                    </div>

                    <p className="text-muted small mb-0">
                      L'utilisateur pourra à nouveau se connecter avec 4 tentatives disponibles.
                    </p>
                  </>
                )}
              </Modal.Body>
              <Modal.Footer>
                {!unlockMessage.includes('✅') ? (
                  <>
                    <Button 
                      variant="secondary"
                      onClick={handleCancelUnlock}
                    >
                      Annuler
                    </Button>
                    <Button 
                      variant="success"
                      onClick={handleConfirmUnlock}
                    >
                      <i className="bi bi-unlock me-1"></i>
                      Débloquer
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="success"
                    onClick={handleCancelUnlock}
                  >
                    <i className="bi bi-check me-1"></i>
                    OK
                  </Button>
                )}
              </Modal.Footer>
            </Modal>
          </div>
        </div>
      </div>
  );
};

export default SignupForm;
