// Fichier : src/context/CartContext.jsx (VERSION CORRIGÉE AVEC seller_id)

"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  // Recalcule le total à chaque changement du panier
  useEffect(() => {
    const t = cart.reduce((sum, item) => sum + (item.price || item.prix) * item.quantity, 0);
    setTotal(t);
  }, [cart]);

  // Ajouter un produit au panier - CORRIGÉ POUR INCLURE seller_id
  const addToCart = (product, quantityToUse = 1) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      
      if (exists) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + quantityToUse } : p
        );
      }
      
      // CORRECTION: Inclure le seller_id dans l'item du panier
      return [...prev, { 
        ...product, 
        quantity: quantityToUse,
        seller_id: product.seller_id // ← ASSURER que seller_id est inclus
      }];
    });
  };
  
  // Supprimer un produit
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((p) => p.id !== productId));
  };

  // Mettre à jour la quantité
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) return removeFromCart(productId);
    setCart((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, quantity } : p))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{ cart, total, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}