// Fichier : /app/page.jsx

import Link from "next/link";
// Importation du client Supabase SERVER (à créer dans /lib/supabaseServer.js)
import { createServerClient } from "@/lib/supabaseServer"; 
import { FaBoxes, FaBullhorn } from "react-icons/fa"; // Nécessite npm install react-icons

// Fonction de récupération des données côté serveur
async function getHomeData() {
    // 1. Instanciation du client Supabase côté SERVER
    const supabase = createServerClient(); 
    
    // Récupération de la devise par défaut
    const { data: currencySetting } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'default_currency')
        .single();
    const defaultCurrency = currencySetting?.value || 'XOF';
    // 2. Récupération des produits en vedette
    const productsResult = await supabase
        .from("products")
        .select("id, name, price, images")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(10);

    // 3. Récupération des publicités actives (plusieurs pour sélection aléatoire)
    const { data: activeAds } = await supabase
        .from("ads")
        .select("id, title, description, target_url, image, current_views, max_views")
        .eq("is_active", true)
        .lt("current_views", "max_views") // CORRECTION : Utilisation correcte de .lt()
        .order("created_at", { ascending: false });

    // 4. Sélection aléatoire d'une publicité
    let featuredAd = null;
    if (activeAds && activeAds.length > 0) {
        const randomIndex = Math.floor(Math.random() * activeAds.length);
        featuredAd = activeAds[randomIndex];
        
        // 5. Mise à jour du compteur de vues
        if (featuredAd) {
            await supabase
                .from("ads")
                .update({ 
                    current_views: (featuredAd.current_views || 0) + 1 
                })
                .eq("id", featuredAd.id);

            // 6. Enregistrement de la vue dans ad_views pour le tracking détaillé
            // Note: Nous aurions besoin de l'ID utilisateur si connecté
            await supabase
                .from("ad_views")
                .insert([
                    {
                        ad_id: featuredAd.id,
                        viewed_at: new Date().toISOString()
                        // user_id serait ajouté si l'utilisateur est connecté
                    }
                ]);
        }
    }

    return { 
        featuredProducts: productsResult.data || [], 
        featuredAd,
        defaultCurrency
    };
}

// Composant pour l'affichage de la publicité
function FeaturedAdDisplay({ ad }) {
    if (!ad) return null;

    return (
        <section className="py-16 px-4 max-w-7xl mx-auto">
            <div className="hero-app text-white shadow-2xl rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
                {/* Background image si disponible */}
                {ad.image && (
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={ad.image} 
                            alt={ad.title}
                            className="w-full h-full object-cover opacity-20"
                        />
                        <div className="absolute inset-0 bg-black opacity-60"></div>
                    </div>
                )}
                
                <div className="relative z-10 flex-1">
                    <h3 className="text-3xl md:text-4xl font-bold mb-3">
                        {ad.title}
                    </h3>
                    <p className="text-lg mb-6 opacity-90 max-w-2xl">
                        {ad.description}
                    </p>
                    {/* Indicateur de performance */}
                    <div className="flex items-center gap-4 text-sm opacity-80">
                        <span>
                            {ad.current_views || 0} / {ad.max_views} vues
                        </span>
                        <div className="w-24 bg-white bg-opacity-30 rounded-full h-2">
                            <div 
                                className="bg-[var(--app-orange)] h-2 rounded-full" 
                                style={{ 
                                    width: `${Math.min(((ad.current_views || 0) / ad.max_views) * 100, 100)}%` 
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
                <div className="relative z-10 mt-6 md:mt-0">
                    <Link 
                        href={ad.target_url || "/subscription-plans"} 
                        className="bg-[var(--app-orange)] hover:bg-opacity-90 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition duration-300 min-w-max inline-flex items-center gap-2"
                        onClick={async () => {
                            // Tracking des clics (optionnel - à implémenter côté client)
                        }}
                    >
                        Découvrir
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}

// Composant pour l'état vide des publicités
function EmptyAdState() {
    return (
        <section className="py-16 px-4 max-w-7xl mx-auto">
            <div className="bg-white shadow-lg rounded-3xl p-8 text-center border-l-4 border-[var(--warning)]">
                <FaBullhorn className="text-4xl text-gray-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Aucune publicité active
                </h3>
                <p className="text-gray-500">
                    Revenez plus tard pour découvrir nos offres spéciales.
                </p>
            </div>
        </section>
    );
}

export default async function Home() {
    const { featuredProducts, featuredAd, defaultCurrency } = await getHomeData();

    return (
        <main className="min-h-screen bg-gray-50 text-gray-800">
          
          {/* 1. Hero section */}
          <section className="hero-company pt-32 pb-24 px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-5 tracking-tight">
              ASSOUK
            </h1>
            <h2 className="text-xl md:text-3xl font-light max-w-4xl mx-auto mb-8">
              Votre marketplace locale : Achetez, vendez et faites-vous livrer facilement dans votre ville.
            </h2>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/subscription-plans" className="btn-primary text-lg px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.03]">
                Explorer les plans
              </Link>
              <Link href="/marketplace" className="btn-app text-lg px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.03]">
                Explorer les produits
              </Link>
            </div>
          </section>
    
          {/* 2. Publicité en Vedette (Affichage aléatoire avec tracking) */}
          {featuredAd ? (
            <FeaturedAdDisplay ad={featuredAd} />
          ) : (
            <EmptyAdState />
          )}

          {/* 3. Produits en Vedette (Carrousel Responsive) */}
          <section className="py-16 px-4 max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-[var(--company-blue)]">
              Nos Meilleures Offres du Jour
            </h2>
            {featuredProducts.length > 0 ? (
                // Carrousel avec défilement fluide et cartes stylisées
                <div className="flex overflow-x-scroll space-x-6 pb-6 lg:pb-0 scrollbar-hide">
                    {featuredProducts.map((product) => {
                        const priceFormatted = new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: defaultCurrency,
                            minimumFractionDigits: 0
                        }).format(product.price);
                        
                        return (
                            <div 
                                key={product.id} 
                                className="min-w-[280px] md:min-w-[300px] bg-white shadow-xl rounded-3xl overflow-hidden border border-gray-100 transform hover:shadow-2xl hover:translate-y-[-4px] transition duration-300"
                            >
                                <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
                                    {product.images && product.images.length > 0 ? (
                                        <img 
                                            src={product.images[0]} 
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-gray-400 font-medium">Image du Produit</span>
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="text-xl font-semibold mb-1 truncate">{product.name}</h3>
                                    <p className="text-3xl font-extrabold text-[var(--company-green)] mb-4">{priceFormatted}</p>
                                    <Link 
                                    href={`/marketplace/${product.id}`}
                                    className="block w-full text-center py-3 text-base rounded-xl bg-[var(--company-orange)] text-white font-medium hover:bg-opacity-90 transition shadow-md"
                                    >
                                    Voir le produit
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // État vide pour les produits
                <div className="bg-white shadow-lg rounded-3xl p-8 text-center border-l-4 border-[var(--warning)]">
                    <FaBoxes className="text-4xl text-gray-400 mx-auto mb-3" />
                    <p className="text-xl font-semibold text-gray-600">
                        Aucun produit en vedette à afficher pour le moment.
                    </p>
                </div>
            )}

            {/* Bouton pour voir plus de produits */}
            <div className="text-center mt-12">
                <Link href="/marketplace" className="text-lg font-semibold text-[var(--company-blue)] hover:text-[var(--company-green)] transition duration-300 border-b-2 border-transparent hover:border-[var(--company-blue)]">
                    Voir tous les produits &rarr;
                </Link>
            </div>
          </section>
          {/* 4. Features (Design 'Carte' moderne conservé) */}
          <section className="py-16 px-4 max-w-7xl mx-auto grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white shadow-xl rounded-3xl p-8 border-t-4 border-[var(--company-blue)]">
              <h3 className="text-2xl font-bold mb-3 text-[var(--company-blue)]">Vendez facilement</h3>
              <p className="text-gray-600">Publiez vos produits en quelques clics grâce à notre interface intuitive et optimisée pour les vendeurs.</p>
            </div>
            <div className="bg-white shadow-xl rounded-3xl p-8 border-t-4 border-green-600">
              <h3 className="text-2xl font-bold mb-3 text-green-600">Livraison rapide</h3>
              <p className="text-gray-600">Profitez d'un réseau de livreurs indépendants pour des livraisons rapides et sécurisées chez vos clients.</p>
            </div>
            <div className="bg-white shadow-xl rounded-3xl p-8 border-t-4 border-yellow-500">
              <h3 className="text-2xl font-bold mb-3 text-yellow-500">Accessible</h3>
              <p className="text-gray-600">Une plateforme simple, rapide et entièrement mobile-friendly pour une expérience utilisateur sans faille.</p>
            </div>
          </section>
    
          {/* 5. Call to action */}
          <section className="hero-company py-20 text-center mt-12 mb-0">
            <h2 className="text-4xl font-bold mb-4">Rejoignez Assouk dès aujourd&apos;hui</h2>
            <p className="text-xl mb-8 opacity-95 max-w-3xl mx-auto">Créez un compte gratuit et commencez à vendre ou commander sur votre marché local.</p>
            <Link href="/signup" className="btn-primary text-lg px-8 py-4 rounded-full font-bold shadow-2xl hover:opacity-90 transition duration-300">
              S&apos;inscrire maintenant
            </Link>
          </section>
        </main>
      );
}