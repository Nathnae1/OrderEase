import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './navigation-bar.css';

const NavigationBar = () => {
  const { isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className={isAuthenticated ? 'is-authenticated' : 'hidden'}>
      {isAuthenticated ? (
        <>
          <NavLink
            to="/home"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
          >
            Home
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/create_quotation"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
          >
            Create Quotation
          </NavLink>
          <NavLink
            to="/get_quotation"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
          >
            Fetch Quotation
          </NavLink>
          <NavLink
            to="/fetch_so"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
          >
            Fetch Sales Order
          </NavLink>
          <NavLink
            to="/fetch_di"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
          >
            Fetch Delivery
          </NavLink>

          {/* Dropdown for Contacts */}
          <div
            className="dropdown"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button className="dropdown-button">Contacts</button>
            {isDropdownOpen && (
              <div className="dropdown-content">
                <NavLink to="/add_contact" className="dropdown-link">
                  Add Contacts
                </NavLink>
                <NavLink to="/edit_contact" className="dropdown-link">
                  Edit Contacts
                </NavLink>
              </div>
            )}
          </div>

          <NavLink
            to="/update_item_prices"
            className={({ isActive }) => (isActive ? 'active-link' : '')}
          >
            Update Prices
          </NavLink>

          <button
            onClick={() => {
              localStorage.removeItem('token');
              logout();
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <NavLink
          to="/login"
          className={({ isActive }) => (isActive ? 'active-link' : '')}
        >
          Login
        </NavLink>
      )}
    </nav>
  );
};

export default NavigationBar;
