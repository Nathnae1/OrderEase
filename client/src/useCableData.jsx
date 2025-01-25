import { useState, useEffect } from 'react';
import api from './api';

//shared across all instances of the useCableData hook in that module
// Act as a shared global variable
let cachedData = null;

// Function to update cached data
export const updateCachedData = (updatedItem) => {
  if (cachedData) {
    const itemIndex = cachedData.findIndex(item => item.idItems === updatedItem.idItems);
    if (itemIndex !== -1) {
      cachedData[itemIndex] = updatedItem;
    }
  }
};

export const useCableData = () => {
  const [itemsDetail, setItemsDetail] = useState(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedData) {
      setItemsDetail(cachedData);
      setLoading(false);
    } else {
      const fetchItemsDetail = async () => {
        try {
          const response = await api.get('/suggestions/items');
          cachedData = response.data;
          setItemsDetail(cachedData);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchItemsDetail();
    }
  }, []);

  return { itemsDetail, loading, error };
};