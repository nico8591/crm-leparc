import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Edit2, Trash2, User } from 'lucide-react';

interface QuoteInvoice {
  id: number;
  client_id: number;
  document_type: string;
  amount: number;
  status: string;
  issue_date: string;
  payment_date: string | null;
  created_at: string;
  client_name: string;
  client_first_name: string;
  client_company: string | null;
  client_email: string;
}

const QuoteInvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quoteInvoice, setQuoteInvoice] = useState<QuoteInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuoteInvoice();
  }, [id]);

  const fetchQuoteInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes_invoices_with_relations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setQuoteInvoice(data);
    } catch (error) {
      console.error('Error fetching quote/invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/quotes-invoices/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('quotes_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/quotes-invoices');
    } catch (error) {
      console.error('Error deleting quote/invoice:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!quoteInvoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white">Document non trouvé</h2>
        <button
          onClick={() => navigate('/quotes-invoices')}
          className="mt-4 text-green-400 hover:text-green-300"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/quotes-invoices')}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-white">
            {quoteInvoice.document_type} #{quoteInvoice.id}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
          >
            <Edit2 className="h-5 w-5" />
            <span>Modifier</span>
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700"
          >
            <Trash2 className="h-5 w-5" />
            <span>Supprimer</span>
          </button>
        </div>
      </div>

      <div className="detail-window rounded-lg shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">Informations du document</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-300">Type</dt>
                <dd className="mt-1 text-sm text-white">{quoteInvoice.document_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">Montant</dt>
                <dd className="mt-1 text-lg font-semibold text-white">{formatCurrency(quoteInvoice.amount)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">Statut</dt>
                <dd className="mt-1 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    quoteInvoice.status === 'Payé'
                      ? 'bg-green-900 text-green-200'
                      : quoteInvoice.status === 'En attente'
                      ? 'bg-yellow-900 text-yellow-200'
                      : 'bg-red-900 text-red-200'
                  }`}>
                    {quoteInvoice.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">Date d'émission</dt>
                <dd className="mt-1 text-sm text-white">
                  {new Date(quoteInvoice.issue_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric'
                  })}
                </dd>
              </div>
              {quoteInvoice.payment_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Date de paiement</dt>
                  <dd className="mt-1 text-sm text-white">
                    {new Date(quoteInvoice.payment_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric'
                    })}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-300">Date de création</dt>
                <dd className="mt-1 text-sm text-white">
                  {new Date(quoteInvoice.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric'
                  })}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">Informations client</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-300">Client</dt>
                <dd className="mt-1 text-sm">
                  <button
                    onClick={() => navigate(`/clients/${quoteInvoice.client_id}`)}
                    className="text-green-400 hover:text-green-300 underline flex items-center space-x-1"
                  >
                    <User className="h-4 w-4" />
                    <span>{quoteInvoice.client_first_name} {quoteInvoice.client_name}</span>
                  </button>
                </dd>
              </div>
              {quoteInvoice.client_company && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Entreprise</dt>
                  <dd className="mt-1 text-sm text-white">{quoteInvoice.client_company}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-300">Email</dt>
                <dd className="mt-1 text-sm text-white">{quoteInvoice.client_email}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteInvoiceDetail;