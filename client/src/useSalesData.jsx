import { useState, useEffect } from 'react';
import api from './api';

//shared across all instances of the useCableData hook in that module
// Act as a shared global variable
let cachedData = null;

export const useSalesData = () => {
  const [salesInfo, setSalesInfo] = useState(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedData) {
      setSalesInfo(cachedData);
      setLoading(false);
    } else {
      const fetchSalesInfo = async () => {
        try {
          const response = await api.get('/suggestions/sales/person');
          cachedData = response.data;
          setSalesInfo(cachedData);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchSalesInfo();
    }
  }, []);

  return { salesInfo, loading, error };
};