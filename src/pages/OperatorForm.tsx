import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';

interface OperatorFormData {
  user_id: string;
  full_name: string;
  role: string;
  access_level: string;
}

const initialFormData: OperatorFormData = {
  user_id: '',
  full_name: '',
  role: 'Technicien',
  access_level: 'user',
};

const OperatorForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState<OperatorFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchOperator();
    } else if (user) {
      // Set the current user's ID for new operators
      setFormData(prev => ({
        ...prev,
        user_id: user.id
      }));
    }
  }, [id, user]);

  const fetchOperator = async () => {
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching operator:', error);
      setError('Erreur lors du chargement de l\'opérateur');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (id) {
        const { error } = await supabase
          .from('operators')
          .update(formData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('operators')
          .insert([formData]);
        if (error) throw error;
      }

      navigate('/operators');
    } catch (error) {
      console.error('Error saving operator:', error);
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            onClick={() => navigate('/operators')}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-white">
            {id ? 'Modifier l\'opérateur' : 'Nouvel opérateur'}
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
          <div>
            <label className="form-label block text-sm font-medium">ID Utilisateur</label>
            <input
              type="text"
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              required
              readOnly
            />
            <p className="mt-1 text-sm text-gray-400">
              ID de l'utilisateur connecté (non modifiable)
            </p>
          </div>

          <div>
            <label className="form-label block text-sm font-medium">Nom complet</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="form-label block text-sm font-medium">Rôle</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              required
            >
              <option value="Technicien">Technicien</option>
              <option value="Manager">Manager</option>
              <option value="Administrateur">Administrateur</option>
            </select>
          </div>

          <div>
            <label className="form-label block text-sm font-medium">Niveau d'accès</label>
            <select
              name="access_level"
              value={formData.access_level}
              onChange={handleChange}
              className="form-input mt-1 block w-full rounded-md shadow-sm focus:outline-none bg-black border border-gray-600"
              required
            >
              <option value="user">Utilisateur</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
        </div>

        <div className="form-section px-6 py-4 border-t border-gray-700 flex justify-end space-x-3 rounded-b-lg bg-black">
          <button
            type="button"
            onClick={() => navigate('/operators')}
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

export default OperatorForm;