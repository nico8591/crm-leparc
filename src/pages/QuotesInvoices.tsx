import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Search, FileText, DollarSign } from 'lucide-react';

interface QuoteInvoice {
  id: number;
  client_id: number;
  document_type: string;
  amount: number;
  status: string;
  issue_date: string;
  payment_date: string | null;
  client_name: string;
  client_first_name: string;
  client_company: string | null;
  client_email: string;
}

const QuotesInvoices = () => {
  const navigate = useNavigate();
  const [quotesInvoices, setQuotesInvoices] = useState<QuoteInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchQuotesInvoices();

    const subscription = supabase
      .channel('quotes_invoices_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'quotes_invoices' 
        }, 
        () => {
          fetchQuotesInvoices();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchQuotesInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes_invoices_with_relations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotesInvoices(data || []);
    } catch (error) {
      console.error('Error fetching quotes and invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteInvoiceClick = (id: number) => {
    navigate(`/quotes-invoices/${id}`);
  };

  const handleAddQuoteInvoice = () => {
    navigate('/quotes-invoices/new');
  };

  const filteredQuotesInvoices = quotesInvoices.filter(item => {
    const searchString = `${item.id} ${item.client_name} ${item.client_first_name} ${item.client_company || ''} ${item.document_type}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || item.document_type === selectedType;
    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedQuotesInvoices = [...filteredQuotesInvoices].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField as keyof QuoteInvoice];
    let bValue = b[sortField as keyof QuoteInvoice];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: string) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Devis et Factures</h1>
        <button 
          onClick={handleAddQuoteInvoice}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau Document</span>
        </button>
      </div>

      <div className="content-card rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-700">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par ID, client, entreprise ou type..."
                className="search-bar w-full pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select
                  className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full h-10"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">Tous les types</option>
                  <option value="Devis">Devis</option>
                  <option value="Facture">Facture</option>
                </select>
              </div>
              <div>
                <select
                  className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full h-10"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="En attente">En attente</option>
                  <option value="Payé">Payé</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            Chargement des documents...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('id')}
                  >
                    ID {getSortIcon('id')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('document_type')}
                  >
                    Type {getSortIcon('document_type')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Client
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('amount')}
                  >
                    Montant {getSortIcon('amount')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('status')}
                  >
                    Statut {getSortIcon('status')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('issue_date')}
                  >
                    Date d'émission {getSortIcon('issue_date')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('payment_date')}
                  >
                    Date de paiement {getSortIcon('payment_date')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedQuotesInvoices.map((item) => (
                  <tr 
                    key={item.id}
                    onClick={() => handleQuoteInvoiceClick(item.id)}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      #{item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="flex items-center">
                        {item.document_type === 'Devis' ? (
                          <FileText className="h-4 w-4 mr-2 text-blue-400" />
                        ) : (
                          <DollarSign className="h-4 w-4 mr-2 text-green-400" />
                        )}
                        {item.document_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clients/${item.client_id}`);
                        }}
                        className="text-green-400 hover:text-green-300 underline"
                      >
                        {item.client_first_name} {item.client_name}
                      </button>
                      {item.client_company && (
                        <div className="text-xs text-gray-400">{item.client_company}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'Payé'
                          ? 'bg-green-900 text-green-200'
                          : item.status === 'En attente'
                          ? 'bg-yellow-900 text-yellow-200'
                          : 'bg-red-900 text-red-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(item.issue_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {item.payment_date ? new Date(item.payment_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric'
                      }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotesInvoices;