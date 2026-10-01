import { useState, useEffect } from 'react';
import { fetchUnits, fetchTechnologies, fetchBuildings, type BuildingData, type UnitData, type TechData } from '../data/api';

interface AoE4Data {
  units: UnitData[];
  technologies: TechData[];
  buildings?: BuildingData[];
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
        const [unitsData, techsData, buildingsData] = await Promise.all([
          fetchUnits(),
          fetchTechnologies(),
          fetchBuildings().catch(() => []),
        ]);

        if (mounted) {
          setData({
            units: unitsData,
            technologies: techsData,
            buildings: buildingsData,
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
