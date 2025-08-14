import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

interface ClientFormData {
  name: string;
  first_name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  number: string;
  street: string;
  postal_code: string;
  city: string;
  expectations: string;
  comments: string;
}

const initialFormData: ClientFormData = {
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
};

const ClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchClient();
    }
  }, [id]);

  const fetchClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          ...data,
          number: data.number || '',
          street: data.street || '',
          postal_code: data.postal_code || '',
          city: data.city || ''
        });
      }
    } catch (error) {
      console.error('Error fetching client:', error);
      setError('Erreur lors du chargement du client');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Construire l'adresse complète
    const fullAddress = `${formData.number} ${formData.street}, ${formData.postal_code} ${formData.city}`.trim();
    const submitData = {
      ...formData,
      address: fullAddress
    };

    try {
      if (id) {
        const { error } = await supabase
          .from('clients')
          .update(submitData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([submitData]);
        if (error) throw error;
      }

      navigate('/clients');
    } catch (error) {
      console.error('Error saving client:', error);
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            onClick={()=> navigate('/clients')}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-white">
            {id ? 'Modifier le client' : 'Nouveau client'}
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
              <label className="form-label block text-sm font-medium">Nom</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              />
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Prénom</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              />
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Entreprise</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              />
            </div>

            <div>
              <label className="form-label block text-sm font-medium">Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label block text-sm font-medium mb-2">Adresse</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="form-label block text-xs font-medium text-gray-400">Numéro</label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                    placeholder="123"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label block text-xs font-medium text-gray-400">Rue</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                    placeholder="Rue de la Paix"
                  />
                </div>
                <div>
                  <label className="form-label block text-xs font-medium text-gray-400">Code postal</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                    placeholder="75001"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="form-label block text-xs font-medium text-gray-400">Ville</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
                  placeholder="Paris"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="form-label block text-sm font-medium">Attentes</label>
              <textarea
                name="expectations"
                value={formData.expectations}
                onChange={handleChange}
                rows={3}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label block text-sm font-medium">Commentaires</label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows={3}
                className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              />
            </div>
          </div>
        </div>

        <div className="form-section px-6 py-4 border-t border-gray-700 flex justify-end space-x-3 rounded-b-lg bg-black">
          <button
            type="button"
            onClick={() => navigate('/clients')}
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

export default ClientForm;