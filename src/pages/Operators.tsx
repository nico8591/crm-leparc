import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Search, Filter } from 'lucide-react';

interface Operator {
  id: number;
  user_id: string;
  full_name: string;
  role: string;
  access_level: string;
  created_at: string;
  device_count?: number;
  intervention_count?: number;
}

const Operators = () => {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchOperators();

    const subscription = supabase
      .channel('operators_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'operators' 
        }, 
        () => {
          fetchOperators();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOperators = async () => {
    try {
      const { data: operatorsData, error: operatorsError } = await supabase
        .from('operators')
        .select('*')
        .order('created_at', { ascending: false });

      if (operatorsError) throw operatorsError;
      
      // Pour chaque opérateur, compter ses appareils et interventions
      const operatorsWithCounts = await Promise.all(
        (operatorsData || []).map(async (operator) => {
          const [devicesResult, interventionsResult] = await Promise.all([
            supabase
              .from('devices')
              .select('id', { count: 'exact' })
              .eq('operator_id', operator.id),
            supabase
              .from('interventions')
              .select('id', { count: 'exact' })
              .eq('operator_id', operator.id)
          ]);
          
          return {
            ...operator,
            device_count: devicesResult.count || 0,
            intervention_count: interventionsResult.count || 0
          };
        })
      );
      
      setOperators(operatorsWithCounts);
    } catch (error) {
      console.error('Error fetching operators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorClick = (operatorId: number) => {
    navigate(`/operators/${operatorId}`);
  };

  const handleAddOperator = () => {
    navigate('/operators/new');
  };

  const filteredOperators = operators.filter(operator => {
    const searchString = `${operator.id} ${operator.full_name} ${operator.role}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || operator.role === selectedRole;
    const matchesAccessLevel = !selectedAccessLevel || operator.access_level === selectedAccessLevel;
    
    return matchesSearch && matchesRole && matchesAccessLevel;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedOperators = [...filteredOperators].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField as keyof Operator];
    let bValue = b[sortField as keyof Operator];
    
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
        <h1 className="text-3xl font-bold text-white">Gestion des Opérateurs</h1>
        <button 
          onClick={handleAddOperator}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nouvel Opérateur</span>
        </button>
      </div>

      <div className="content-card rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-700">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par ID, nom ou rôle..."
                className="search-bar w-full pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select
                  className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="">Tous les rôles</option>
                  <option value="Technicien">Technicien</option>
                  <option value="Manager">Manager</option>
                  <option value="Administrateur">Administrateur</option>
                </select>
              </div>
              <div>
                <select
                  className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                  value={selectedAccessLevel}
                  onChange={(e) => setSelectedAccessLevel(e.target.value)}
                >
                  <option value="">Tous les niveaux d'accès</option>
                  <option value="user">Utilisateur</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            Chargement des opérateurs...
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
                    onClick={() => handleSort('full_name')}
                  >
                    Nom complet {getSortIcon('full_name')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('role')}
                  >
                    Rôle {getSortIcon('role')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('access_level')}
                  >
                    Niveau d'accès {getSortIcon('access_level')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('created_at')}
                  >
                    Date de création {getSortIcon('created_at')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Appareils
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Interventions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedOperators.map((operator) => (
                  <tr 
                    key={operator.id}
                    onClick={() => handleOperatorClick(operator.id)}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      #{operator.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{operator.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {operator.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        operator.access_level === 'admin' 
                          ? 'bg-purple-900 text-purple-200'
                          : operator.access_level === 'manager'
                          ? 'bg-blue-900 text-blue-200'
                          : 'bg-green-900 text-green-200'
                      }`}>
                        {operator.access_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(operator.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {operator.device_count > 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/devices?operator=${operator.id}`);
                          }}
                          className="text-green-400 hover:text-green-300 underline"
                        >
                          {operator.device_count} appareil{operator.device_count > 1 ? 's' : ''}
                        </button>
                      ) : (
                        '0 appareil'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {operator.intervention_count > 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/interventions?operator=${operator.id}`);
                          }}
                          className="text-green-400 hover:text-green-300 underline"
                        >
                          {operator.intervention_count} intervention{operator.intervention_count > 1 ? 's' : ''}
                        </button>
                      ) : (
                        '0 intervention'
                      )}
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

export default Operators;