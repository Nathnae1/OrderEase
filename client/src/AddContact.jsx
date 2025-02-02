import React, { useState } from 'react';
import './AddContact.css';  // Import the specific CSS file for styling
import api from './api';

const AddContact = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    region: '',
    city: '',
    tin: '',
    contact_person: '',
    phone_number: '',
    email_address: '',
    website_url: '',
    address: '',
    industry_sector: '',
    parent_company: ''
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/api/add_contact', formData);

      if (response.status === 201) {
        alert('Contact added successfully!');
        setFormData({
          company_name: '',
          region: '',
          city: '',
          tin: '',
          contact_person: '',
          phone_number: '',
          email_address: '',
          website_url: '',
          address: '',
          industry_sector: '',
          parent_company: '',
        });    
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      alert('Failed to add contact. Please try again.');
    }
  };

  return (
    <div className="add-contact-form-container">
      <h1>Add New Contact</h1>
      <form onSubmit={handleSubmit}>
        <div className="add-contact-form-group">
          <label htmlFor="company_name">Company Name</label>
          <input
            type="text"
            id="company_name"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="add-contact-form-group">
          <label htmlFor="region">Region</label>
          <input
            type="text"
            id="region"
            name="region"
            value={formData.region}
            onChange={handleChange}
            required
          />
        </div>

        <div className="add-contact-form-group">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>

        <div className="add-contact-form-group">
          <label htmlFor="tin">TIN</label>
          <input
            type="text"
            id="tin"
            name="tin"
            value={formData.tin}
            onChange={handleChange}
            required
          />
        </div>

        <div className="add-contact-form-group">
          <label htmlFor="contact_person">Contact Person</label>
          <input
            type="text"
            id="contact_person"
            name="contact_person"
            value={formData.contact_person}
            onChange={handleChange}
            required
          />
        </div>

        <div className="add-contact-form-group">
          <label htmlFor="phone_number">Phone Number</label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            required
          />
        </div>

        <div className="add-contact-form-group">
          <label htmlFor="email_address">Email Address</label>
          <input
            type="email"
            id="email_address"
            name="email_address"
            value={formData.email_address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="add-contact-form-group">
          <label htmlFor="website_url">Website URL</label>
          <input
            type="url"
            id="website_url"
            name="website_url"
            value={formData.website_url}
            onChange={handleChange}
          />
        </div>

        <div className="add-contact-form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="add-contact-form-group">
          <label htmlFor="industry_sector">Industry Sector</label>
          <input
            type="text"
            id="industry_sector"
            name="industry_sector"
            value={formData.industry_sector}
            onChange={handleChange}
          />
        </div>

        <div className="add-contact-form-group">
          <label htmlFor="parent_company">Parent Company</label>
          <input
            type="text"
            id="parent_company"
            name="parent_company"
            value={formData.parent_company}
            onChange={handleChange}
          />
        </div>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default AddContact;
