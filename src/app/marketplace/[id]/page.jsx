// Fichier : marketplace/[id]/page.jsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  FaShoppingCart, 
  FaUserTie, 
  FaCheckCircle, 
  FaStar, 
  FaCommentAlt 
} from "react-icons/fa"; 
import supabase from "@/lib/supabase"; 
import { useCart } from "@/context/CartContext"; 
import { useCurrency } from "@/context/CurrencyContext";

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [comments, setComments] = useState([]);
  const [mainImage, setMainImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // --- Ajout commentaire + rating ---
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  // Fetch produit
  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`*, seller:profiles(id,name,badge)`)
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Erreur produit:", error);
        setProduct(null);
      } else {
        setProduct(data);
        if (data?.images?.length > 0) {
          setMainImage(data.images[0]);
        }
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  // Fetch commentaires + notes depuis la vue
  async function fetchComments() {
    setCommentsLoading(true);

    try {
      const { data, error } = await supabase
        .from("comments_with_ratings")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setComments(data);
    } catch (err) {
      console.error("Erreur récupération commentaires:", err);
      setComments([]);
    }

    setCommentsLoading(false);
  }

  useEffect(() => {
    fetchComments();
  }, [id]);

  // Vérifier si l'utilisateur a déjà noté
  useEffect(() => {
    async function checkIfRated() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("product_ratings")
        .select("id")
        .eq("product_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setHasRated(true);
      }
    }
    checkIfRated();
  }, [id]);

  // Ajouter commentaire + rating
  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim() || rating === 0) {
      alert("Veuillez saisir un commentaire et une note.");
      return;
    }

    setAddingComment(true);

    const { data: { user } } = await supabase.auth.getUser(); 
    if (!user) {
      alert("Vous devez être connecté pour commenter.");
      setAddingComment(false);
      return;
    }

    try {
      // commentaire
      const { error: commentError } = await supabase
        .from("comments")
        .insert({
          product_id: id,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (commentError) throw commentError;

      // rating (upsert pour éviter les doublons)
      const { error: ratingError } = await supabase
        .from("product_ratings")
        .upsert({
          product_id: id,
          user_id: user.id,
          rating,
        });

      if (ratingError) throw ratingError;

      setNewComment("");
      setRating(0);
      setHasRated(true);
      await fetchComments();
    } catch (err) {
      console.error("Erreur ajout commentaire/note:", err);
    }

    setAddingComment(false);
  }

  if (loading) return <p className="p-12 text-center text-xl">Chargement du produit...</p>;

  if (!product) return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 text-center py-40">
      <h1 className="text-4xl font-extrabold text-[var(--error)] mb-4">Produit Introuvable</h1>
      <p className="text-xl text-gray-600">Désolé, ce produit n'existe pas ou a été retiré du marché.</p>
      <Link href="/marketplace" className="mt-8 text-lg font-semibold text-[var(--company-blue)] hover:text-[var(--company-green)] transition">
        &larr; Retour à la marketplace
      </Link>
    </div>
  );

  const isSellerVerified = product.seller?.badge === "verified"; 

  const handleAddToCart = () => {
    if (product.stock === 0) return; 
    addToCart({ 
      id: product.id, 
      name: product.name, 
      prix: product.price, 
      stock: product.stock 
    }, quantity);
    setShowQtyModal(false);
    setShowConfirmModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-gray-50">
      
      {/* Retour */}
      <Link href="/marketplace" className="text-[var(--company-blue)] hover:text-[var(--company-green)] mb-6 block font-semibold">
        &larr; Retour à la marketplace
      </Link>

      {/* Produit */}
      <div className="bg-white shadow-2xl rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-8">
        {/* Images */}
        <div className="md:w-1/2 flex flex-col items-center">
          <div className="w-full h-96 mb-4 rounded-2xl overflow-hidden border border-gray-100 shadow-lg">
            <img 
              src={mainImage || product.images?.[0] || "/placeholder.png"} 
              alt={product.name} 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 w-full justify-center">
            {product.images?.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Miniature ${index + 1}`}
                className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition ${
                  mainImage === img ? "border-[var(--company-blue)] scale-105" : "border-transparent opacity-70 hover:opacity-100"
                }`}
                onClick={() => setMainImage(img)}
              />
            ))}
          </div>
        </div>

        {/* Infos */}
        <div className="md:w-1/2 flex flex-col gap-5">
          <h1 className="text-4xl font-extrabold text-[var(--app-dark-blue)]">{product.name}</h1>
          <Link href={`/sellers/${product.seller?.id}`} className="flex items-center gap-2 text-lg font-semibold text-gray-600 hover:text-[var(--company-blue)]">
            <FaUserTie className="text-xl text-[var(--company-green)]" />
            Vendu par : <span className="underline">{product.seller?.name || "Vendeur Inconnu"}</span>
            {isSellerVerified && <FaCheckCircle className="text-base text-[var(--success)]" />}
          </Link>
          <p className="text-5xl font-extrabold text-[var(--company-green)] border-b pb-4 mt-2">
            {formatPrice(product.price)}
          </p>
          <p className={`text-sm font-semibold ${product.stock > 0 ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
            Stock: {product.stock > 0 ? `${product.stock} en stock` : "Indisponible"}
          </p>
          <div>
            <h2 className="text-xl font-bold mb-2 text-[var(--app-dark-blue)]">Description</h2>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>
          <button
            onClick={() => product.stock > 0 && setShowQtyModal(true)}
            disabled={product.stock === 0}
            className={`mt-4 w-full flex items-center justify-center gap-2 text-lg px-8 py-4 rounded-full font-bold shadow-lg transition ${
              product.stock > 0 ? "btn-primary hover:scale-[1.01]" : "bg-gray-400 text-white cursor-not-allowed"
            }`}
          >
            <FaShoppingCart className="text-xl" />
            {product.stock > 0 ? "Ajouter au panier" : "Rupture de Stock"}
          </button>
        </div>
      </div>
      
      {/* Commentaires */}
      <div className="mt-12 bg-white shadow-lg rounded-3xl p-6 md:p-10">
        <h2 className="text-3xl font-bold mb-6 text-[var(--app-dark-blue)]">
          Avis Clients {commentsLoading ? "..." : `(${comments.length})`}
        </h2>

        {commentsLoading ? (
          <p className="text-center py-4 text-gray-500">Chargement des commentaires...</p>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 border-l-4 border-[var(--warning)]">
            <FaCommentAlt className="text-4xl text-gray-400 mx-auto mb-3" />
            <p className="text-xl font-semibold text-gray-500">Aucun commentaire à afficher.</p>
            <p className="text-gray-500 italic mt-2">Soyez le premier à laisser votre avis !</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {comments.map((c) => (
              <div key={c.comment_id} className="border-b border-gray-100 pb-5 last:border-b-0">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-bold text-gray-800">{c.user_name || "Utilisateur Anonyme"}</p>
                  <div className="flex">
                    {[1,2,3,4,5].map((star) => (
                      <FaStar 
                        key={`${c.comment_id}-star-${star}`}
                        className={`text-sm ${c.rating >= star ? "text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-400 ml-auto">
                    {new Date(c.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <p className="text-gray-700 italic bg-gray-50 p-3 rounded-lg">{c.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire ajout (affiché uniquement si pas encore noté) */}
        {!hasRated ? (
          <form onSubmit={handleAddComment} className="mt-6 flex flex-col gap-3">
            {/* étoiles */}
            <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={`star-input-${star}`}
                  className={`cursor-pointer text-2xl ${
                    (hoverRating || rating) >= star ? "text-yellow-400" : "text-gray-300"
                  }`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Écrivez votre avis ici..."
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[var(--company-blue)]"
              rows={3}
            />
            <button
              type="submit"
              disabled={addingComment}
              className="self-end px-6 py-3 rounded-full font-bold btn-primary hover:shadow-md transition disabled:opacity-50"
            >
              {addingComment ? "Publication..." : "Publier mon avis"}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-green-600 font-semibold">
            ✅ Vous avez déjà donné votre avis sur ce produit.
          </p>
        )}
      </div>

      {/* MODAL : Sélection de la quantité */}
      {showQtyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-center">Sélectionner la quantité</h3>
            <p className="mb-2 text-sm text-gray-600">Stock disponible : {product.stock}</p>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), product.stock))}
              className="w-full border p-3 rounded-xl mb-6 text-lg text-center"
            />
            <div className="flex justify-between gap-3">
              <button 
                onClick={() => setShowQtyModal(false)} 
                className="px-5 py-2 rounded-full font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Annuler
              </button>
              <button 
                onClick={handleAddToCart} 
                className="px-5 py-2 rounded-full font-bold btn-primary hover:shadow-lg transition"
              >
                <FaShoppingCart className="inline-block mr-2" />
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : Confirmation d'ajout */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
            <FaCheckCircle className="text-5xl text-[var(--success)] mx-auto mb-4" />
            <p className="text-xl font-semibold mb-6">Produit ajouté au panier !</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-3 rounded-full font-bold bg-[var(--company-blue)] text-white hover:bg-opacity-90 transition shadow-md"
              >
                Continuer mes achats
              </button>
              <button
                onClick={() => router.push("/cart")}
                className="px-5 py-3 rounded-full font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Aller au panier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}