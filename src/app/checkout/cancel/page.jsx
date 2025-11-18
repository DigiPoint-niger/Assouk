// Fichier : src/app/checkout/cancel/page.jsx

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { FaCircleXmark, FaArrowRight } from "react-icons/fa6"; // J'utilise FaCircleXmark pour l'icône d'erreur

export default function CancelPage() {
    return (
        <Suspense>
            <CancelPageContent />
        </Suspense>
    );
}

function CancelPageContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');
    // Le paramètre 'token' de PayPal peut aussi être présent ici

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="bg-white rounded-2xl p-10 w-full max-w-lg text-center shadow-2xl">
                <FaCircleXmark className="text-6xl text-red-600 mx-auto mb-6" /> 
                <h2 className="text-3xl font-bold mb-4 text-red-700">
                    Paiement Annulé ou Échoué
                </h2>
                <p className="text-lg text-gray-700 mb-8">
                    Votre transaction PayPal a été annulée ou n'a pas pu être finalisée. 
                    <br/>
                    Votre commande (ID : **{orderId ? orderId.substring(0, 8).toUpperCase() : 'Non spécifié'}**) est toujours dans votre historique avec le statut "Annulé" ou "Échoué".
                </p>
                <div className="flex justify-center flex-wrap gap-4">
                    <Link
                        href="/cart"
                        className="btn-primary px-6 py-3 rounded-full font-bold inline-flex items-center hover:shadow-lg transition"
                    >
                        Réessayer le paiement
                    </Link>
                    <Link
                        href="/orders"
                        className="btn-secondary px-6 py-3 rounded-full font-bold inline-flex items-center hover:shadow-lg transition"
                    >
                        Voir mes commandes <FaArrowRight className="ml-2" />
                    </Link>
                </div>
            </div>
        </main>
    );
}
