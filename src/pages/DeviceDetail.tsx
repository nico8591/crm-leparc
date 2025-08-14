import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getProductCode, getCategoryAbbreviation } from '../utils/categoryUtils';
import { ArrowLeft, Edit2, Trash2, User, PenTool as Tool } from 'lucide-react';

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
  storage_location: string | null;
  product_info_url: string | null;
  tech_specs: string | null;
  safety_precautions: string | null;
  comments: string | null;
  entry_date: string;
  exit_date: string | null;
  operator_id: number | null;
  operator: {
    id: number;
    full_name: string;
  } | null;
}

interface Intervention {
  id: number;
  type: string;
  status: string;
  intervention_date: string;
}

const DeviceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevice();
  }, [id]);

  const fetchDevice = async () => {
    try {
      const [deviceResult, interventionsResult] = await Promise.all([
        supabase
        .from('devices')
        .select(`
          *,
          operator:operators(id, full_name)
        `)
        .eq('id', id)
        .single(),
        supabase
        .from('interventions')
        .select('id, type, status, intervention_date')
        .eq('device_id', id)
        .order('intervention_date', { ascending: false })
      ]);

      if (deviceResult.error) throw deviceResult.error;
      setDevice(deviceResult.data);
      setInterventions(interventionsResult.data || []);
    } catch (error) {
      console.error('Error fetching device:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/devices/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet appareil ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/devices');
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white">Appareil non trouvé</h2>
        <button
          onClick={() => navigate('/devices')}
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
            onClick={() => navigate('/devices')}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-white">
            {device.brand} {device.model}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">Informations générales</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-300">ID</dt>
                <dd className="mt-1 text-sm text-white">#{device.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">Code produit</dt>
                <dd className="mt-1 text-sm text-white">{getProductCode(device.category, device.code)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">Code</dt>
                <dd className="mt-1 text-sm text-white">{device.code}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">Catégorie</dt>
                <dd className="mt-1 text-sm text-white">{device.category} ({getCategoryAbbreviation(device.category)})</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">État extérieur</dt>
                <dd className="mt-1 text-sm text-white">{device.external_condition}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">Grade</dt>
                <dd className="mt-1 text-sm text-white">{device.grade}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">Fonctionnement</dt>
                <dd className="mt-1 text-sm text-white">{device.functioning}</dd>
              </div>
              {device.product_info_url && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">URL des informations produit</dt>
                  <dd className="mt-1 text-sm">
                    <a
                      href={device.product_info_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 underline break-all"
                    >
                      {device.product_info_url}
                    </a>
                  </dd>
                </div>
              )}
              {device.operator && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Opérateur assigné</dt>
                  <dd className="mt-1 text-sm">
                    <button
                      onClick={() => navigate(`/operators/${device.operator!.id}`)}
                      className="text-green-400 hover:text-green-300 underline flex items-center space-x-1"
                    >
                      <User className="h-4 w-4" />
                      <span>{device.operator.full_name}</span>
                    </button>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">Stockage et dates</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-300">Lieu de stockage</dt>
                <dd className="mt-1 text-sm text-white">{device.storage_location || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">Statut</dt>
                <dd className="mt-1 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    device.in_stock
                      ? 'bg-green-900 text-green-200'
                      : 'bg-red-900 text-red-200'
                  }`}>
                    {device.in_stock ? 'En stock' : 'Hors stock'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">Date d'entrée</dt>
                <dd className="mt-1 text-sm text-white">
                  {new Date(device.entry_date).toLocaleDateString()}
                </dd>
              </div>
              {device.exit_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Date de sortie</dt>
                  <dd className="mt-1 text-sm text-white">
                    {new Date(device.exit_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {(device.tech_specs || device.safety_precautions || device.comments) && (
          <div className="border-t border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Informations techniques</h2>
            <div className="space-y-6">
              {device.tech_specs && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300">Spécifications techniques</h3>
                  <p className="mt-1 text-sm text-white whitespace-pre-wrap">{device.tech_specs}</p>
                </div>
              )}
              {device.safety_precautions && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300">Précautions de sécurité</h3>
                  <p className="mt-1 text-sm text-white">{device.safety_precautions}</p>
                </div>
              )}
              {device.comments && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300">Commentaires</h3>
                  <p className="mt-1 text-sm text-white">{device.comments}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {interventions.length > 0 && (
          <div className="border-t border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <Tool className="h-5 w-5 mr-2" />
              Interventions réalisées
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
                      className="text-green-400 hover:text-green-300 underline font-medium"
                    >
                      {intervention.type}
                    </button>
                    <p className="text-sm text-gray-400 mt-1">
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

export default DeviceDetail;