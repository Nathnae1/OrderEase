import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./OrderTarget.css";

const OrderTarget = () => {
  const currentYear = new Date().getFullYear();
  const [salespersons, setSalespersons] = useState([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState("");
  const [oldTargets, setOldTargets] = useState(null);
  const [newTargets, setNewTargets] = useState({ Q1: 0, Q2: 0, Q3: 0, Q4: 0 });
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(currentYear); // Default year
  const [viewMode, setViewMode] = useState("new"); // "new" or "old"
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    const fetchSalespersons = async () => {
      try {
        const response = await axios.get("http://localhost:5000/sales/persons");
        setSalespersons(response.data);
      } catch (error) {
        console.error("Error fetching salespersons:", error);
      }
    };
    fetchSalespersons();
  }, []);

  useEffect(() => {
    if (viewMode === "new" && selectedSalesperson) {
      fetchExistingTargets();
    }
  }, [viewMode, selectedSalesperson]);

  const handleSalespersonChange = (event) => {
    setSelectedSalesperson(event.target.value);
    setOldTargets(null);
    setNewTargets({ Q1: 0, Q2: 0, Q3: 0, Q4: 0 });
  };

  const handleYearChange = (event) => {
    setYear(event.target.value);
  };

  const fetchExistingTargets = async () => {
    if (!selectedSalesperson) return;
    setLoading(true);
    setNoData(false);

    try {
      const response = await axios.get(
        `http://localhost:5000/sales-target/${selectedSalesperson}?year=${currentYear}`
      );

      if (response.data && Object.keys(response.data).length > 0) {
        setNewTargets(response.data);
      } else {
        setNewTargets({ Q1: 0, Q2: 0, Q3: 0, Q4: 0 });
        setNoData(true);
      }
    } catch (error) {
      console.error("Error fetching existing sales target:", error);
      setNewTargets({ Q1: 0, Q2: 0, Q3: 0, Q4: 0 });
      setNoData(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchOldTargets = async () => {
    if (!selectedSalesperson) return;
    setLoading(true);
    setNoData(false);

    try {
      const response = await axios.get(
        `http://localhost:5000/sales-target/${selectedSalesperson}?year=${year}`
      );

      if (response.data && Object.keys(response.data).length > 0) {
        setOldTargets(response.data);
      } else {
        setOldTargets(null);
        setNoData(true);
      }
    } catch (error) {
      console.error("Error fetching old sales target:", error);
      setOldTargets(null);
      setNoData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = (quarter, value) => {
    setNewTargets({ ...newTargets, [quarter]: parseInt(value) || 0 });
  };

  const handleSubmit = async () => {
    if (!selectedSalesperson) {
      toast.error("Please select a salesperson first!");
      return;
    }
    try {
      await axios.post(`http://localhost:5000/sales-target`, {
        salespersonId: selectedSalesperson,
        year: currentYear,
        targets: newTargets,
      });
      toast.success("Sales targets updated successfully!");
    } catch (error) {
      toast.error("Failed to update sales targets. Please try again.");
    }
  };

  return (
    <div className="sales-target-container">
      <ToastContainer />
      {/* Navigation Tabs */}
      <div className="top-nav">
        <button className={viewMode === "new" ? "active" : ""} onClick={() => setViewMode("new")}>
          New Targets
        </button>
        <button
          className={viewMode === "old" ? "active" : ""}
          onClick={() => setViewMode("old")}
        >
          Old Targets
        </button>
      </div>

      <div className="form-section">
        {/* Year Selection (Editable for Old Targets, Fixed for New Targets) */}
        <label className="form-label">Select Year:</label>
        {viewMode === "old" ? (
          <select onChange={handleYearChange} value={year} className="form-select">
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={currentYear - i}>
                {currentYear - i}
              </option>
            ))}
          </select>
        ) : (
          <input type="text" value={currentYear} disabled className="form-input" />
        )}

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
      </div>

      {/* Old Targets View */}
      {viewMode === "old" && (
        <>
          <button onClick={fetchOldTargets} className="fetch-button">
            Fetch Old Targets
          </button>
          {loading && <p className="loading-text">Loading previous targets...</p>}
          {!loading && noData && <p>No data found for {year}.</p>}
          {oldTargets && !noData && (
            <div className="old-targets">
              <h3>Previous Targets for {year}</h3>
              <p>Q1: {oldTargets.Q1}</p>
              <p>Q2: {oldTargets.Q2}</p>
              <p>Q3: {oldTargets.Q3}</p>
              <p>Q4: {oldTargets.Q4}</p>
            </div>
          )}
        </>
      )}

      {/* New Sales Target Form */}
      {viewMode === "new" && selectedSalesperson && (
        <form className="form-container">
          <h3>Set New Targets for {currentYear}</h3>

          {["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
            <div key={quarter}>
              <label className="form-label">{quarter} Target:</label>
              <input
                type="number"
                value={newTargets[quarter]}
                onChange={(e) => handleTargetChange(quarter, e.target.value)}
                className="form-input"
              />
            </div>
          ))}

          <button type="button" onClick={handleSubmit} className="submit-button">
            Save Targets
          </button>
        </form>
      )}
    </div>
  );
};

export default OrderTarget;
