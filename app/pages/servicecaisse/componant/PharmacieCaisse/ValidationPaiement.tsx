type Props = {
    onValidate: () => void;
};

export default function ValidationPaiement({ onValidate }: Props) {
    return (
        <button
            className="btn btn-primary btn-lg w-100 mt-3"
            onClick={onValidate}
        >
            Valider le paiement
        </button>
    );
}
