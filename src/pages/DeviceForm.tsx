import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Upload, FileText, Trash2, Plus, Edit, User } from 'lucide-react';

interface DeviceFormData {
  category: string;
  code: string;
  brand: string;
  model: string;
  external_condition: string;
  grade: string;
  functioning: string;
  storage_location: string;
  in_stock: boolean;
  product_info_url: string;
  tech_specs: string;
  safety_precautions: string;
  comments: string;
  client_id: number | null;
}

interface DeviceFile {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

const initialFormData: DeviceFormData = {
  category: 'Informatique',
  code: 'A',
  brand: '',
  model: '',
  external_condition: 'Bon état',
  grade: 'A',
  functioning: 'NSP',
  storage_location: '',
  in_stock: true,
  product_info_url: '',
  tech_specs: '',
  safety_precautions: '',
  comments: '',
  client_id: null,
};

const DeviceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState<DeviceFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<DeviceFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [clients, setClients] = useState<Array<{ id: number; name: string; first_name: string; company: string | null }>>([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    name: '',
    first_name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    expectations: '',
    comments: '',
  });

  useEffect(() => {
    fetchClients();
    if (id) {
      fetchDevice();
      fetchDeviceFiles();
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

  const fetchDevice = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching device:', error);
      setError('Erreur lors du chargement de l\'appareil');
    }
  };

  const fetchDeviceFiles = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('device_files')
        .select('*')
        .eq('device_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching device files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    setUploadingFile(true);
    try {
      // Créer un FormData pour l'upload
      const formData = new FormData();
      formData.append('file', file);
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('device-files')
        .upload(`${id}/${file.name}`, file);

      if (uploadError) throw uploadError;
      
      // Enregistrer les métadonnées du fichier
      const { error: dbError } = await supabase
        .from('device_files')
        .insert([{
          device_id: parseInt(id),
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: uploadData?.path || `${id}/${file.name}`
        }]);

      if (dbError) throw dbError;
      fetchDeviceFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Erreur lors du téléchargement du fichier');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      // Récupérer les infos du fichier avant suppression
      const { data: fileData } = await supabase
        .from('device_files')
        .select('file_url')
        .eq('id', fileId)
        .single();

      // Supprimer le fichier du storage
      if (fileData?.file_url) {
        await supabase.storage
          .from('device-files')
          .remove([fileData.file_url]);
      }

      // Supprimer l'enregistrement de la base
      const { error } = await supabase
        .from('device_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      fetchDeviceFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Erreur lors de la suppression du fichier');
    }
  };

  const handleSaveClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientFormData])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh clients list and select the new client
      await fetchClients();
      setFormData(prev => ({ ...prev, client_id: data.id }));
      setShowClientForm(false);
      
      // Reset client form
      setClientFormData({
        name: '',
        first_name: '',
        company: '',
        phone: '',
        email: '',
        address: '',
        expectations: '',
        comments: '',
      });
    } catch (error) {
      console.error('Error saving client:', error);
      setError('Erreur lors de l\'enregistrement du client');
    }
  };

  const handleEditClient = () => {
    if (formData.client_id) {
      navigate(`/clients/${formData.client_id}/edit`);
    }
  };

  const handleDeleteClient = async () => {
    if (!formData.client_id || !confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', formData.client_id);

      if (error) throw error;
      
      setFormData(prev => ({ ...prev, client_id: null }));
      await fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      setError('Erreur lors de la suppression du client');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (id) {
        const { error } = await supabase
          .from('devices')
          .update(formData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('devices')
          .insert([formData]);
        if (error) throw error;
      }

      navigate('/devices');
    } catch (error) {
      console.error('Error saving device:', error);
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'client_id' ? (value ? parseInt(value) : null) : value,
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/devices')}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-white">
            {id ? 'Modifier l\'appareil' : 'Nouvel appareil'}
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
              <label className="form-label block text-sm font-medium">Catégorie</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              >
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
              <label className="form-label block text-sm font-medium">Code</label>
              <select
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              >
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Marque</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              />
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Modèle</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              />
            </div>

            <div>
              <label className="form-label block text-sm font-medium">État extérieur</label>
              <select
                name="external_condition"
                value={formData.external_condition}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              >
                <option value="Cassé">Cassé</option>
                <option value="Vétuste">Vétuste</option>
                <option value="Bon état">Bon état</option>
                <option value="Très bon Etat">Très bon état</option>
                <option value="Comme neuf">Comme neuf</option>
              </select>
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Grade</label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              >
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Fonctionnement</label>
              <select
                name="functioning"
                value={formData.functioning}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              >
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
                <option value="NSP">NSP</option>
              </select>
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Client</label>
              <div className="flex items-center space-x-2">
                <select
                  name="client_id"
                  value={formData.client_id || ''}
                  onChange={handleChange}
                  className="form-input mt-1 block flex-1 rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                >
                  <option value="">Aucun client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.name} {client.company ? `(${client.company})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowClientForm(true)}
                  className="mt-1 p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  title="Ajouter un client"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {formData.client_id && (
                  <>
                    <button
                      type="button"
                      onClick={handleEditClient}
                      className="mt-1 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      title="Modifier le client"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteClient}
                      className="mt-1 p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      title="Supprimer le client"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Lieu de stockage</label>
              <input
                type="text"
                name="storage_location"
                value={formData.storage_location}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="form-label block text-sm font-medium">URL des informations produit</label>
            <input
              type="url"
              name="product_info_url"
              value={formData.product_info_url}
              onChange={handleChange}
              className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
            />
          </div>

          <div>
            <label className="form-label block text-sm font-medium">Spécifications techniques</label>
            <textarea
              name="tech_specs"
              value={formData.tech_specs}
              onChange={handleChange}
              rows={4}
              className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
            />
          </div>

          <div>
            <label className="form-label block text-sm font-medium">Précautions de sécurité</label>
            <textarea
              name="safety_precautions"
              value={formData.safety_precautions}
              onChange={handleChange}
              rows={2}
              className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
            />
          </div>

          <div>
            <label className="form-label block text-sm font-medium">Commentaires</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows={2}
              className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="in_stock"
              checked={formData.in_stock}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-white">
              En stock
            </label>
          </div>
        </div>

        {id && (
          <div className="form-section p-6 border-t border-gray-700 bg-black">
            <h3 className="text-lg font-semibold text-white mb-4">Spécifications Techniques</h3>
            
            <div className="mb-4">
              <label className="form-label block text-sm font-medium mb-2">
                Ajouter un fichier
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="form-input flex-1"
                />
                {uploadingFile && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                )}
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Fichiers attachés :</h4>
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{file.file_name}</p>
                        <p className="text-xs text-gray-400">
                          {(file.file_size / 1024).toFixed(1)} KB - {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showClientForm && (
          <div className="form-section p-6 border-t border-gray-700 bg-black">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                Nouveau Client
              </h3>
              <button
                type="button"
                onClick={() => setShowClientForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label block text-sm font-medium">Nom</label>
                <input
                  type="text"
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="form-label block text-sm font-medium">Prénom</label>
                <input
                  type="text"
                  value={clientFormData.first_name}
                  onChange={(e) => setClientFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="form-label block text-sm font-medium">Entreprise</label>
                <input
                  type="text"
                  value={clientFormData.company}
                  onChange={(e) => setClientFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                />
              </div>
              <div>
                <label className="form-label block text-sm font-medium">Téléphone</label>
                <input
                  type="tel"
                  value={clientFormData.phone}
                  onChange={(e) => setClientFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label block text-sm font-medium">Adresse</label>
                <textarea
                  value={clientFormData.address}
                  onChange={(e) => setClientFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setShowClientForm(false)}
                className="px-4 py-2 border border-gray-500 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveClient}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                Enregistrer le client
              </button>
            </div>
          </div>
        )}

        <div className="form-section px-6 py-4 border-t border-gray-700 flex justify-end space-x-3 rounded-b-lg bg-black">
          <button
            type="button"
            onClick={() => navigate('/devices')}
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

export default DeviceForm;