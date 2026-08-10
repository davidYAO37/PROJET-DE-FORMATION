export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export function buildDbNameFromNomSociete(nomSociete: string): string {
  const slug = slugify(nomSociete);
  return `bd_${slug || "entreprise"}`;
}
