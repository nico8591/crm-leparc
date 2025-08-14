import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import DeviceForm from './pages/DeviceForm';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import ClientForm from './pages/ClientForm';
import Interventions from './pages/Interventions';
import InterventionDetail from './pages/InterventionDetail';
import InterventionForm from './pages/InterventionForm';
import Operators from './pages/Operators';
import OperatorDetail from './pages/OperatorDetail';
import OperatorForm from './pages/OperatorForm';
import QuotesInvoices from './pages/QuotesInvoices';
import QuoteInvoiceDetail from './pages/QuoteInvoiceDetail';
import QuoteInvoiceForm from './pages/QuoteInvoiceForm';
import Login from './pages/Login';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {user && <Navbar />}
      <div className={`${user ? 'pl-64' : ''} min-h-screen`}>
        <div className="container mx-auto px-6 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <PrivateRoute>
                  <Devices />
                </PrivateRoute>
              }
            />
            <Route
              path="/devices/new"
              element={
                <PrivateRoute>
                  <DeviceForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/devices/:id"
              element={
                <PrivateRoute>
                  <DeviceDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/devices/:id/edit"
              element={
                <PrivateRoute>
                  <DeviceForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <PrivateRoute>
                  <Clients />
                </PrivateRoute>
              }
            />
            <Route
              path="/clients/new"
              element={
                <PrivateRoute>
                  <ClientForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <PrivateRoute>
                  <ClientDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/clients/:id/edit"
              element={
                <PrivateRoute>
                  <ClientForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/interventions"
              element={
                <PrivateRoute>
                  <Interventions />
                </PrivateRoute>
              }
            />
            <Route
              path="/interventions/new"
              element={
                <PrivateRoute>
                  <InterventionForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/interventions/:id"
              element={
                <PrivateRoute>
                  <InterventionDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/interventions/:id/edit"
              element={
                <PrivateRoute>
                  <InterventionForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/operators"
              element={
                <PrivateRoute>
                  <Operators />
                </PrivateRoute>
              }
            />
            <Route
              path="/operators/new"
              element={
                <PrivateRoute>
                  <OperatorForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/operators/:id"
              element={
                <PrivateRoute>
                  <OperatorDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/operators/:id/edit"
              element={
                <PrivateRoute>
                  <OperatorForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/quotes-invoices"
              element={
                <PrivateRoute>
                  <QuotesInvoices />
                </PrivateRoute>
              }
            />
            <Route
              path="/quotes-invoices/new"
              element={
                <PrivateRoute>
                  <QuoteInvoiceForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/quotes-invoices/:id"
              element={
                <PrivateRoute>
                  <QuoteInvoiceDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/quotes-invoices/:id/edit"
              element={
                <PrivateRoute>
                  <QuoteInvoiceForm />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;