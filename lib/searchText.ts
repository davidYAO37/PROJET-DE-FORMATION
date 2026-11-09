/** Minuscules sans accents : « Paracétamol » -> « paracetamol ». */
export function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Vrai si l'un des champs contient le terme, sans tenir compte des accents ni de la casse. */
export function matchesSearch(term: string, ...fields: unknown[]): boolean {
  const t = normalizeText(term);
  if (!t) return true;
  return fields.some((f) => normalizeText(f).includes(t));
}

const ACCENTS: Record<string, string> = {
  a: "aàáâãäå", c: "cç", e: "eèéêë", i: "iìíîï", n: "nñ", o: "oòóôõö", u: "uùúûü", y: "yýÿ",
};

/** Expression régulière MongoDB insensible aux accents et à la casse pour un terme saisi. */
export function accentInsensitiveRegex(term: string): RegExp {
  const pattern = normalizeText(term)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .split("")
    .map((ch) => (ACCENTS[ch] ? `[${ACCENTS[ch]}]` : ch))
    .join("");
  return new RegExp(pattern, "i");
}
