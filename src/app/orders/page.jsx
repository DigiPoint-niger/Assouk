// Fichier : src/app/orders/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useCurrency } from "@/context/CurrencyContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaBox,
  FaTruck,
  FaCheckCircle,
  FaHourglassEnd,
  FaTimesCircle,
  FaArrowRight,
  FaSpinner,
  FaEye
  } from "react-icons/fa";

// Mappage des statuts aux icônes et couleurs
const STATUS_CONFIG = {
  pending: {
    icon: FaHourglassEnd,
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800",
    description: "Paiement en cours de vérification"
  },
  confirmed: {
    icon: FaCheckCircle,
    label: "Confirmée",
    color: "bg-blue-100 text-blue-800",
    description: "Commande confirmée, préparation en cours"
  },
  delivering: {
    icon: FaTruck,
    label: "En livraison",
    color: "bg-purple-100 text-purple-800",
    description: "Livreur en route"
  },
  delivered: {
    icon: FaCheckCircle,
    label: "Livrée",
    color: "bg-green-100 text-green-800",
    description: "Commande reçue"
  },
  canceled: {
    icon: FaTimesCircle,
    label: "Annulée",
    color: "bg-red-100 text-red-800",
    description: "Commande annulée"
  }
};

// Composant pour afficher une carte de commande
const OrderCard = ({ order, onDetailsClick }) => {
  const { formatPrice } = useCurrency();
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-4 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Commande #{order.id.substring(0, 8).toUpperCase()}
          </h3>
          <p className="text-sm text-gray-500">
            {new Date(order.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.color}`}>
          <StatusIcon className="text-lg" />
          <span className="text-sm font-semibold">{statusConfig.label}</span>
        </div>
      </div>

      <div className="border-t border-b py-3 my-4">
        <p className="text-sm text-gray-600 mb-2">
          <strong>Adresse:</strong> {order.delivery_address}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Téléphone:</strong> {order.delivery_phone}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Montant</p>
          <p className="text-xl font-bold text-gray-800">
            {formatPrice(order.total)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Statut Paiement</p>
          <p className={`text-sm font-semibold ${
            order.payment_status === 'completed' ? 'text-green-600' : 'text-orange-600'
          }`}>
            {order.payment_status === 'completed' ? '✓ Payée' : '⏳ En attente'}
          </p>
        </div>
      </div>

      <button
        onClick={() => onDetailsClick(order.id)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
      >
        <FaEye /> Détails de la Commande <FaArrowRight />
      </button>
    </div>
  );
};

// Page principale de suivi des commandes
export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Redirection si pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/orders");
    }
  }, [user, authLoading, router]);

  // Charger les commandes
  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('orders')
          .select(`
            id,
            client_id,
            seller_id,
            status,
            total,
            currency,
            payment_method,
            payment_status,
            delivery_address,
            delivery_phone,
            created_at,
            order_items(
              id,
              product_id,
              quantity,
              unit_price,
              total_price,
              products(id, name, images)
            )
          `)
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error("Erreur récupération commandes:", error);
          setOrders([]);
        } else {
          setOrders(data || []);
        }
      } catch (err) {
        console.error("Erreur:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Filtrer les commandes par statut
  const filteredOrders = selectedStatus
    ? orders.filter(o => o.status === selectedStatus)
    : orders;

  // Statistiques
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    delivering: orders.filter(o => o.status === 'delivering').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="text-4xl text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Mes Commandes</h1>
          <p className="text-gray-600">Suivi de vos commandes en temps réel</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div
            onClick={() => setSelectedStatus(null)}
            className={`p-4 rounded-lg cursor-pointer transition ${
              selectedStatus === null
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            <p className="text-sm font-semibold">Toutes</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>

          <div
            onClick={() => setSelectedStatus('pending')}
            className={`p-4 rounded-lg cursor-pointer transition ${
              selectedStatus === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            <p className="text-sm font-semibold">En attente</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>

          <div
            onClick={() => setSelectedStatus('confirmed')}
            className={`p-4 rounded-lg cursor-pointer transition ${
              selectedStatus === 'confirmed'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            <p className="text-sm font-semibold">Confirmées</p>
            <p className="text-2xl font-bold">{stats.confirmed}</p>
          </div>

          <div
            onClick={() => setSelectedStatus('delivering')}
            className={`p-4 rounded-lg cursor-pointer transition ${
              selectedStatus === 'delivering'
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            <p className="text-sm font-semibold">En livraison</p>
            <p className="text-2xl font-bold">{stats.delivering}</p>
          </div>

          <div
            onClick={() => setSelectedStatus('delivered')}
            className={`p-4 rounded-lg cursor-pointer transition ${
              selectedStatus === 'delivered'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            <p className="text-sm font-semibold">Livrées</p>
            <p className="text-2xl font-bold">{stats.delivered}</p>
          </div>
        </div>

        {/* Liste des commandes */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-4">
              {selectedStatus 
                ? `Aucune commande avec le statut "${STATUS_CONFIG[selectedStatus]?.label}"`
                : "Vous n'avez pas encore de commandes"
              }
            </p>
            <Link
              href="/marketplace"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Découvrir la Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onDetailsClick={(orderId) => {
                  const order = orders.find(o => o.id === orderId);
                  setSelectedOrder(order);
                  setShowDetails(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Modal de détails */}
        {showDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  Commande #{selectedOrder.id.substring(0, 8).toUpperCase()}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-600 hover:text-gray-800 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Items */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Articles</h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items?.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-semibold">{item.products?.name}</p>
                          <p className="text-sm text-gray-600">
                            Quantité: {item.quantity} × {formatPrice(item.unit_price)}
                          </p>
                        </div>
                        <p className="font-bold">{formatPrice(item.total_price)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adresse de livraison */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Livraison</h3>
                  <p className="text-gray-700">{selectedOrder.delivery_address}</p>
                  <p className="text-gray-700">{selectedOrder.delivery_phone}</p>
                </div>

                {/* Résumé */}
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Total:</span>
                    <span className="font-bold text-lg">{formatPrice(selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Méthode de paiement:</span>
                    <span>{selectedOrder.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Statut:</span>
                    <span className={`font-semibold ${
                      selectedOrder.status === 'delivered' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {STATUS_CONFIG[selectedOrder.status]?.label}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="w-full mt-6 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
