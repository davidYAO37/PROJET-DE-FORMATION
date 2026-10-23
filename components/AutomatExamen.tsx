'use client';

import { useState } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    ProgressBar,
    Spinner,
    Modal,
    Table,
    Nav
} from 'react-bootstrap';

import {
    ArrowClockwise,
    ClockHistory,
    Trash,
    Link45deg
} from 'react-bootstrap-icons';

import GestionLienAutomate from './GestionLienAutomate';

type HistoriqueKey = 'nfs' | 'hormones' | 'vs' | 'biochimie';

interface HistoriqueSection {
    total: number;
    limite?: number;
    data: any[];
}

const HISTORIQUE_VIDE: Record<HistoriqueKey, HistoriqueSection> = {
    nfs: { total: 0, data: [] },
    hormones: { total: 0, data: [] },
    vs: { total: 0, data: [] },
    biochimie: { total: 0, data: [] },
};

const dateFr = (v?: string) => (v ? new Date(v).toLocaleString('fr-FR') : '-');

const COLONNES: Record<HistoriqueKey, { label: string; render: (i: any) => React.ReactNode }[]> = {
    nfs: [
        { label: 'N° NFS', render: (i) => i.NumNFs || '-' },
        { label: 'Patient', render: (i) => i.PatientP || '-' },
        { label: 'N° Dossier', render: (i) => i.Patient_numDossier || '-' },
        { label: 'Date analyse', render: (i) => dateFr(i.NFS_dateAnalyse) },
        { label: 'Service', render: (i) => i.NFS_service || '-' },
        { label: 'Paramètre', render: (i) => i.NFS_parametres || '-' },
        { label: 'Résultat', render: (i) => `${i.NFS_resultat ?? '-'} ${i.NFS_unite || ''}` },
        { label: 'Statut', render: (i) => i.NFS_status || '-' },
    ],
    hormones: [
        { label: 'N° Patient', render: (i) => i.numPatient || '-' },
        { label: 'Article', render: (i) => i.article || '-' },
        { label: 'Échantillon', render: (i) => i.echantillon || '-' },
        { label: 'Résultat', render: (i) => `${i.resultathor ?? '-'} ${i.unitehorm || ''}` },
        { label: 'Plage', render: (i) => i.plagehormone || '-' },
        { label: 'Date', render: (i) => dateFr(i.dateHormone) },
        { label: 'Statut', render: (i) => i.status || '-' },
    ],
    vs: [
        { label: 'N° Dossier', render: (i) => i.CodePrestation || '-' },
        { label: 'Paramètre', render: (i) => i.parametres || '-' },
        { label: 'Résultat', render: (i) => `${i.resultat ?? '-'} ${i.unite || ''}` },
        { label: 'Date', render: (i) => dateFr(i.dateVitesse) },
    ],
    biochimie: [
        { label: 'N° Échantillon', render: (i) => i.CodePrestation || '-' },
        { label: 'Patient', render: (i) => i.id_patient || '-' },
        { label: 'Service', render: (i) => i.service || '-' },
        { label: 'Paramètre', render: (i) => i.chim || '-' },
        { label: 'Résultat', render: (i) => `${i.resultat ?? '-'} ${i.unite || ''}` },
        { label: 'Plage', render: (i) => i.plage || '-' },
        { label: 'Date', render: (i) => dateFr(i.date_analyse) },
    ],
};

const TITRES: Record<HistoriqueKey, string> = {
    nfs: 'NFS',
    hormones: 'Hormones',
    vs: 'VS',
    biochimie: 'Biochimie',
};

export default function AutomatExamen() {

    const [loadingGlobal, setLoadingGlobal] =
        useState(false);

    const [loadingNfs, setLoadingNfs] =
        useState(false);

    const [loadingHormone, setLoadingHormone] =
        useState(false);

    const [loadingVs, setLoadingVs] =
        useState(false);

    const [loadingBiochimie, setLoadingBiochimie] =
        useState(false);

    const [nfsProgress, setNfsProgress] =
        useState(0);

    const [hormoneProgress, setHormoneProgress] =
        useState(0);

    const [vsProgress, setVsProgress] =
        useState(0);

    const [biochimieProgress, setBiochimieProgress] =
        useState(0);

    const [showHistorique, setShowHistorique] =
        useState(false);

    const [showLiens, setShowLiens] =
        useState(false);

    const [historique, setHistorique] =
        useState<Record<HistoriqueKey, HistoriqueSection>>(HISTORIQUE_VIDE);

    const [ongletHistorique, setOngletHistorique] =
        useState<HistoriqueKey>('nfs');

    const [loadingHistorique, setLoadingHistorique] =
        useState(false);

    const [vidageHistorique, setVidageHistorique] =
        useState(false);

    const chargerHistorique = async () => {
        try {
            setLoadingHistorique(true);
            const res = await fetch('/api/automates/historique');
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Erreur de chargement');
            setHistorique({
                nfs: data.nfs || { total: 0, data: [] },
                hormones: data.hormones || { total: 0, data: [] },
                vs: data.vs || { total: 0, data: [] },
                biochimie: data.biochimie || { total: 0, data: [] },
            });
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoadingHistorique(false);
        }
    };

    const ouvrirHistorique = () => {
        setShowHistorique(true);
        chargerHistorique();
    };

    const viderHistorique = async (type: HistoriqueKey | 'all') => {
        const libelle = type === 'all' ? 'tous les automates' : TITRES[type];
        if (!confirm(`Voulez-vous vider l'historique ${libelle} ?`)) return;
        try {
            setVidageHistorique(true);
            const res = await fetch(`/api/automates/historique?type=${type}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Erreur lors du vidage');
            alert(data.message || 'Historique vidé');
            if (type === 'all') {
                setHistorique(HISTORIQUE_VIDE);
            } else {
                setHistorique((prev) => ({ ...prev, [type]: { total: 0, data: [] } }));
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setVidageHistorique(false);
        }
    };

    // ====================================
    // NFS
    // ====================================

    const actualiserNFS = async () => {

        if (!confirm(
            'Voulez-vous actualiser les résultats NFS uniquement ?'
        )) return;

        try {

            setLoadingNfs(true);

            const response =
                await fetch(
                    '/api/automates/nfs/import',
                    {
                        method: 'POST'
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message
                );
            }

            setNfsProgress(
                data.progression || 100
            );

            alert(
                data.message
            );

        } catch (error: any) {

            alert(
                error.message
            );

        } finally {

            setLoadingNfs(false);
        }
    };

    // ====================================
    // HORMONES
    // ====================================

    const actualiserHormones =
        async () => {

        if (!confirm(
            'Voulez-vous actualiser les résultats Hormones uniquement ?'
        )) return;

        try {

            setLoadingHormone(true);

            const response =
                await fetch(
                    '/api/automates/hormones/import',
                    {
                        method: 'POST'
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message
                );
            }

            setHormoneProgress(
                data.progression || 100
            );

            alert(
                data.message
            );

        } catch (error: any) {

            alert(
                error.message
            );

        } finally {

            setLoadingHormone(false);
        }
    };

    // ====================================
    // VS
    // ====================================

    const actualiserVS =
        async () => {

        if (!confirm(
            'Voulez-vous actualiser les résultats VS uniquement ?'
        )) return;

        try {

            setLoadingVs(true);

            const response =
                await fetch(
                    '/api/automates/vs/import',
                    {
                        method: 'POST'
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message
                );
            }

            setVsProgress(
                data.progression || 100
            );

            alert(
                data.message
            );

        } catch (error: any) {

            alert(
                error.message
            );

        } finally {

            setLoadingVs(false);
        }
    };

    // ====================================
    // BIOCHIMIE
    // ====================================

    const actualiserBiochimie =
        async () => {

        if (!confirm(
            'Voulez-vous actualiser les résultats Biochimie uniquement ?'
        )) return;

        try {

            setLoadingBiochimie(true);

            const response =
                await fetch(
                    '/api/automates/biochimies/import',
                    {
                        method: 'POST'
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message
                );
            }

            setBiochimieProgress(
                data.progression || 100
            );

            alert(
                data.message
            );

        } catch (error: any) {

            alert(
                error.message
            );

        } finally {

            setLoadingBiochimie(false);
        }
    };

    // ====================================
    // ACTUALISER TOUT
    // ====================================

    const actualiserTout =
        async () => {

        if (!confirm(
            'Voulez-vous actualiser tous les résultats ?'
        )) return;

        try {

            setLoadingGlobal(true);

            await actualiserNFS();

            await actualiserHormones();

            await actualiserVS();

            await actualiserBiochimie();

            alert(
                'Tous les automates ont été actualisés'
            );

        } catch (error: any) {

            alert(
                'Erreur lors de l\'actualisation : ' + error.message
            );

        } finally {

            setLoadingGlobal(false);
        }
    };

    return (

        <Container fluid>

            <div
                className="text-center text-white fw-bold py-3 mb-3"
                style={{
                    background:
                        'linear-gradient(#5db8ff,#0078d7)',
                    fontSize: 28
                }}
            >
                SUIVI D'IMPORTATION
                AUTOMATIQUE
                D'EXAMENS DISPONIBLES
            </div>

            <Row>

                {/* gauche */}

                <Col md={3}>

                    <Button
                        variant="warning"
                        className="w-100 mb-4 fw-bold"
                        onClick={ouvrirHistorique}
                    >
                        <ClockHistory
                            size={30}
                        />
                        <br />
                        Historique téléchargement
                    </Button>

                    <Button
                        variant="outline-primary"
                        className="w-100 mb-4 fw-bold"
                        onClick={() => setShowLiens(!showLiens)}
                    >
                        <Link45deg size={30} />
                        <br />
                        Liens automates {showLiens ? '▲' : '▼'}
                    </Button>

                    <Card
                        className="text-center p-4"
                        style={{
                            cursor: 'pointer'
                        }}
                        onClick={
                            actualiserTout
                        }
                    >
                        {loadingGlobal ? (

                            <Spinner />

                        ) : (

                            <>
                                <ArrowClockwise
                                    size={70}
                                    className="text-success"
                                />

                                <h5>
                                    Actualiser
                                    tous les
                                    résultats ici
                                </h5>
                            </>
                        )}
                    </Card>

                </Col>

                {/* centre */}

                <Col md={6}>

                    <ProgressCard
                        title="SUIVI IMPORTATION DES EXAMENS NFS"
                        value={nfsProgress}
                    />

                    <ProgressCard
                        title="SUIVI IMPORTATION DES EXAMENS HORMONES"
                        value={hormoneProgress}
                    />

                    <ProgressCard
                        title="SUIVI IMPORTATION DES EXAMENS VS"
                        value={vsProgress}
                    />

                    <ProgressCard
                        title="SUIVI IMPORTATION DES EXAMENS BIOCHIMIES"
                        value={biochimieProgress}
                    />

                </Col>

                {/* droite */}

                <Col md={3}>

                    <ActionButton
                        label="RESULTAT NFS"
                        loading={loadingNfs}
                        onClick={
                            actualiserNFS
                        }
                    />

                    <ActionButton
                        label="RESULTAT HORMONES"
                        loading={
                            loadingHormone
                        }
                        onClick={
                            actualiserHormones
                        }
                    />

                    <ActionButton
                        label="RESULTAT VS"
                        loading={loadingVs}
                        onClick={
                            actualiserVS
                        }
                    />

                    <ActionButton
                        label="BIOCHIMIE"
                        loading={
                            loadingBiochimie
                        }
                        onClick={
                            actualiserBiochimie
                        }
                    />

                </Col>

            </Row>

            {/* Paramétrage des liens automates (affiché au besoin) */}
            {showLiens && (
                <Row className="mt-4">
                    <Col xs={12}>
                        <GestionLienAutomate />
                    </Col>
                </Row>
            )}

            {/* Modal Historique des téléchargements */}
            <Modal
                show={showHistorique}
                onHide={() => setShowHistorique(false)}
                centered
                size="xl"
                scrollable
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <ClockHistory className="me-2" />
                        Historique des résultats téléchargés
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Nav
                        variant="tabs"
                        activeKey={ongletHistorique}
                        onSelect={(k) => setOngletHistorique(k as HistoriqueKey)}
                        className="mb-3"
                    >
                        {(Object.keys(TITRES) as HistoriqueKey[]).map((key) => (
                            <Nav.Item key={key}>
                                <Nav.Link eventKey={key}>
                                    {TITRES[key]} ({historique[key].total})
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>
                    {loadingHistorique ? (
                        <div className="text-center py-4"><Spinner animation="border" /></div>
                    ) : historique[ongletHistorique].data.length === 0 ? (
                        <div className="text-center text-muted py-4">
                            Aucun résultat {TITRES[ongletHistorique]} importé.
                        </div>
                    ) : (
                        <Table striped bordered hover size="sm" responsive>
                            <thead className="table-primary">
                                <tr>
                                    {COLONNES[ongletHistorique].map((c) => <th key={c.label}>{c.label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {historique[ongletHistorique].data.map((item, idx) => (
                                    <tr key={item._id || idx}>
                                        {COLONNES[ongletHistorique].map((c) => <td key={c.label}>{c.render(item)}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="outline-danger"
                        onClick={() => viderHistorique(ongletHistorique)}
                        disabled={vidageHistorique || historique[ongletHistorique].total === 0}
                    >
                        <Trash className="me-2" />Vider {TITRES[ongletHistorique]}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => viderHistorique('all')}
                        disabled={vidageHistorique || (Object.keys(TITRES) as HistoriqueKey[]).every((k) => historique[k].total === 0)}
                    >
                        {vidageHistorique ? <><Spinner size="sm" className="me-2" />Vidage...</> : <><Trash className="me-2" />Tout vider</>}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowHistorique(false)}>Fermer</Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
}

// ====================================

function ProgressCard({
    title,
    value
}: {
    title: string;
    value: number;
}) {

    return (

        <Card className="mb-4">

            <Card.Body>

                <h5>{title}</h5>

                <ProgressBar
                    now={value}
                    label={`${value}%`}
                    style={{
                        height: 40,
                        fontSize: 18
                    }}
                />

            </Card.Body>

        </Card>
    );
}

// ====================================

function ActionButton({
    label,
    loading,
    onClick
}: {
    label: string;
    loading: boolean;
    onClick: () => void;
}) {

    return (

        <Button
            variant="light"
            className="w-100 mb-3 border fw-bold"
            style={{
                height: 85,
                fontSize: 20
            }}
            onClick={onClick}
            disabled={loading}
        >
            {loading ? (
                <Spinner
                    size="sm"
                />
            ) : (
                label
            )}
        </Button>
    );
}