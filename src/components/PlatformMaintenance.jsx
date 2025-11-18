// Fichier : components/PlatformMaintenance.jsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FaTools, FaClock, FaStore, FaEnvelope, FaSpinner } from 'react-icons/fa';

export default function PlatformMaintenance() {
  const [adminEmail, setAdminEmail] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer des informations supplémentaires si nécessaire
    const fetchAdminInfo = async () => {
      try {
        // Récupérer un administrateur pour afficher son email de contact
        const { data: adminData, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('role', 'admin')
          .limit(1);

        if (!error && adminData && adminData.length > 0) {
          setAdminEmail(adminData[0].email);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des informations admin:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-[var(--company-blue)] mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* En-tête */}
        <div className="bg-[var(--company-blue)] text-white p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <FaTools className="text-3xl" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">ASSOUK</h1>
          <p className="text-xl opacity-90">Maintenance en cours</p>
        </div>

        {/* Contenu */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Notre plateforme est temporairement indisponible
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Nous effectuons actuellement une maintenance pour améliorer votre expérience. 
              La plateforme sera de retour très bientôt.
            </p>
          </div>

          {/* Informations de maintenance */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-3">
                <FaClock className="text-blue-500 text-xl" />
                <h3 className="font-semibold text-gray-800">Temps estimé</h3>
              </div>
              <p className="text-gray-600">
                Nous travaillons pour rétablir le service au plus vite. 
                Merci de votre patience.
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center gap-3 mb-3">
                <FaStore className="text-green-500 text-xl" />
                <h3 className="font-semibold text-gray-800">Statut</h3>
              </div>
              <p className="text-gray-600">
                Maintenance planifiée - Amélioration des performances et 
                ajout de nouvelles fonctionnalités.
              </p>
            </div>
          </div>

          {/* Contact */}
          {adminEmail && (
            <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center gap-3 mb-3">
                <FaEnvelope className="text-yellow-500 text-xl" />
                <h3 className="font-semibold text-gray-800">Contact d'urgence</h3>
              </div>
              <p className="text-gray-600 mb-2">
                Pour toute urgence, vous pouvez contacter l'administrateur :
              </p>
              <a 
                href={`mailto:${adminEmail}`}
                className="text-[var(--company-blue)] font-medium hover:underline"
              >
                {adminEmail}
              </a>
            </div>
          )}

          {/* Message de remerciement */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-500">
              Merci de votre compréhension et à très bientôt sur <strong>ASSOUK</strong> !
            </p>
          </div>
        </div>

        {/* Pied de page */}
        <div className="bg-gray-50 px-8 py-4 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} ASSOUK. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}