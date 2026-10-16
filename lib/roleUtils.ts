export const COMBINED_ROLES: Record<string, string[]> = {
  "accueil-caisse": ["accueil", "caisse"],
};

export function expandAllowedRoles(allowedRoles?: string[]): string[] | undefined {
  if (!allowedRoles) return allowedRoles;
  const expanded = new Set(allowedRoles);

  for (const [combined, bases] of Object.entries(COMBINED_ROLES)) {
    if (bases.some((base) => allowedRoles.includes(base))) {
      expanded.add(combined);
    }
  }

  return Array.from(expanded);
}
