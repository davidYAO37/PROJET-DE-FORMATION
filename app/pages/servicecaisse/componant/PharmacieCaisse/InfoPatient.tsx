type Props = {
    patient: any;
    consultation: any;
};

export default function InfoPatient({ patient, consultation }: Props) {
    return (
        <fieldset className="border p-2 mb-2">
            <legend>Information patient</legend>

            <div className="mb-1">
                <label>N° prestation</label>
                <input className="form-control" value={consultation?.Code_Prestation || ""} readOnly />
            </div>

            <div className="mb-1">
                <label>Nom</label>
                <input className="form-control" value={patient?.Nom || ""} readOnly />
            </div>

            <div className="row">
                <div className="col">
                    <label>Age</label>
                    <input className="form-control" value={patient?.Age_partient || ""} readOnly />
                </div>
                <div className="col">
                    <label>Sexe</label>
                    <input className="form-control" value={patient?.Sexe || ""} readOnly />
                </div>
            </div>
        </fieldset>
    );
}
