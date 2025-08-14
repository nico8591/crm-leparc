import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Edit2, Trash2, Monitor, PenTool as Tool } from 'lucide-react';

interface Operator {
  id: number;
  user_id: string;
  full_name: string;
  role: string;
  access_level: string;
  created_at: string;
}

interface Device {
  id: number;
  brand: string;
  model: string;
  category: string;
}

interface Intervention {
  id: number;
  type: string;
  status: string;
  intervention_date: string;
  device: {
    brand: string;
    model: string;
  };
}

const OperatorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperator();
  }, [id]);

  const fetchOperator = async () => {
    try {
      const [operatorResult, devicesResult, interventionsResult] = await Promise.all([
        supabase
        .from('operators')
        .select('*')
        .eq('id', id)
        .single(),
        supabase
        .from('devices')
        .select('id, brand, model, category')
        .eq('operator_id', id),
        supabase
        .from('interventions')
        .select(`
          id, type, status, intervention_date,
          device:devices(brand, model)
        `)
        .eq('operator_id', id)
        .order('intervention_date', { ascending: false })
      ]);

      if (operatorResult.error) throw operatorResult.error;
      setOperator(operatorResult.data);
      setDevices(devicesResult.data || []);
      setInterventions(interventionsResult.data || []);
    } catch (error) {
      console.error('Error fetching operator:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/operators/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet opérateur ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('operators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/operators');
    } catch (error) {
      console.error('Error deleting operator:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white">Opérateur non trouvé</h2>
        <button
          onClick={() => navigate('/operators')}
          className="mt-4 text-green-400 hover:text-green-300"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

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
            {operator.full_name}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
          >
            <Edit2 className="h-5 w-5" />
            <span>Modifier</span>
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700"
          >
            <Trash2 className="h-5 w-5" />
            <span>Supprimer</span>
          </button>
        </div>
      </div>

      <div className="detail-window rounded-lg shadow-xl">
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-300">Rôle</dt>
              <dd className="mt-1 text-lg text-white">{operator.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-300">Niveau d'accès</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                  operator.access_level === 'admin' 
                    ? 'bg-purple-900 text-purple-200'
                    : operator.access_level === 'manager'
                    ? 'bg-blue-900 text-blue-200'
                    : 'bg-green-900 text-green-200'
                }`}>
                  {operator.access_level}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-300">Date de création</dt>
              <dd className="mt-1 text-lg text-white">
                {new Date(operator.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-300">ID Utilisateur</dt>
              <dd className="mt-1 text-sm font-mono text-white">{operator.user_id}</dd>
            </div>
          </dl>
        </div>

        {devices.length > 0 && (
          <div className="border-t border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Appareils assignés ({devices.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="p-3 bg-black/20 rounded-lg"
                >
                  <button
                    onClick={() => navigate(`/devices/${device.id}`)}
                    className="text-green-400 hover:text-green-300 underline font-medium flex items-center space-x-1"
                  >
                    <Monitor className="h-4 w-4" />
                    {device.brand} {device.model}
                  </button>
                  <p className="text-sm text-gray-400 mt-1">{device.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {interventions.length > 0 && (
          <div className="border-t border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <Tool className="h-5 w-5 mr-2" />
              Interventions réalisées ({interventions.length})
            </h2>
            <div className="space-y-3">
              {interventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="flex justify-between items-center p-3 bg-black/20 rounded-lg"
                >
                  <div>
                    <button
                      onClick={() => navigate(`/interventions/${intervention.id}`)}
                      className="text-green-400 hover:text-green-300 underline font-medium flex items-center space-x-1"
                    >
                      <Tool className="h-4 w-4" />
                      {intervention.type}
                    </button>
                    <p className="text-sm text-gray-400 mt-1">
                      {intervention.device.brand} {intervention.device.model}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(intervention.intervention_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    intervention.status === 'En cours'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : intervention.status === 'Terminé'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {intervention.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorDetail;