import React, { useState, useEffect } from 'react';
import './ItemPricesUpdate.css'; // Add styling for the interface
import api from './api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { updateCachedData } from './useCableData';

const ItemPricesUpdate = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items per page

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
      // After a successful update, update the cached data
      updateCachedData(itemToUpdate);
      toast.success('Price updated successfully!');
    } catch (err) {
      toast.error('Failed to update price. Please try again.');
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
      // After updating all prices, update the cached data for all items
      items.forEach(updateCachedData);
      toast.success('All prices updated successfully!');
    } catch (err) {
      toast.error('Failed to update all prices. Please try again.');
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  // Calculate total pages
  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="update-prices-container">
      <ToastContainer />
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
          {currentItems.map((item) => (
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

      {/* Pagination controls */}
      <div className="pagination">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={currentPage === number ? 'active' : ''}
          >
            {number}
          </button>
        ))}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      <button className="save-all-button" onClick={handleSaveAll}>
        Save All
      </button>
    </div>
  );
};

export default ItemPricesUpdate;