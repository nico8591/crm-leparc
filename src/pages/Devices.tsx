import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getCategoryAbbreviation, searchInCategoryAbbreviations, getProductCode } from '../utils/categoryUtils';
import { Plus, Search, Filter } from 'lucide-react';

interface Device {
  id: number;
  category: string;
  code: string;
  brand: string;
  model: string;
  external_condition: string;
  grade: string;
  functioning: string;
  in_stock: boolean;
  storage_location: string;
  operator_id: number | null;
  operator_name: string | null;
  intervention_count: number;
  last_intervention_date: string | null;
}

const Devices = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [operators, setOperators] = useState<Array<{ id: number; full_name: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: number; name: string; first_name: string }>>([]);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchDevices();
    fetchOperators();
    fetchClients();
    
    const subscription = supabase
      .channel('devices_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'devices' 
        }, 
        (payload) => {
          console.log('Changement détecté:', payload);
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices_with_relations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      // En cas d'erreur avec la vue, essayer la table devices directement
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('devices')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        
        const transformedData = (fallbackData || []).map(device => ({
          ...device,
          operator_name: null,
          intervention_count: 0,
          last_intervention_date: null
        }));
        
        setDevices(transformedData);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        setDevices([]);
      }
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

  const handleDeviceClick = (deviceId: number) => {
    navigate(`/devices/${deviceId}`);
  };

  const handleAddDevice = () => {
    navigate('/devices/new');
  };

  const filteredDevices = devices.filter(device => {
    const matchingCategories = searchInCategoryAbbreviations(searchTerm);
    const matchesSearch = (
      device.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.id.toString().includes(searchTerm) ||
      device.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matchingCategories.includes(device.category) ||
      getCategoryAbbreviation(device.category).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProductCode(device.category, device.code).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesCategory = !selectedCategory || device.category === selectedCategory;
    const matchesCondition = !selectedCondition || device.external_condition === selectedCondition;
    const matchesGrade = !selectedGrade || device.grade === selectedGrade;
    const matchesCode = !selectedCode || device.code === selectedCode;
    const matchesOperator = !selectedOperator || device.operator_id?.toString() === selectedOperator;
    const matchesClient = !selectedClient || device.client_id?.toString() === selectedClient;
    
    return matchesSearch && matchesCategory && matchesCondition && matchesGrade && matchesCode && matchesOperator && matchesClient;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedDevices = [...filteredDevices].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField as keyof Device];
    let bValue = b[sortField as keyof Device];
    
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
        <h1 className="text-3xl font-bold text-white">Gestion des Appareils</h1>
        <button 
          onClick={handleAddDevice}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nouvel Appareil</span>
        </button>
      </div>

      <div className="content-card rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-700">
          <div className="space-y-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Rechercher par ID, marque, modèle, code, catégorie, abréviation ou code produit..."
                className="search-bar w-full pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <select
                  className="bg-black border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Toutes les catégories</option>
                  <option value="Informatique">Informatique (INF)</option>
                  <option value="Lumière">Lumière (LUM)</option>
                  <option value="Vidéo-Photo">Vidéo-Photo (VID)</option>
                  <option value="Appareils-Numériques">Appareils Numériques (NUM)</option>
                  <option value="Son">Son (SON)</option>
                  <option value="Electro Ménager">Électro Ménager (ELE)</option>
                  <option value="Serveur-Stockage">Serveur/Stockage (SRV)</option>
                  <option value="périphérique">Périphérique (PRH)</option>
                  <option value="imprimante">Imprimante (IMP)</option>
                </select>
              </div>
              <div>
                <select
                  className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full h-10"
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                >
                  <option value="">Tous les codes</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="G">G</option>
                  <option value="H">H</option>
                  <option value="I">I</option>
                  <option value="J">J</option>
                </select>
              </div>
              <div>
                <select
                  className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full h-10"
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                >
                  <option value="">Tous les états</option>
                  <option value="Cassé">Cassé</option>
                  <option value="Vétuste">Vétuste</option>
                  <option value="Bon état">Bon état</option>
                  <option value="Très bon Etat">Très bon état</option>
                  <option value="Comme neuf">Comme neuf</option>
                </select>
              </div>
              <div>
                <select
                  className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full h-10"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  <option value="">Tous les grades</option>
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
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
            Chargement des appareils...
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
                    <div className="flex items-center justify-between">
                      <span>ID</span>
                      <span className="ml-1">{getSortIcon('id')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('code')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Code produit</span>
                      <span className="ml-1">{getSortIcon('code')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('brand')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Marque/Modèle</span>
                      <span className="ml-1">{getSortIcon('brand')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Catégorie (Abréviation)</span>
                      <span className="ml-1">{getSortIcon('category')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('external_condition')}
                  >
                    <div className="flex items-center justify-between">
                      <span>État</span>
                      <span className="ml-1">{getSortIcon('external_condition')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('grade')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Grade</span>
                      <span className="ml-1">{getSortIcon('grade')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('storage_location')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Stockage</span>
                      <span className="ml-1">{getSortIcon('storage_location')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('client_name')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Client</span>
                      <span className="ml-1">{getSortIcon('client_name')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('in_stock')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Statut</span>
                      <span className="ml-1">{getSortIcon('in_stock')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedDevices.map((device) => (
                  <tr 
                    key={device.id} 
                    onClick={() => handleDeviceClick(device.id)}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      #{device.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {getProductCode(device.category, device.code)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {device.brand} {device.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {device.category} ({getCategoryAbbreviation(device.category)})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {device.external_condition}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {device.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {device.storage_location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {device.client_name ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${device.client_id}`);
                          }}
                          className="text-green-400 hover:text-green-300 underline"
                        >
                          {device.client_first_name} {device.client_name}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        device.in_stock
                          ? 'bg-green-900 text-green-200'
                          : 'bg-red-900 text-red-200'
                      }`}>
                        {device.in_stock ? 'En stock' : 'Hors stock'}
                      </span>
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

export default Devices;