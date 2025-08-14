import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

interface QuoteInvoiceFormData {
  client_id: number;
  document_type: string;
  amount: number;
  status: string;
  issue_date: string;
  payment_date: string;
}

const initialFormData: QuoteInvoiceFormData = {
  client_id: 0,
  document_type: 'Devis',
  amount: 0,
  status: 'En attente',
  issue_date: new Date().toISOString().split('T')[0],
  payment_date: '',
};

const QuoteInvoiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState<QuoteInvoiceFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Array<{ id: number; name: string; first_name: string; company: string | null }>>([]);

  useEffect(() => {
    fetchClients();
    if (id) {
      fetchQuoteInvoice();
    }
  }, [id]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, first_name, company')
        .order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchQuoteInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes_invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          ...data,
          issue_date: data.issue_date || '',
          payment_date: data.payment_date || '',
        });
      }
    } catch (error) {
      console.error('Error fetching quote/invoice:', error);
      setError('Erreur lors du chargement du document');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        payment_date: formData.payment_date || null
      };

      if (id) {
        const { error } = await supabase
          .from('quotes_invoices')
          .update(submitData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('quotes_invoices')
          .insert([submitData]);
        if (error) throw error;
      }

      navigate('/quotes-invoices');
    } catch (error) {
      console.error('Error saving quote/invoice:', error);
      setError(`Erreur lors de l'enregistrement: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

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
            {id ? 'Modifier le document' : 'Nouveau document'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-window rounded-lg shadow-xl">
        <div className="p-6 space-y-6 bg-black rounded-t-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label block text-sm font-medium">Type de document</label>
              <select
                name="document_type"
                value={formData.document_type}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              >
                <option value="Devis">Devis</option>
                <option value="Facture">Facture</option>
              </select>
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Client</label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.name} {client.company ? `(${client.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Montant (€)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              />
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Statut</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              >
                <option value="En attente">En attente</option>
                <option value="Payé">Payé</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Date d'émission</label>
              <input
                type="date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Format: JJ/MM/AAAA</p>
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Date de paiement</label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              />
              <p className="text-xs text-gray-400 mt-1">Format: JJ/MM/AAAA</p>
            </div>
          </div>
        </div>

        <div className="form-section px-6 py-4 border-t border-gray-700 flex justify-end space-x-3 rounded-b-lg bg-black">
          <button
            type="button"
            onClick={() => navigate('/quotes-invoices')}
            className="px-4 py-2 border border-gray-500 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuoteInvoiceForm;