"use client";

import { useState } from "react";
import { Button, Row, Col } from "react-bootstrap";

type Props = {
  disabled?: boolean;
  onSubmit?: () => Promise<void> | void; // fonction d’envoi
  onSuccess?: () => void; // 👈 callback quand tout s’est bien passé
};

export default function ActionsButtonsUpdate({ disabled = false, onSubmit, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);

  const handleClick = async () => {
    if (isSubmitting || disabled || locked) return;

    try {
      setIsSubmitting(true);
      await onSubmit?.();

      // ✅ si tout est bon :
      setLocked(true);
      onSuccess?.(); // 👈 ferme automatiquement le modal
    } catch (err) {
      console.error("❌ Erreur pendant la soumission :", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Row className="mt-3">
      <Col>
        <Button
          variant={locked ? "secondary" : "success"}
          className="w-100"
          disabled={disabled || isSubmitting || locked}
          onClick={handleClick}
        >
          {isSubmitting
            ? "Enregistrement en cours..."
            : locked
            ? "✅ Enregistré avec succès"
            : "Allez à la caisse SVP"}
        </Button>
      </Col>
    </Row>
  );
}