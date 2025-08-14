import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Building2, Phone, Mail, MapPin, Edit, Trash2, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Client {
  id: string;
  name: string;
  first_name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  expectations: string;
  comments: string;
  created_at: string;
  device_count?: number;
  quote_invoice_count?: number;
  total_amount?: number;
}

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [deviceCategoryFilter, setDeviceCategoryFilter] = useState('');
  const [devices, setDevices] = useState<Array<{ id: number; client_id: number; category: string }>>([]);

  useEffect(() => {
    fetchClients();
    fetchDevices();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients_with_devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Fallback to regular clients table
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        setClients(fallbackData || []);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        setClients([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id, client_id, category')
        .not('client_id', 'is', null);
      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setClients(clients.filter(client => client.id !== id));
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Erreur lors de la suppression du client');
    }
  };

  const filteredClients = clients.filter(client =>
    (client.id.toString().includes(searchTerm) ||
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (!companyFilter || client.company === companyFilter) &&
    (!cityFilter || client.city === cityFilter) &&
    (!deviceFilter || 
      (deviceFilter === 'with_devices' && (client.device_count || 0) > 0) ||
      (deviceFilter === 'without_devices' && (client.device_count || 0) === 0)) &&
    (!deviceCategoryFilter || devices.some(device => 
      device.client_id.toString() === client.id && device.category === deviceCategoryFilter))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Gestion des Clients</h1>
        <Link
          to="/clients/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau Client
        </Link>
      </div>

      <div className="mb-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un client par ID, nom, prénom, email ou entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-bar w-full pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <select
                className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="">Toutes les entreprises</option>
                {Array.from(new Set(clients.map(c => c.company).filter(Boolean))).map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <option value="">Toutes les villes</option>
                {Array.from(new Set(clients.map(c => c.city).filter(Boolean))).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
              >
                <option value="">Tous les clients</option>
                <option value="with_devices">Avec appareils</option>
                <option value="without_devices">Sans appareils</option>
              </select>
            </div>
            <div>
              <select
                className="form-input rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                value={deviceCategoryFilter}
                onChange={(e) => setDeviceCategoryFilter(e.target.value)}
              >
                <option value="">Toutes les catégories d'appareils</option>
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
            <div></div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">
          Chargement des clients...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          {searchTerm ? 'Aucun client trouvé pour cette recherche' : 'Aucun client enregistré'}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <div key={client.id} className="content-card rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-600/20 p-2 rounded-lg">
                    <Building2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{client.first_name} {client.name}</h3>
                    {client.company && <p className="text-sm text-gray-300">{client.company}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/clients/${client.id}/edit`}
                    className="text-gray-400 hover:text-green-400 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Mail className="w-4 h-4" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{client.address || 'Adresse non renseignée'}</span>
                </div>
                {client.device_count !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Monitor className="w-4 h-4" />
                    <span>{client.device_count} appareil{client.device_count > 1 ? 's' : ''}</span>
                  </div>
                )}
                {client.total_amount !== undefined && client.total_amount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span>💰</span>
                    <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(client.total_amount)}</span>
                  </div>
                )}
                </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <Link
                  to={`/clients/${client.id}`}
                  className="text-green-400 hover:text-green-300 text-sm font-medium"
                >
                  Voir les détails →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clients;