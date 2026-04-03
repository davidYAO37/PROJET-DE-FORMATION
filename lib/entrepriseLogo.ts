/** Taille max du fichier logo (avant encodage base64). */
export const MAX_ENTREPRISE_LOGO_BYTES = 2 * 1024 * 1024;

/**
 * Convertit un fichier uploadé en data URL pour stockage en base (compatible Vercel, sans disque).
 */
export function buildLogoDataUrlFromUpload(file: File, buffer: Buffer): string {
  const mime = file.type || "application/octet-stream";
  if (!mime.startsWith("image/")) {
    throw new Error("Le logo doit être une image");
  }
  if (buffer.length > MAX_ENTREPRISE_LOGO_BYTES) {
    throw new Error("Image trop volumineuse (maximum 2 Mo)");
  }
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
