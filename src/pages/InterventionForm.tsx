import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Upload, FileText, Trash2, Plus, User } from 'lucide-react';

interface InterventionFormData {
  type: string;
  device_id: number;
  operator_id: number;
  report: string;
  status: string;
  destination: string;
  operator_comments: string;
  difficulty: string;
  self_evaluation: string;
  verifier_name: string;
  verifier_rating: string;
  verifier_comments: string;
}

interface InterventionFile {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

const initialFormData: InterventionFormData = {
  type: 'Contrôle',
  device_id: 0,
  operator_id: 0,
  report: '',
  status: 'En cours',
  destination: 'Contrôle',
  operator_comments: '',
  difficulty: 'Facile',
  self_evaluation: 'Bon',
  verifier_name: '',
  verifier_rating: 'Bon',
  verifier_comments: '',
};

const InterventionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState<InterventionFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<Array<{ id: number; brand: string; model: string }>>([]);
  const [operators, setOperators] = useState<Array<{ id: number; full_name: string }>>([]);
  const [files, setFiles] = useState<InterventionFile[]>([]);
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
    number: '',
    street: '',
    postal_code: '',
    city: '',
    expectations: '',
    comments: '',
  });

  useEffect(() => {
    fetchDevices();
    fetchOperators();
    fetchClients();
    if (id) {
      fetchIntervention();
      fetchInterventionFiles();
    }
  }, [id]);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id, brand, model');
      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
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
        .select('id, name, first_name, company')
        .order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSaveClient = async () => {
    try {
      const fullAddress = `${clientFormData.number} ${clientFormData.street}, ${clientFormData.postal_code} ${clientFormData.city}`.trim();
      const clientData = {
        ...clientFormData,
        address: fullAddress,
        number: clientFormData.number,
        street: clientFormData.street,
        postal_code: clientFormData.postal_code,
        city: clientFormData.city
      };
      
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;
      
      await fetchClients();
      setShowClientForm(false);
      
      setClientFormData({
        name: '',
        first_name: '',
        company: '',
        phone: '',
        email: '',
        address: '',
        number: '',
        street: '',
        postal_code: '',
        city: '',
        expectations: '',
        comments: '',
      });
    } catch (error) {
      console.error('Error saving client:', error);
      setError('Erreur lors de l\'enregistrement du client');
    }
  };

  const handleEditClient = (clientId: number) => {
    navigate(`/clients/${clientId}/edit`);
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      
      await fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      setError('Erreur lors de la suppression du client');
    }
  };

  const fetchIntervention = async () => {
    try {
      const { data, error } = await supabase
        .from('interventions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching intervention:', error);
      setError('Erreur lors du chargement de l\'intervention');
    }
  };

  const fetchInterventionFiles = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('intervention_files')
        .select('*')
        .eq('intervention_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching intervention files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    setUploadingFile(true);
    try {
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('intervention-files')
        .upload(`${id}/${file.name}`, file);
      
      if (uploadError) throw uploadError;
      
      // Insert file record into database
      const { error: dbError } = await supabase
        .from('intervention_files')
        .insert([{
          intervention_id: parseInt(id),
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: uploadData?.path
        }]);

      if (dbError) throw dbError;
      fetchInterventionFiles();
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
      // Récupérer les infos du fichier
      const { data: fileData } = await supabase
        .from('intervention_files')
        .select('file_url')
        .eq('id', fileId)
        .single();
      const { error } = await supabase
        .from('intervention_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      fetchInterventionFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Erreur lors de la suppression du fichier');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (id) {
        const { error } = await supabase
          .from('interventions')
          .update(formData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('interventions')
          .insert([formData]);
        if (error) throw error;
      }

      navigate('/interventions');
    } catch (error) {
      console.error('Error saving intervention:', error);
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/interventions')}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-white">
            {id ? 'Modifier l\'intervention' : 'Nouvelle intervention'}
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
              <label className="form-label block text-sm font-medium">Type d'intervention</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              >
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
              <label className="form-label block text-sm font-medium">Appareil</label>
              <select
                name="device_id"
                value={formData.device_id}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              >
                <option value="">Sélectionner un appareil</option>
                {devices.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.brand} {device.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Opérateur</label>
              <select
                name="operator_id"
                value={formData.operator_id}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              >
                <option value="">Sélectionner un opérateur</option>
                {operators.map(operator => (
                  <option key={operator.id} value={operator.id}>
                    {operator.full_name}
                  </option>
                ))}
              </select>
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
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
                <option value="Échec">Échec</option>
              </select>
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Destination</label>
              <select
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              >
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
              <label className="form-label block text-sm font-medium">Difficulté</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              >
                <option value="Facile">Facile</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Difficile">Difficile</option>
                <option value="Impossible">Impossible</option>
              </select>
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Auto-évaluation</label>
              <select
                name="self_evaluation"
                value={formData.self_evaluation}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              >
                <option value="Problème">Problème</option>
                <option value="Moyen">Moyen</option>
                <option value="Bon">Bon</option>
                <option value="Très Bon">Très Bon</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="form-label block text-sm font-medium">Rapport</label>
              <textarea
                name="report"
                value={formData.report}
                onChange={handleChange}
                rows={4}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label block text-sm font-medium">Commentaires de l'opérateur</label>
              <textarea
                name="operator_comments"
                value={formData.operator_comments}
                onChange={handleChange}
                rows={3}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              />
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Nom du vérificateur</label>
              <input
                type="text"
                name="verifier_name"
                value={formData.verifier_name}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              />
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Évaluation du vérificateur</label>
              <select
                name="verifier_rating"
                value={formData.verifier_rating}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              >
                <option value="Problème">Problème</option>
                <option value="Moyen">Moyen</option>
                <option value="Bon">Bon</option>
                <option value="Très Bon">Très Bon</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="form-label block text-sm font-medium">Commentaires du vérificateur</label>
              <textarea
                name="verifier_comments"
                value={formData.verifier_comments}
                onChange={handleChange}
                rows={3}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label block text-sm font-medium">Client associé</label>
              <div className="flex items-center space-x-2">
                <select
                  className="form-input mt-1 block flex-1 rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                  value=""
                  onChange={() => {}}
                >
                  <option value="">Sélectionner un client</option>
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
              </div>
            </div>
          </div>
        </div>

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
                <label className="form-label block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                  required
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

        {id && (
          <div className="form-section p-6 border-t border-gray-700 bg-black">
            <h3 className="text-lg font-semibold text-white mb-4">Compte-Rendu d'Intervention</h3>
            
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

        <div className="form-section px-6 py-4 border-t border-gray-700 flex justify-end space-x-3 rounded-b-lg bg-black">
          <button
            type="button"
            onClick={() => navigate('/interventions')}
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

export default InterventionForm;