import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Edit2, Trash2, FileText, ShoppingCart, PenTool as Tool } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  first_name: string;
  company: string | null;
  phone: string | null;
  email: string;
  address: string | null;
  expectations: string | null;
  comments: string | null;
}

interface ClientOrder {
  id: number;
  order_number: string;
  order_date: string;
  total_amount: number;
  status: string;
  description: string;
}

interface Intervention {
  id: number;
  type: string;
  status: string;
  intervention_date: string;
  device: {
    brand: string;
    model: string;
  };
}

interface QuoteInvoice {
  id: number;
  document_type: string;
  amount: number;
  status: string;
  issue_date: string;
  payment_date: string | null;
}

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [quotesInvoices, setQuotesInvoices] = useState<QuoteInvoice[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClient();
    fetchClientOrders();
    fetchQuotesInvoices();
    fetchInterventions();
  }, [id]);

  const fetchClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('client_orders')
        .select('*')
        .eq('client_id', id)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching client orders:', error);
    }
  };

  const fetchQuotesInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes_invoices')
        .select('*')
        .eq('client_id', id)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setQuotesInvoices(data || []);
    } catch (error) {
      console.error('Error fetching quotes and invoices:', error);
    }
  };

  const fetchInterventions = async () => {
    try {
      const { data, error } = await supabase
        .from('interventions')
        .select(`
          id, type, status, intervention_date,
          device:devices!inner(brand, model, client_id)
        `)
        .eq('device.client_id', id)
        .order('intervention_date', { ascending: false });

      if (error) throw error;
      setInterventions(data || []);
    } catch (error) {
      console.error('Error fetching interventions:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/clients/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white">Client non trouvé</h2>
        <button
          onClick={() => navigate('/clients')}
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
            onClick={() => navigate('/clients')}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-white">
            {client.first_name} {client.name}
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
            <h2 className="text-xl font-semibold mb-4 text-white">Informations de contact</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-300">Email</dt>
                <dd className="mt-1 text-sm text-white">{client.email}</dd>
              </div>
              {client.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Téléphone</dt>
                  <dd className="mt-1 text-sm text-white">{client.phone}</dd>
                </div>
              )}
              {client.company && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Entreprise</dt>
                  <dd className="mt-1 text-sm text-white">{client.company}</dd>
                </div>
              )}
              {client.address && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Adresse</dt>
                  <dd className="mt-1 text-sm text-white whitespace-pre-wrap">{client.address}</dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">Détails supplémentaires</h2>
            <dl className="space-y-4">
              {client.expectations && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Attentes</dt>
                  <dd className="mt-1 text-sm text-white whitespace-pre-wrap">{client.expectations}</dd>
                </div>
              )}
              {client.comments && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Commentaires</dt>
                  <dd className="mt-1 text-sm text-white whitespace-pre-wrap">{client.comments}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {(orders.length > 0 || quotesInvoices.length > 0 || interventions.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {orders.length > 0 && (
            <div className="detail-window rounded-lg shadow-xl">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-green-400" />
                  Historique des Commandes
                </h2>
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="p-3 bg-black/20 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">{order.order_number}</p>
                          <p className="text-sm text-gray-400">{order.description}</p>
                        </div>
                        <span className="text-sm font-medium text-green-400">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(order.total_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(order.order_date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'Terminé' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {quotesInvoices.length > 0 && (
            <div className="detail-window rounded-lg shadow-xl">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-400" />
                  Devis & Factures
                </h2>
                <div className="space-y-3">
                  {quotesInvoices.map((item) => (
                    <div key={item.id} className="p-3 bg-black/20 rounded-lg">
                      <button
                        onClick={() => navigate(`/quotes-invoices/${item.id}`)}
                        className="w-full text-left"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-green-400 hover:text-green-300">
                              {item.document_type} #{item.id}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-white">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(item.issue_date).toLocaleDateString('fr-FR')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.status === 'Payé' ? 'bg-green-900 text-green-200' : 
                            item.status === 'En attente' ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {interventions.length > 0 && (
            <div className="detail-window rounded-lg shadow-xl">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  <Tool className="h-5 w-5 mr-2 text-green-400" />
                  Interventions ({interventions.length})
                </h2>
                <div className="space-y-3">
                  {interventions.map((intervention) => (
                    <div key={intervention.id} className="p-3 bg-black/20 rounded-lg">
                      <button
                        onClick={() => navigate(`/interventions/${intervention.id}`)}
                        className="w-full text-left"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-green-400 hover:text-green-300">
                              {intervention.type}
                            </p>
                            <p className="text-sm text-gray-400">{intervention.device.brand} {intervention.device.model}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            intervention.status === 'En cours' ? 'bg-yellow-900 text-yellow-200' : 
                            intervention.status === 'Terminé' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                          }`}>
                            {intervention.status}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(intervention.intervention_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientDetail;