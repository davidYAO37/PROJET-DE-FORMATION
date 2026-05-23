'use client';

import { useCallback, useEffect, useState } from 'react';
import { statistiquesService } from '@/services/statistiquesService';
import { StatistiquesDashboardData, StatistiquesFilters } from '@/types/statistiques';

export function useStatistiques(initialFilters: StatistiquesFilters) {
  const [filters, setFilters] = useState<StatistiquesFilters>(initialFilters);
  const [data, setData] = useState<StatistiquesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (nextFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const result = await statistiquesService.getDashboard(nextFilters);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = (nextFilters: StatistiquesFilters) => {
    setFilters(nextFilters);
    load(nextFilters);
  };

  useEffect(() => {
    load(initialFilters);
  }, []);

  return {
    data,
    filters,
    loading,
    error,
    reload: () => load(filters),
    setFilters: updateFilters,
  };
}
