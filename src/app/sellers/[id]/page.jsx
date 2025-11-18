// Fichier : /app/sellers/[id]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { 
    FaUserTie, 
    FaMapMarkerAlt, 
    FaCheckCircle, 
    FaSpinner, 
    FaStore,
    FaArrowLeft,
    FaShoppingBag,
    FaStar,
    FaComment,
    FaPhone,
    FaEnvelope,
    FaRegStar,
    FaStarHalfAlt
} from "react-icons/fa";

// --- Composant ProductCard ---
const ProductCard = ({ product }) => {
    return (
        <Link 
            href={`/marketplace/${product.id}`}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02] overflow-hidden border border-gray-100"
        >
            <div className="h-48 bg-gray-100 flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <FaShoppingBag className="text-4xl text-[var(--company-blue)] opacity-50" />
                )}
            </div>
            <div className="p-4">
                <h3 className="font-bold text-[var(--app-dark-blue)] mb-2 line-clamp-2">
                    {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                </p>
                <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-[var(--company-orange)]">
                        {product.price} FCFA
                    </span>
                    <span className="text-sm text-gray-500">
                        Stock: {product.stock}
                    </span>
                </div>
            </div>
        </Link>
    );
};

// --- Composant RatingStars ---
const RatingStars = ({ rating, onRatingChange, readonly = false }) => {
    const [hoverRating, setHoverRating] = useState(0);
    
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !readonly && onRatingChange(star)}
                    onMouseEnter={() => !readonly && setHoverRating(star)}
                    onMouseLeave={() => !readonly && setHoverRating(0)}
                    disabled={readonly}
                    className={`${
                        readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
                    } transition-transform duration-200`}
                >
                    {(hoverRating || rating) >= star ? (
                        <FaStar className="text-yellow-400 text-xl" />
                    ) : (
                        <FaRegStar className="text-gray-300 text-xl" />
                    )}
                </button>
            ))}
        </div>
    );
};

// --- Composant ReviewCard ---
const ReviewCard = ({ review }) => {
    return (
        <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <FaUserTie className="text-gray-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">
                            {review.user_name || "Utilisateur Anonyme"}
                        </p>
                        <RatingStars rating={review.rating} readonly />
                    </div>
                </div>
                <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('fr-FR')}
                </span>
            </div>
            <p className="text-gray-700">{review.comment}</p>
        </div>
    );
};

// --- Composant Principal : SellerDetailPage ---
export default function SellerDetailPage() {
    const params = useParams();
    const sellerId = params.id;
    
    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [user, setUser] = useState(null);

    // Calcul de la note moyenne
    const averageRating = reviews.length > 0 
        ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const fetchSellerData = async () => {
        setLoading(true);
        
        try {
            // Récupérer l'utilisateur connecté
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            // Récupérer les informations du vendeur
            const { data: sellerData, error: sellerError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", sellerId)
                .eq("role", "seller")
                .single();

            if (sellerError) {
                console.error("Erreur de récupération du vendeur:", sellerError);
                setError("Vendeur non trouvé.");
                setLoading(false);
                return;
            }

            setSeller(sellerData);

            // Récupérer les produits du vendeur
            const { data: productsData, error: productsError } = await supabase
                .from("products")
                .select("*")
                .eq("seller_id", sellerId)
                .order("created_at", { ascending: false });

            if (productsError) {
                console.error("Erreur de récupération des produits:", productsError);
            } else {
                setProducts(productsData || []);
            }

            // Récupérer les avis sur le vendeur
            await fetchSellerReviews();

        } catch (err) {
            console.error("Erreur générale:", err);
            setError("Une erreur est survenue lors du chargement.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSellerReviews = async () => {
        // Nous allons créer une table 'seller_ratings' pour stocker les avis
        // Si elle n'existe pas encore, vous devrez la créer dans votre base de données
        const { data: reviewsData, error: reviewsError } = await supabase
            .from("seller_ratings")
            .select(`
                *,
                profiles:user_id (name)
            `)
            .eq("seller_id", sellerId)
            .order("created_at", { ascending: false });

        if (reviewsError) {
            console.error("Erreur de récupération des avis:", reviewsError);
            // Si la table n'existe pas, on initialise avec des données vides
            setReviews([]);
        } else {
            // Formater les données pour inclure le nom d'utilisateur
            const formattedReviews = reviewsData.map(review => ({
                ...review,
                user_name: review.profiles?.name || "Utilisateur Anonyme"
            }));
            setReviews(formattedReviews);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        
        if (!user) {
            alert("Veuillez vous connecter pour noter ce vendeur.");
            return;
        }

        if (userRating === 0) {
            alert("Veuillez sélectionner une note.");
            return;
        }

        setSubmittingReview(true);

        try {
            // Insérer l'avis dans la table 'seller_ratings'
            const { error } = await supabase
                .from("seller_ratings")
                .insert([
                    {
                        seller_id: sellerId,
                        user_id: user.id,
                        rating: userRating,
                        comment: userComment,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                console.error("Erreur lors de l'ajout de l'avis:", error);
                alert("Erreur lors de l'ajout de l'avis.");
            } else {
                // Réinitialiser le formulaire
                setUserRating(0);
                setUserComment("");
                // Recharger les avis
                await fetchSellerReviews();
                alert("Votre avis a été ajouté avec succès !");
            }
        } catch (err) {
            console.error("Erreur:", err);
            alert("Une erreur est survenue.");
        } finally {
            setSubmittingReview(false);
        }
    };

    useEffect(() => {
        if (sellerId) {
            fetchSellerData();
        }
    }, [sellerId]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-[80vh]">
                <div className="text-center py-20">
                    <FaSpinner className="animate-spin text-5xl mx-auto text-[var(--company-blue)]" />
                    <p className="mt-4 text-lg text-gray-700">Chargement de la boutique...</p>
                </div>
            </div>
        );
    }

    if (error || !seller) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-[80vh]">
                <div className="text-center py-20 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-lg text-red-600 font-semibold mb-4">
                        {error || "Vendeur non trouvé"}
                    </p>
                    <Link 
                        href="/sellers"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--company-blue)] text-white rounded-lg hover:bg-[var(--app-dark-blue)] transition"
                    >
                        <FaArrowLeft />
                        Retour aux vendeurs
                    </Link>
                </div>
            </div>
        );
    }

    const isVerified = seller.badge === 'verified';

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-[80vh]">
            {/* Bouton retour */}
            <Link 
                href="/sellers"
                className="inline-flex items-center gap-2 mb-6 text-[var(--company-blue)] hover:text-[var(--app-dark-blue)] transition"
            >
                <FaArrowLeft />
                Retour aux vendeurs
            </Link>

            {/* En-tête du vendeur */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                            <img
                                src={seller.avatar_url || "/default-avatar.png"}
                                alt={`Photo de profil de ${seller.name}`}
                                className="w-full h-full object-cover rounded-full"
                            />
                        </div>
                        {isVerified && (
                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                                <FaCheckCircle className="text-2xl text-[var(--success)]" title="Vendeur Vérifié" />
                            </div>
                        )}
                    </div>

                    {/* Informations du vendeur */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                            <h1 className="text-3xl font-bold text-[var(--app-dark-blue)]">
                                {seller.name}
                            </h1>
                            <FaStore className="text-xl text-[var(--company-orange)]" />
                        </div>
                        
                        <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 mb-4">
                            <FaMapMarkerAlt className="text-[var(--company-orange)]" />
                            <p className="text-lg">{seller.city || "Ville non spécifiée"}</p>
                        </div>

                        {/* Note moyenne */}
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                            <div className="flex items-center gap-1">
                                <FaStar className="text-yellow-400" />
                                <span className="font-bold text-lg">{averageRating}</span>
                                <span className="text-gray-500">({reviews.length} avis)</span>
                            </div>
                        </div>

                        <p className="text-gray-700 mb-4 max-w-2xl">
                            {seller.description || "Ce vendeur n'a pas encore de description."}
                        </p>

                        {/* Stats du vendeur */}
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                                <FaShoppingBag className="text-[var(--company-blue)]" />
                                <span className="font-semibold">{products.length} produits</span>
                            </div>
                            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                                <FaStar className="text-yellow-500" />
                                <span className="font-semibold">{averageRating}/5</span>
                            </div>
                            {seller.phone && (
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                                    <FaPhone className="text-gray-600" />
                                    <span className="font-semibold">{seller.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Section produits */}
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold text-[var(--app-dark-blue)] mb-6 flex items-center gap-2">
                        <FaShoppingBag />
                        Produits de la boutique
                    </h2>

                    {products.length === 0 ? (
                        <div className="text-center py-12 bg-gray-100 rounded-lg">
                            <FaShoppingBag className="text-4xl mx-auto text-gray-400 mb-3" />
                            <p className="text-lg text-gray-600 font-semibold">
                                Aucun produit disponible pour le moment.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Section évaluations */}
                <div className="lg:col-span-1">
                    <h2 className="text-2xl font-bold text-[var(--app-dark-blue)] mb-6 flex items-center gap-2">
                        <FaStar />
                        Avis des clients
                    </h2>

                    {/* Formulaire d'évaluation */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
                        <h3 className="font-bold text-lg mb-4">Donnez votre avis</h3>
                        <form onSubmit={handleSubmitReview}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Votre note
                                </label>
                                <RatingStars 
                                    rating={userRating} 
                                    onRatingChange={setUserRating}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Votre commentaire (optionnel)
                                </label>
                                <textarea
                                    value={userComment}
                                    onChange={(e) => setUserComment(e.target.value)}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--company-blue)]"
                                    placeholder="Partagez votre expérience avec ce vendeur..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submittingReview || userRating === 0}
                                className="w-full bg-[var(--company-blue)] text-white py-2 px-4 rounded-lg hover:bg-[var(--app-dark-blue)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submittingReview ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaSpinner className="animate-spin" />
                                        Envoi en cours...
                                    </span>
                                ) : (
                                    "Publier mon avis"
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Liste des avis */}
                    <div className="space-y-4">
                        {reviews.length === 0 ? (
                            <div className="text-center py-8 bg-gray-100 rounded-lg">
                                <FaComment className="text-3xl mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-600">Aucun avis pour le moment.</p>
                                <p className="text-sm text-gray-500">Soyez le premier à noter ce vendeur !</p>
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <ReviewCard key={review.id} review={review} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}