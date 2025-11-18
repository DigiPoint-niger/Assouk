// Fichier : src/app/cart/page.jsx

"use client";

import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaShoppingCart, FaTrashAlt, FaMinus, FaPlus } from "react-icons/fa";

export default function CartPage() {
  const { cart, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const { formatPrice } = useCurrency(); // Utiliser la fonction de formatage du contexte
  const router = useRouter();

  // Fonction pour gérer la navigation vers le paiement
  const handleCheckout = () => {
    // Dans une application réelle, vous devriez vérifier ici si l'utilisateur est connecté
    router.push("/checkout");
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-[var(--app-dark-blue)] flex items-center">
          <FaShoppingCart className="mr-4" /> Votre Panier
        </h1>

        {cart.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl shadow-lg">
            <p className="text-2xl text-gray-700 mb-4">
              Votre panier est vide. 😢
            </p>
            <Link
              href="/marketplace"
              className="btn-primary px-6 py-3 rounded-full font-bold inline-block hover:shadow-lg transition"
            >
              Parcourir le marché
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Colonne Gauche : Liste des articles */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center bg-white p-4 rounded-xl shadow-md transition hover:shadow-lg"
                >
                  
                  {/* Image/Détails du produit */}
                  <div className="w-20 h-20 flex-shrink-0 mr-4 rounded-lg overflow-hidden">
                    {item.image ? (
                        <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                            No Image
                        </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <Link 
                        href={`/marketplace/${item.id}`} 
                        className="font-semibold text-lg hover:text-[var(--company-blue)] transition"
                    >
                        {item.name}
                    </Link>
                    <p className="text-gray-600 text-sm">{formatPrice(item.prix)} / unité</p>
                  </div>

                  {/* Contrôle de la quantité */}
                  <div className="flex items-center mx-4 border rounded-full overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 text-[var(--app-orange)] hover:bg-gray-100 disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      <FaMinus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-bold text-lg">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 text-[var(--app-orange)] hover:bg-gray-100 disabled:opacity-50"
                      disabled={item.quantity >= item.stock} // Limite par le stock
                    >
                      <FaPlus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Sous-total et suppression */}
                  <div className="flex flex-col items-end min-w-[100px] ml-4">
                    <p className="font-bold text-xl text-[var(--app-dark-blue)]">
                      {formatPrice(item.prix * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="mt-1 text-red-500 hover:text-red-700 transition"
                      title="Supprimer l'article"
                    >
                      <FaTrashAlt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                onClick={clearCart}
                className="text-red-500 font-semibold hover:underline mt-4"
              >
                Vider tout le panier
              </button>
            </div>

            {/* Colonne Droite : Récapitulatif et Paiement */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-xl sticky top-4">
                <h2 className="text-2xl font-bold mb-4 border-b pb-3 text-[var(--app-dark-blue)]">
                  Récapitulatif de la Commande
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span>Sous-total articles :</span>
                    <span className="font-semibold">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Frais de livraison :</span>
                    <span className="font-semibold text-green-600">Calculé au paiement</span>
                  </div>
                </div>

                <div className="flex justify-between text-2xl font-extrabold border-t pt-4 mt-4 text-[var(--app-orange)]">
                  <span>Total estimé :</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full mt-6 px-6 py-4 rounded-full font-bold btn-primary hover:shadow-xl transition disabled:opacity-50"
                >
                  Passer au Paiement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}