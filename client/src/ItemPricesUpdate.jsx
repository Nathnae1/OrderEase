import React, { useState, useEffect } from 'react';
import './ItemPricesUpdate.css'; // Add styling for the interface
import api from './api';

const ItemPricesUpdate = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch items from the server
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get('/suggestions/items'); // Replace with your endpoint
        setItems(response.data);
      } catch (err) {
        setError('Failed to load items');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Handle price change for a specific item
  const handlePriceChange = (id, newPrice) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.idItems === id ? { ...item, price: newPrice } : item
      )
    );
  };

  // Handle saving a single item
  const handleSave = async (id) => {
    const itemToUpdate = items.find((item) => item.idItems === id);
    try {
      await api.put(`/api/items/update/price${id}`, {
        price: itemToUpdate.price,
      });
      alert('Price updated successfully!');
    } catch (err) {
      alert('Failed to update price. Please try again.');
    }
  };

  // Handle saving all items
  const handleSaveAll = async () => {
    try {
      await Promise.all(
        items.map((item) =>
          api.put(`/api/items/update/price${item.idItems}`, {
            price: item.price,
          })
        )
      );
      alert('All prices updated successfully!');
    } catch (err) {
      alert('Failed to update all prices. Please try again.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="update-prices-container">
      <h1>Update Item Prices</h1>
      <table className="update-prices-table">
        <thead>
          <tr>
            <th>Size</th>
            <th>Description</th>
            <th>Code</th>
            <th>Voltage</th>
            <th>Price</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.idItems}>
              <td>{item.size}</td>
              <td>{item.itemDescription}</td>
              <td>{item.itemCode}</td>
              <td>{item.voltage}</td>
              <td>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    handlePriceChange(item.idItems, parseFloat(e.target.value) || 0)
                  }
                />
              </td>
              <td>
                <button onClick={() => handleSave(item.idItems)}>Save</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="save-all-button" onClick={handleSaveAll}>
        Save All
      </button>
    </div>
  );
};

export default ItemPricesUpdate;
