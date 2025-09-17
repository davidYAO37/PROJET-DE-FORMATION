export interface NatureActe {
    _id?: string;
    designation: string;
    code: string;
    famille?: string;
    type?: string; // HOSPITALISATION, BIOLOGIE, etc.
}
