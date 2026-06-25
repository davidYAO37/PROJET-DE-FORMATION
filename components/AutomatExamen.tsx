'use client';

import { useState } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    ProgressBar,
    Spinner
} from 'react-bootstrap';

import {
    ArrowClockwise,
    ClockHistory
} from 'react-bootstrap-icons';

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
                    >
                        <ClockHistory
                            size={30}
                        />
                        <br />
                        Historique téléchargement
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