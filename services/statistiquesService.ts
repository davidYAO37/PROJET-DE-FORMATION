import { StatistiquesDashboardData, StatistiquesFilters } from '@/types/statistiques';

export const statistiquesService = {
  async getDashboard(filters: StatistiquesFilters): Promise<StatistiquesDashboardData> {
    const params = new URLSearchParams();

    params.set('dateDebut', filters.dateDebut);
    params.set('dateFin', filters.dateFin);

    if (filters.medecinId) params.set('medecinId', filters.medecinId);
    if (filters.service) params.set('service', filters.service);
    if (filters.typeExamen) params.set('typeExamen', filters.typeExamen);

    const response = await fetch(`/api/statistiques?${params.toString()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Erreur lors du chargement des statistiques');
    }

    return response.json();
  },
};
