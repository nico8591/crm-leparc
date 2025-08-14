import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Edit2, Trash2, Monitor, User } from 'lucide-react';

interface Intervention {
  id: number;
  type: string;
  status: string;
  device_id: number;
  operator_id: number;
  report: string | null;
  difficulty: string | null;
  self_evaluation: string | null;
  intervention_date: string;
  verifier_name: string | null;
  verifier_rating: string | null;
  verification_date: string | null;
  verifier_comments: string | null;
  operator_comments: string | null;
  device: {
    id: number;
    brand: string;
    model: string;
    category: string;
  } | null;
  operator: {
    id: number;
    full_name: string;
  } | null;
}

const InterventionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntervention();
  }, [id]);

  const fetchIntervention = async () => {
    try {
      const { data, error } = await supabase
        .from('interventions')
        .select(`
          *,
          device:devices(id, brand, model, category),
          operator:operators(id, full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setIntervention(data);
    } catch (error) {
      console.error('Error fetching intervention:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/interventions/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('interventions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/interventions');
    } catch (error) {
      console.error('Error deleting intervention:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white">Intervention non trouvée</h2>
        <button
          onClick={() => navigate('/interventions')}
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
            onClick={() => navigate('/interventions')}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-white">
            Intervention {intervention.type}
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
                <dt className="text-sm font-medium text-gray-300">Type</dt>
                <dd className="mt-1 text-sm text-white">{intervention.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">Statut</dt>
                <dd className="mt-1 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    intervention.status === 'En cours'
                      ? 'bg-yellow-900 text-yellow-200'
                      : intervention.status === 'Terminé'
                      ? 'bg-green-900 text-green-200'
                      : 'bg-red-900 text-red-200'
                  }`}>
                    {intervention.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-300">Date d'intervention</dt>
                <dd className="mt-1 text-sm text-white">
                  {new Date(intervention.intervention_date).toLocaleDateString()}
                </dd>
              </div>
              {intervention.difficulty && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Difficulté</dt>
                  <dd className="mt-1 text-sm text-white">{intervention.difficulty}</dd>
                </div>
              )}
              {intervention.self_evaluation && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Auto-évaluation</dt>
                  <dd className="mt-1 text-sm text-white">{intervention.self_evaluation}</dd>
                </div>
              )}
              {intervention.device && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Appareil</dt>
                  <dd className="mt-1 text-sm">
                    <button
                      onClick={() => navigate(`/devices/${intervention.device!.id}`)}
                      className="text-green-400 hover:text-green-300 underline flex items-center space-x-1"
                    >
                      <Monitor className="h-4 w-4" />
                      <span>{intervention.device.brand} {intervention.device.model}</span>
                    </button>
                    <p className="text-xs text-gray-400 mt-1">{intervention.device.category}</p>
                  </dd>
                </div>
              )}
              {intervention.operator && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Opérateur</dt>
                  <dd className="mt-1 text-sm">
                    <button
                      onClick={() => navigate(`/operators/${intervention.operator!.id}`)}
                      className="text-green-400 hover:text-green-300 underline flex items-center space-x-1"
                    >
                      <User className="h-4 w-4" />
                      <span>{intervention.operator.full_name}</span>
                    </button>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">Vérification</h2>
            <dl className="space-y-4">
              {intervention.verifier_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Vérificateur</dt>
                  <dd className="mt-1 text-sm text-white">{intervention.verifier_name}</dd>
                </div>
              )}
              {intervention.verifier_rating && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Évaluation du vérificateur</dt>
                  <dd className="mt-1 text-sm text-white">{intervention.verifier_rating}</dd>
                </div>
              )}
              {intervention.verification_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-300">Date de vérification</dt>
                  <dd className="mt-1 text-sm text-white">
                    {new Date(intervention.verification_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {(intervention.report || intervention.operator_comments || intervention.verifier_comments) && (
          <div className="border-t border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Rapports et commentaires</h2>
            <div className="space-y-6">
              {intervention.report && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300">Rapport d'intervention</h3>
                  <p className="mt-1 text-sm text-white whitespace-pre-wrap">{intervention.report}</p>
                </div>
              )}
              {intervention.operator_comments && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300">Commentaires de l'opérateur</h3>
                  <p className="mt-1 text-sm text-white">{intervention.operator_comments}</p>
                </div>
              )}
              {intervention.verifier_comments && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300">Commentaires du vérificateur</h3>
                  <p className="mt-1 text-sm text-white">{intervention.verifier_comments}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterventionDetail;