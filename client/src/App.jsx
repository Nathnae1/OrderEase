import React from 'react';
import { BrowserRouter, Router, Route, Routes, Navigate } from 'react-router-dom';

import { AuthProvider } from './AuthContext';
import Dashboard from './Dashboard';
import NavigationBar from './NavigationBar';
import ProtectedRoute from './ProtectedRoute';

import Quotation from './Quotation'
import QuotationCreate from './QuotaionCreate';
import Home from './Home'
import SalesOrderCreate from './SalesOrderCreate';
import SalesOrderFetch from './SalesOrderFetch';
import QuotationPrint from './QuotationPrint';

import DeliveryInstructionCreate from './DeliveryInstructionCreate';
import DeliveryInstructionFetch from './DeliveryInstructionFetch';

import LoginCard from './LoginCard'

import AddContact from './AddContact';
import EditContact from './EditContact'; 

import SalesOrderPrint from './SalesOrderPrint';
import DeliveryInstructionPrint from './DeliveryInstructionPrint';
import ItemPricesUpdate from './ItemPricesUpdate';

import './App.css'

function App() {
  // Handle route protection within route
  return (
      <AuthProvider>
        <BrowserRouter>
          <NavigationBar />
          <Routes>
            <Route path="/login" element={<LoginCard />} />
            <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/get_quotation" element={<ProtectedRoute element={<Quotation />} />} />
            <Route path="/quotation/print/:id" element={<ProtectedRoute element={<QuotationPrint />} printProgrammaticAccess={true} />} />

            <Route path="/add" element={<ProtectedRoute element={<QuotationCreate />} />} />

            <Route path="/create_so" element={<ProtectedRoute element={<SalesOrderCreate />} programmaticAccess={true} />} />
            <Route path="/fetch_so" element={<ProtectedRoute element={<SalesOrderFetch />} />} />
            <Route path="/sales_order/print/:soId" element={<ProtectedRoute element={<SalesOrderPrint />} printSoProgrammaticAccess={true} />} />

            <Route path="/create_di" element={<ProtectedRoute element={<DeliveryInstructionCreate />} programmaticDIAccess={true} />} />
            
            <Route path="/fetch_di" element={<ProtectedRoute element={<DeliveryInstructionFetch />} />} />

            <Route path="/delivery_instruction/print/:diId" element={<ProtectedRoute element={<DeliveryInstructionPrint />} printDiProgrammaticAccess={true} />} />

             {/* Add Contacts Route */}
            <Route path="/add_contact" element={<ProtectedRoute element={<AddContact />} />} />

            {/* Edit Contacts Route */}
            <Route path="/edit_contact" element={<ProtectedRoute element={<EditContact />} />} />

            <Route path="/update_item_prices" element={<ProtectedRoute element={<ItemPricesUpdate />} />} />

            <Route path="/" element={<Navigate to="/login" />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>      
  )
}

export default App
