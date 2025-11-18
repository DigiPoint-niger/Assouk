"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import useUser from "@/hooks/useUser";
import Link from "next/link";

export default function DeliverersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [deliverers, setDeliverers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Redirection si non connecté
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Fetch livreurs
  useEffect(() => {
    async function fetchDeliverers() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "deliverer")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur fetch livreurs:", error.message || error);
        return;
      }
      setDeliverers(data);
      setLoading(false);
    }

    fetchDeliverers();
  }, []);

  // Filtrage recherche
  const filteredDeliverers = deliverers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) {
    return <p className="p-4 text-center">Redirection vers la connexion...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Liste des livreurs</h1>

      <input
        type="text"
        placeholder="Rechercher un livreur..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border p-2 rounded mb-6"
      />

      {loading ? (
        <p>Chargement des livreurs...</p>
      ) : filteredDeliverers.length === 0 ? (
        <p>Aucun livreur trouvé.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeliverers.map((deliverer) => (
            <div key={deliverer.id} className="border p-4 rounded shadow hover:shadow-md transition">
              <h2 className="font-bold text-lg">{deliverer.name}</h2>
              <p className="text-gray-600 mt-1">Badge: {deliverer.badge}</p>
              <div className="flex gap-2 mt-4">
                <Link
                  href={`/dashboard/deliverer/${deliverer.id}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Voir profil
                </Link>
                <Link
                  href={`/messages?to=${deliverer.id}`}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Envoyer un message
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
