import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Search, Filter } from 'lucide-react';

interface Intervention {
  id: number;
  type: string;
  status: string;
  device_id: number;
  operator_id: number;
  report: string | null;
  difficulty: string | null;
  self_evaluation: string | null;
  intervention_date: string;
  verifier_name: string | null;
  verifier_rating: string | null;
  verification_date: string | null;
  verifier_comments: string | null;
  operator_comments: string | null;
  device_brand: string;
  device_model: string;
  device_category: string;
  operator_name: string;
  client_id: number | null;
  client_name: string | null;
  client_first_name: string | null;
}

const Interventions = () => {
  const navigate = useNavigate();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [operators, setOperators] = useState<Array<{ id: number; full_name: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: number; name: string; first_name: string }>>([]);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchInterventions();
    fetchOperators();
    fetchClients();

    const subscription = supabase
      .channel('interventions_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'interventions' 
        }, 
        () => {
          fetchInterventions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchInterventions = async () => {
    try {
      const { data, error } = await supabase
        .from('interventions')
        .select(`
          *,
          device:devices(
            id, brand, model, category, client_id,
            client:clients(id, name, first_name)
          ),
          operator:operators(id, full_name)
        `)
        .order('intervention_date', { ascending: false });
      
      if (error) throw error;
      
      // Transformer les données pour correspondre au format attendu
      const interventionsData = (data || []).map(intervention => ({
        ...intervention,
        device_brand: intervention.device?.brand || '',
        device_model: intervention.device?.model || '',
        device_category: intervention.device?.category || '',
        operator_name: intervention.operator?.full_name || '',
        client_id: intervention.device?.client_id || null,
        client_name: intervention.device?.client?.name || null,
        client_first_name: intervention.device?.client?.first_name || null
      }));
      
      setInterventions(interventionsData);
    } catch (error) {
      console.error('Error fetching interventions:', error);
      setInterventions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('id, full_name');
      if (error) throw error;
      setOperators(data || []);
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, first_name');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleInterventionClick = (interventionId: number) => {
    navigate(`/interventions/${interventionId}`);
  };

  const handleAddIntervention = () => {
    navigate('/interventions/new');
  };

  const filteredInterventions = interventions.filter(intervention => {
    const searchString = `${intervention.id} ${intervention.type} ${intervention.device_brand} ${intervention.device_model} ${intervention.operator_name}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || intervention.type === selectedType;
    const matchesStatus = !selectedStatus || intervention.status === selectedStatus;
    const matchesOperator = !selectedOperator || intervention.operator_id?.toString() === selectedOperator;
    const matchesClient = !selectedClient || intervention.client_id?.toString() === selectedClient;
    
    return matchesSearch && matchesType && matchesStatus && matchesOperator && matchesClient;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedInterventions = [...filteredInterventions].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField as keyof Intervention];
    let bValue = b[sortField as keyof Intervention];
    
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Gestion des Interventions</h1>
        <button 
          onClick={handleAddIntervention}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nouvelle Intervention</span>
        </button>
      </div>

      <div className="content-card rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-700">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par ID, type, appareil, opérateur..."
                className="search-bar w-full pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <select
                  className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full h-10"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">Tous les types</option>
                  <option value="Contrôle">Contrôle</option>
                  <option value="Revalorisation">Revalorisation</option>
                  <option value="Dépannage">Dépannage</option>
                  <option value="Réparation">Réparation</option>
                  <option value="Configuration">Configuration</option>
                  <option value="Expertise">Expertise</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
              <div>
                <select
                  className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full h-10"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="Échec">Échec</option>
                </select>
              </div>
              <div>
                <select
                  className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full h-10"
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                >
                  <option value="">Tous les opérateurs</option>
                  {operators.map(operator => (
                    <option key={operator.id} value={operator.id}>
                      {operator.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full h-10"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  <option value="">Tous les clients</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            Chargement des interventions...
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
                    onClick={() => handleSort('type')}
                  >
                    Type {getSortIcon('type')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Appareil
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Opérateur
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    Client
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('status')}
                  >
                    Statut {getSortIcon('status')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('intervention_date')}
                  >
                    Date {getSortIcon('intervention_date')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedInterventions.map((intervention) => (
                  <tr 
                    key={intervention.id}
                    onClick={() => handleInterventionClick(intervention.id)}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      #{intervention.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {intervention.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/devices/${intervention.device_id}`);
                        }}
                        className="text-green-400 hover:text-green-300 underline"
                      >
                        {intervention.device_brand} {intervention.device_model}
                      </button>
                      <div className="text-xs text-gray-400">{intervention.device_category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/operators/${intervention.operator_id}`);
                        }}
                        className="text-green-400 hover:text-green-300 underline"
                      >
                        {intervention.operator_name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {intervention.client_name ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${intervention.client_id}`);
                          }}
                          className="text-green-400 hover:text-green-300 underline"
                        >
                          {intervention.client_first_name} {intervention.client_name}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        intervention.status === 'En cours'
                          ? 'bg-yellow-900 text-yellow-200'
                          : intervention.status === 'Terminé'
                          ? 'bg-green-900 text-green-200'
                          : 'bg-red-900 text-red-200'
                      }`}>
                        {intervention.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(intervention.intervention_date).toLocaleDateString('fr-FR')}
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

export default Interventions;