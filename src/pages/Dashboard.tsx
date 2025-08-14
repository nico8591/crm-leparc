import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { searchInCategoryAbbreviations, getCategoryAbbreviation } from '../utils/categoryUtils';
import { 
  BarChart, 
  Users, 
  Monitor, 
  PenTool as Tool, 
  Search, 
  PieChart, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Tag,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';

interface DashboardCounts {
  devices: number;
  activeInterventions: number;
  clients: number;
  monthlyRevenue: number;
  devicesByCategory: Record<string, number>;
  devicesByCondition: Record<string, number>;
  interventionsByType: Record<string, number>;
  interventionsByStatus: Record<string, number>;
}

interface Device {
  id: number;
  brand: string;
  model: string;
  category: string;
  entry_date: string;
  external_condition: string;
}

interface Intervention {
  id: number;
  type: string;
  status: string;
  intervention_date: string;
  device: Device;
  operator: {
    id: number;
    full_name: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<DashboardCounts>({
    devices: 0,
    activeInterventions: 0,
    clients: 0,
    monthlyRevenue: 0,
    devicesByCategory: {},
    devicesByCondition: {},
    interventionsByType: {},
    interventionsByStatus: {},
  });
  const [recentDevices, setRecentDevices] = useState<Device[]>([]);
  const [recentInterventions, setInterventions] = useState<Intervention[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{
    devices: Device[];
    interventions: Intervention[];
    clients: any[];
    operators: any[];
  }>({ devices: [], interventions: [], clients: [], operators: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    const deviceSubscription = supabase
      .channel('dashboard_devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const interventionSubscription = supabase
      .channel('dashboard_interventions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interventions' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      deviceSubscription.unsubscribe();
      interventionSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (searchTerm) {
      performSearch();
    } else {
      setSearchResults({ devices: [], interventions: [], clients: [], operators: [] });
    }
  }, [searchTerm]);

  const fetchDashboardData = async () => {
    try {
      // Réinitialiser les compteurs avant de récupérer les nouvelles données
      setCounts({
        devices: 0,
        activeInterventions: 0,
        clients: 0,
        monthlyRevenue: 0,
        devicesByCategory: {},
        devicesByCondition: {},
        interventionsByType: {},
        interventionsByStatus: {},
      });
      setRecentDevices([]);
      setInterventions([]);

      const [
        devicesResult,
        interventionsData,
        clientsCount,
        interventionTypes,
        interventionStatuses,
        recentDevicesResult,
        recentInterventionsData
      ] = await Promise.all([
        Promise.resolve(supabase.from('devices_with_relations').select('*')).catch(() => 
          Promise.resolve(supabase.from('devices').select('*'))
        ),
        supabase.from('interventions').select('*'),
        supabase.from('clients').select('id', { count: 'exact' }),
        supabase.from('interventions').select('type'),
        supabase.from('interventions').select('status'),
        Promise.resolve(supabase.from('devices_with_relations')
          .select('*')
          .order('entry_date', { ascending: false })
          .limit(5)).catch(() => 
            Promise.resolve(supabase.from('devices')
              .select('*')
              .order('entry_date', { ascending: false })
              .limit(5))
          ),
        supabase
          .from('interventions')
          .select(`
            *,
            device:devices(*),
            operator:operators(*)
          `)
          .order('intervention_date', { ascending: false })
          .limit(5)
      ]);

      // Vérifier si les données existent avant de les traiter
      const validDevices = devicesResult.data || [];
      const validInterventions = interventionsData.data || [];
      const activeInterventions = validInterventions.filter(i => i.status === 'En cours');
      
      const devicesByCategory = validDevices.reduce((acc, device) => {
        if (!device.category) return acc;
        acc[device.category] = (acc[device.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const devicesByCondition = validDevices.reduce((acc, device) => {
        if (!device.external_condition) return acc;
        acc[device.external_condition] = (acc[device.external_condition] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const interventionsByType = interventionTypes.data?.reduce((acc, intervention) => {
        if (!intervention.type) return acc;
        acc[intervention.type] = (acc[intervention.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const interventionsByStatus = interventionStatuses.data?.reduce((acc, intervention) => {
        if (!intervention.status) return acc;
        acc[intervention.status] = (acc[intervention.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setCounts({
        devices: validDevices.filter(d => d.in_stock).length || 0,
        activeInterventions: activeInterventions.length || 0,
        clients: clientsCount.count || 0,
        monthlyRevenue: 0,
        devicesByCategory,
        devicesByCondition,
        interventionsByType,
        interventionsByStatus
      });

      // Filtrer les données récentes pour s'assurer qu'elles sont valides
      const validRecentDevices = (recentDevicesResult.data || []).filter(device => 
        device && device.id && device.brand && device.model
      );
      
      const validRecentInterventions = (recentInterventionsData.data || []).filter(intervention => 
        intervention && intervention.id && intervention.type && intervention.device && intervention.operator
      );
      
      setRecentDevices(validRecentDevices);
      setInterventions(validRecentInterventions);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // En cas d'erreur, réinitialiser complètement les données
      setCounts({
        devices: 0,
        activeInterventions: 0,
        clients: 0,
        monthlyRevenue: 0,
        devicesByCategory: {},
        devicesByCondition: {},
        interventionsByType: {},
        interventionsByStatus: {},
      });
      setRecentDevices([]);
      setInterventions([]);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchTerm) return;

    try {
      const [devicesResults, interventionsResults, clientsResults, operatorsResults] = await Promise.all([
        supabase
          .from('devices')
          .select('*')
          .or(`brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,id.eq.${isNaN(Number(searchTerm)) ? '0' : searchTerm}`)
          .limit(5),
        supabase
          .from('interventions')
          .select(`
            *,
            device:devices(*),
            operator:operators(*)
          `)
          .or(`type.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%,id.eq.${isNaN(Number(searchTerm)) ? '0' : searchTerm}`)
          .limit(5),
        supabase
          .from('clients')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,id.eq.${isNaN(Number(searchTerm)) ? '0' : searchTerm}`)
          .limit(5),
        supabase
          .from('operators')
          .select('*')
          .or(`full_name.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%,id.eq.${isNaN(Number(searchTerm)) ? '0' : searchTerm}`)
          .limit(5),
      ]);

      // Filtrer les résultats pour s'assurer qu'ils sont valides
      setSearchResults({
        devices: (devicesResults.data || []).filter(d => d && d.id),
        interventions: (interventionsResults.data || []).filter(i => i && i.id && i.device && i.operator),
        clients: (clientsResults.data || []).filter(c => c && c.id),
        operators: (operatorsResults.data || []).filter(o => o && o.id),
      });
    } catch (error) {
      console.error('Error performing search:', error);
      // En cas d'erreur de recherche, vider les résultats
      setSearchResults({ devices: [], interventions: [], clients: [], operators: [] });
    }
  };

  const renderStatisticsCard = (title: string, data: Record<string, number>, icon: React.ReactNode) => (
    <div className="stats-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {icon}
      </div>
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-sm text-gray-300">{key}</span>
            <span className="text-sm font-medium text-white">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher des appareils, interventions, clients, opérateurs..."
          className="search-bar w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
      </div>

      {searchTerm && (
        <div className="dashboard-card rounded-xl overflow-hidden">
          {searchResults.devices.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold mb-2 text-white">Appareils</h3>
              <div className="space-y-2">
                {searchResults.devices.map((device) => (
                  <div
                    key={device.id}
                    className="p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    onClick={() => navigate(`/devices/${device.id}`)}
                  >
                    <p className="font-medium text-white">{device.brand} {device.model}</p>
                    <p className="text-sm text-gray-400">#{device.id} - {device.category} ({getCategoryAbbreviation(device.category)})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.interventions.length > 0 && (
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-white">Interventions</h3>
              <div className="space-y-2">
                {searchResults.interventions.map((intervention) => (
                  <div
                    key={intervention.id}
                    className="p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    onClick={() => navigate(`/interventions/${intervention.id}`)}
                  >
                    <p className="font-medium text-white">{intervention.type}</p>
                    <p className="text-sm text-gray-400">
                      #{intervention.id} - {intervention.device.brand} {intervention.device.model}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.clients.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold mb-2 text-white">Clients</h3>
              <div className="space-y-2">
                {searchResults.clients.map((client) => (
                  <div
                    key={client.id}
                    className="p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <p className="font-medium text-white">{client.first_name} {client.name}</p>
                    <p className="text-sm text-gray-400">#{client.id} - {client.company || client.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.operators.length > 0 && (
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-white">Opérateurs</h3>
              <div className="space-y-2">
                {searchResults.operators.map((operator) => (
                  <div
                    key={operator.id}
                    className="p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    onClick={() => navigate(`/operators/${operator.id}`)}
                  >
                    <p className="font-medium text-white">{operator.full_name}</p>
                    <p className="text-sm text-gray-400">#{operator.id} - {operator.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.devices.length === 0 && searchResults.interventions.length === 0 && 
           searchResults.clients.length === 0 && searchResults.operators.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              Aucun résultat trouvé
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/devices" className="dashboard-card rounded-xl p-6 hover:bg-black/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Appareils en stock</p>
              <h2 className="text-3xl font-bold text-white mt-1">{counts.devices}</h2>
            </div>
            <Monitor className="h-10 w-10 text-green-400" />
          </div>
        </Link>

        <Link to="/interventions" className="dashboard-card rounded-xl p-6 hover:bg-black/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Interventions en cours</p>
              <h2 className="text-3xl font-bold text-white mt-1">{counts.activeInterventions}</h2>
            </div>
            <Tool className="h-10 w-10 text-yellow-400" />
          </div>
        </Link>

        <Link to="/clients" className="dashboard-card rounded-xl p-6 hover:bg-black/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Clients actifs</p>
              <h2 className="text-3xl font-bold text-white mt-1">{counts.clients}</h2>
            </div>
            <Users className="h-10 w-10 text-purple-400" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderStatisticsCard(
          "Appareils par catégorie",
          counts.devicesByCategory,
          <PieChart className="h-6 w-6 text-green-400" />
        )}
        {renderStatisticsCard(
          "État des appareils",
          counts.devicesByCondition,
          <AlertTriangle className="h-6 w-6 text-yellow-400" />
        )}
        {renderStatisticsCard(
          "Types d'interventions",
          counts.interventionsByType,
          <Tool className="h-6 w-6 text-purple-400" />
        )}
        {renderStatisticsCard(
          "Statut des interventions",
          counts.interventionsByStatus,
          <TrendingUp className="h-6 w-6 text-blue-400" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="dashboard-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Clock className="h-5 w-5 mr-2 text-green-400" />
              Dernières interventions
            </h3>
            <Link
              to="/interventions"
              className="text-green-400 hover:text-green-300 flex items-center text-sm"
            >
              Voir tout
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          {recentInterventions.length > 0 ? (
            <div className="space-y-4">
              {recentInterventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="border-b border-gray-800 last:border-0 pb-4 last:pb-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Link
                        to={`/interventions/${intervention.id}`}
                        className="text-lg font-medium text-green-400 hover:text-green-300"
                      >
                        {intervention.type}
                      </Link>
                      <p className="text-sm text-gray-400 mt-1">
                        <Link
                          to={`/devices/${intervention.device.id}`}
                          className="hover:text-green-400"
                        >
                          {intervention.device.brand} {intervention.device.model}
                        </Link>
                        {' '} par {' '}
                        <Link
                          to={`/operators/${intervention.operator.id}`}
                          className="hover:text-green-400"
                        >
                          {intervention.operator.full_name}
                        </Link>
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      intervention.status === 'En cours'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : intervention.status === 'Terminé'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {intervention.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(intervention.intervention_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Tool className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune intervention récente</p>
              <Link
                to="/interventions/new"
                className="text-green-400 hover:text-green-300 text-sm mt-2 inline-block"
              >
                Créer une intervention
              </Link>
            </div>
          )}
        </div>

        <div className="dashboard-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Tag className="h-5 w-5 mr-2 text-green-400" />
              Appareils récemment ajoutés
            </h3>
            <Link
              to="/devices"
              className="text-green-400 hover:text-green-300 flex items-center text-sm"
            >
              Voir tout
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          {recentDevices.length > 0 ? (
            <div className="space-y-4">
              {recentDevices.map((device) => (
                <div
                  key={device.id}
                  className="border-b border-gray-800 last:border-0 pb-4 last:pb-0"
                >
                  <Link
                    to={`/devices/${device.id}`}
                    className="text-lg font-medium text-green-400 hover:text-green-300"
                  >
                    {device.brand} {device.model}
                  </Link>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="text-sm text-gray-400">{device.category}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-sm text-gray-400">{device.external_condition}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Ajouté le {new Date(device.entry_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun appareil récent</p>
              <Link
                to="/devices/new"
                className="text-green-400 hover:text-green-300 text-sm mt-2 inline-block"
              >
                Ajouter un appareil
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;