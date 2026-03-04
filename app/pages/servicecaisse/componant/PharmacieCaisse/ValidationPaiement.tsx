import React, { useState } from "react";

type Props = {
    onValidate: () => Promise<{ success: boolean; message?: string }>;
    onHide?: () => void; // Ajout de la prop onHide optionnelle
};

export default function ValidationPaiement({ onValidate, onHide }: Props) {
    const [isValidating, setIsValidating] = useState(false);
    const [message, setMessage] = useState("");

    const handleValidate = async () => {
        setIsValidating(true);
        setMessage("Traitement du paiement en cours...");

        try {
            const result = await onValidate();

            if (!result.success) {
                setMessage(result.message || "❌ Paiement non validé");
                setIsValidating(false);
                return;
            }

            setMessage("✅ Paiement validé avec succès !");

            // Fermer le modal après 2 secondes
            setTimeout(() => {
                if (onHide) {
                    onHide(); // Utiliser la fonction onHide si disponible
                } else {
                    // Sinon, essayer de trouver le bouton de fermeture Bootstrap
                    const closeButton = document.querySelector('[data-bs-dismiss="modal"]') as HTMLButtonElement;
                    if (closeButton) {
                        closeButton.click();
                    }
                }
            }, 2000);
        } catch (error) {
            console.error("Erreur lors de la validation:", error);
            setMessage("❌ Erreur lors du traitement du paiement");
            setIsValidating(false);
        }
    };

    return (
        <div className="text-center">
            {message && (
                <div className={`alert ${message.includes("✅") ? "alert-success" : "alert-danger"} mb-3`}>
                    {message}
                </div>
            )}

            <button
                className="btn btn-primary btn-lg w-100 mt-3"
                onClick={handleValidate}
                disabled={isValidating}
            >
                {isValidating ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Traitement en cours...
                    </>
                ) : (
                    "Valider le paiement"
                )}
            </button>
        </div>
    );
}
