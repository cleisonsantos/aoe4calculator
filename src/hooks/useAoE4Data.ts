import { useState, useEffect } from 'react';
import { fetchUnits, fetchTechnologies, type UnitData, type TechData } from '../data/api';

interface AoE4Data {
  units: UnitData[];
  technologies: TechData[];
  loading: boolean;
  error: string | null;
}

export const useAoE4Data = () => {
  const [data, setData] = useState<AoE4Data>({
    units: [],
    technologies: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [unitsData, techsData] = await Promise.all([
          fetchUnits(),
          fetchTechnologies(),
        ]);

        if (mounted) {
          setData({
            units: unitsData,
            technologies: techsData,
            loading: false,
            error: null,
          });
        }
      } catch (err: any) {
        if (mounted) {
          setData((prev) => ({ ...prev, loading: false, error: err.message }));
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return data;
};
