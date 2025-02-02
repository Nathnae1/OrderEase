import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditContactStyles.css';

function EditContact() {

  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch list of companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('http://localhost:5000/companies');
        setCompanies(response.data);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch details when a company is selected
  const handleCompanySelect = async (event) => {
    const companyId = event.target.value;
    setSelectedCompanyId(companyId);
    setLoading(true);

    try {
      const response = await axios.get(`http://localhost:5000/company/${companyId}`);
      setCompanyData(response.data);
    } catch (error) {
      console.error('Error fetching company details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    setCompanyData({ ...companyData, [e.target.name]: e.target.value });
  };

  // Submit updated data
  const handleSubmit = async () => {
    try {
      await axios.put(`http://localhost:5000/company/${selectedCompanyId}`, companyData);
      alert('Company details updated successfully!');
    } catch (error) {
      alert('Failed to update company. Please try again.');
    }
  };
  
  return (
    <div className="editor-container">
      <h2>Edit Company Details</h2>

      {/* Dropdown to select company */}
      <label className="form-label">Select Company:</label>
      <select onChange={handleCompanySelect} value={selectedCompanyId} className="form-select">
        <option value="">-- Select a company --</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.company_name}
          </option>
        ))}
      </select>

      {/* Display form if a company is selected */}
      {loading && <p className="loading-text">Loading company details...</p>}
      {companyData && (
        <form className="form-container">
          <label className="form-label">ID (Read-Only):</label>
          <input type="text" value={companyData.id} readOnly className="form-input readonly" />

          <label className="form-label">Company Name:</label>
          <input type="text" name="company_name" value={companyData.company_name} onChange={handleChange} className="form-input" />

          <label className="form-label">Region:</label>
          <input type="text" name="region" value={companyData.region} onChange={handleChange} className="form-input" />

          <label className="form-label">City:</label>
          <input type="text" name="city" value={companyData.city} onChange={handleChange} className="form-input" />

          <label className="form-label">TIN:</label>
          <input type="text" name="tin" value={companyData.tin} onChange={handleChange} className="form-input" />

          <label className="form-label">Contact Person:</label>
          <input type="text" name="contact_person" value={companyData.contact_person} onChange={handleChange} className="form-input" />

          <label className="form-label">Phone Number:</label>
          <input type="text" name="phone_number" value={companyData.phone_number} onChange={handleChange} className="form-input" />

          <label className="form-label">Email Address:</label>
          <input type="email" name="email_address" value={companyData.email_address} onChange={handleChange} className="form-input" />

          <label className="form-label">Website URL:</label>
          <input type="text" name="website_url" value={companyData.website_url} onChange={handleChange} className="form-input" />

          <label className="form-label">Address:</label>
          <input type="text" name="address" value={companyData.address} onChange={handleChange} className="form-input" />

          <label className="form-label">Industry Sector:</label>
          <input type="text" name="industry_sector" value={companyData.industry_sector} onChange={handleChange} className="form-input" />

          <label className="form-label">Parent Company:</label>
          <input type="text" name="parent_company" value={companyData.parent_company} onChange={handleChange} className="form-input" />

          <button type="button" onClick={handleSubmit} className="submit-button">
            Save Changes
          </button>
        </form>
      )}
    </div>
  );
};

export default EditContact;
