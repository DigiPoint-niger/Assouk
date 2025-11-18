// Fichier : marketplace/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { FaBoxes } from "react-icons/fa"; 
import { useCurrency } from "@/context/CurrencyContext";

// Composant pour afficher une carte produit stylisée
const ProductCard = ({ product }) => {
    const { formatPrice } = useCurrency();
    const [imageError, setImageError] = useState(false);
    
    // Déterminer l'image à afficher
    const imageUrl = (() => {
        if (imageError) return null;
        
        if (Array.isArray(product.images) && product.images.length > 0) {
            return product.images[0];
        }
        if (typeof product.images === 'string') {
            return product.images;
        }
        return null;
    })();
    
    return (
        <Link 
            href={`/marketplace/${product.id}`} 
            className="min-w-full bg-white shadow-xl rounded-3xl overflow-hidden border border-gray-100 transform hover:shadow-2xl hover:translate-y-[-4px] transition duration-300 flex flex-col"
        >
            {/* Image/Placeholder */}
            {imageUrl && !imageError ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  onError={() => setImageError(true)}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 font-medium text-center px-4">
                        {imageError ? "Image non disponible" : "Aucune image"}
                    </span>
                </div>
              )}
            
            {/* Contenu de la carte */}
            <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-xl font-semibold mb-1 truncate text-gray-800">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                <p className="text-2xl font-extrabold text-[var(--company-green)] mt-auto mb-4">
                    {formatPrice(product.price || 0)}
                </p>
                
                <div 
                  className="block w-full text-center py-3 text-base rounded-xl bg-[var(--company-orange)] text-white font-medium hover:bg-opacity-90 transition shadow-md"
                >
                  Voir le produit
                </div>
            </div>
        </Link>
    );
};

export default function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Récupérer les produits depuis Supabase
  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from("products").select("id, name, description, price, images, seller_id, created_at");

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) {
          console.error("Erreur de récupération des produits:", error);
          setProducts([]);
      } else {
          setProducts(data || []);
      }
    } catch (err) {
      console.error("Erreur unexpected:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les catégories
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    const { data, error } = await supabase.from("categories").select("id, name");
    
    if (error) {
        console.error("Erreur de récupération des catégories:", error);
        setCategories([]);
    } else {
        setCategories(data);
    }
    setCategoriesLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Déclenche la recherche avec un debounce de 500ms
    const handler = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
    
  }, [selectedCategory, search]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-[var(--app-dark-blue)]">
        Explorer le Marché
      </h1>

      {/* Barre de recherche & Filtres */}
      <div className="flex flex-col md:flex-row items-stretch gap-4 mb-10 bg-white p-5 rounded-2xl shadow-lg">
        {/* Champ de recherche */}
        <input
          type="text"
          placeholder="Rechercher par nom de produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-2 border-gray-200 focus:border-[var(--company-blue)] rounded-xl px-4 py-3 flex-1 transition duration-300"
        />

        {/* Sélecteur de catégorie */}
        {categoriesLoading ? (
            <div className="w-full md:w-auto bg-gray-100 rounded-xl px-4 py-3 animate-pulse text-gray-500 flex items-center justify-center">
                Chargement...
            </div>
        ) : categories.length === 0 ? (
            <div className="w-full md:w-auto bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500 flex items-center justify-center border-l-4 border-[var(--warning)]">
                Aucune catégorie à afficher
            </div>
        ) : (
            <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="border-2 border-gray-200 focus:border-[var(--company-blue)] rounded-xl px-4 py-3 bg-white w-full md:w-auto transition duration-300 cursor-pointer"
            >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>
        )}
      </div>

      {/* Affichage des Produits */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white shadow-xl rounded-3xl h-80"></div>
            ))}
        </div>
      ) : products.length === 0 ? (
        // Message d'état vide pour les produits
        <div className="text-center py-20 bg-white rounded-3xl shadow-lg border-l-4 border-[var(--warning)]">
            <FaBoxes className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-2xl font-semibold text-gray-500">
                Aucun produit à afficher ne correspond à vos critères.
            </p>
            <button 
                onClick={() => { setSearch(''); setSelectedCategory(null); }}
                className="mt-6 text-white px-6 py-3 rounded-full font-semibold btn-app hover:opacity-90 transition"
            >
                Effacer les filtres
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}