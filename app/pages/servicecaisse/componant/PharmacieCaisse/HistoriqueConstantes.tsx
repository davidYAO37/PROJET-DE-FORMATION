type Props = {
    consultation: any;
};

export default function HistoriqueConstantes({ consultation }: Props) {
    return (
        <fieldset className="border p-2 mb-2">
            <legend>Historique constante</legend>

            <div className="row">
                {[
                    ["Température", consultation?.Température],
                    ["Tension", consultation?.Tension],
                    ["Glycémie", consultation?.Glycemie],
                    ["Taille", consultation?.TailleCons],
                    ["Poids", consultation?.Poids],
                ].map(([label, value]) => (
                    <div className="col-6 mb-1" key={label}>
                        <label>{label}</label>
                        <input className="form-control" value={value || ""} readOnly />
                    </div>
                ))}
            </div>
        </fieldset>
    );
}
