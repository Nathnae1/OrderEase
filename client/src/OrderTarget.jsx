
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./OrderTarget.css";

const OrderTarget = () => {
  const [salespersons, setSalespersons] = useState([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState("");
  const [oldTargets, setOldTargets] = useState(null);
  const [newTargets, setNewTargets] = useState({ Q1: 0, Q2: 0, Q3: 0, Q4: 0 });
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  // Fetch salespersons list from backend
  useEffect(() => {
    const fetchSalespersons = async () => {
      try {
        const response = await axios.get("http://localhost:5000/sales/persons");
        setSalespersons(response.data);
        console.log(response.data);
        
      } catch (error) {
        console.error("Error fetching salespersons:", error);
      }
    };
    fetchSalespersons();
  }, []);

  // Fetch previous sales target data when salesperson is selected
  const handleSalespersonChange = async (event) => {
    const salespersonId = event.target.value;
    setSelectedSalesperson(salespersonId);
    setLoading(true);

    try {
      const response = await axios.get(
        `http://localhost:5000/sales-target/${salespersonId}?year=${year - 1}`
      );
      setOldTargets(response.data);
    } catch (error) {
      console.error("Error fetching old sales target:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle target input changes
  const handleTargetChange = (quarter, value) => {
    setNewTargets({ ...newTargets, [quarter]: parseInt(value) || 0 });
  };

  // Submit new sales targets
  const handleSubmit = async () => {
    try {
      await axios.post(`http://localhost:5000/sales-target`, {
        salespersonId: selectedSalesperson,
        year,
        targets: newTargets,
      });
      alert("Sales targets updated successfully!");
    } catch (error) {
      alert("Failed to update sales targets. Please try again.");
    }
  };

  return (
    <div className="sales-target-container">
     
      {/* Select Salesperson */}
      <label className="form-label">Select Salesperson:</label>
      <select
        onChange={handleSalespersonChange}
        value={selectedSalesperson}
        className="form-select"
      >
        <option value="">-- Choose a salesperson --</option>
        {salespersons.map((person) => (
          <option key={person.sales_rep_id} value={person.sales_rep_id}>
            {person.first_name} {person.last_name}
          </option>
        ))}
      </select>

      {/* Show previous year targets */}
      {loading && <p className="loading-text">Loading previous targets...</p>}
      {oldTargets && (
        <div className="old-targets">
          <h3>Previous Year ({year - 1}) Targets</h3>
          <p>Q1: {oldTargets.Q1}</p>
          <p>Q2: {oldTargets.Q2}</p>
          <p>Q3: {oldTargets.Q3}</p>
          <p>Q4: {oldTargets.Q4}</p>
        </div>
      )}

      {/* New Sales Target Form */}
      {selectedSalesperson && (
        <form className="form-container">
          <h3>Set New Targets for {year}</h3>

          <label className="form-label">Q1 Target:</label>
          <input
            type="number"
            value={newTargets.Q1}
            onChange={(e) => handleTargetChange("Q1", e.target.value)}
            className="form-input"
          />

          <label className="form-label">Q2 Target:</label>
          <input
            type="number"
            value={newTargets.Q2}
            onChange={(e) => handleTargetChange("Q2", e.target.value)}
            className="form-input"
          />

          <label className="form-label">Q3 Target:</label>
          <input
            type="number"
            value={newTargets.Q3}
            onChange={(e) => handleTargetChange("Q3", e.target.value)}
            className="form-input"
          />

          <label className="form-label">Q4 Target:</label>
          <input
            type="number"
            value={newTargets.Q4}
            onChange={(e) => handleTargetChange("Q4", e.target.value)}
            className="form-input"
          />

          <button type="button" onClick={handleSubmit} className="submit-button">
            Save Targets
          </button>
        </form>
      )}
    </div>
  );
};

export default OrderTarget
