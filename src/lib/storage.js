// lib/storage.js
import { supabase } from '@/lib/supabase';

export const uploadProductImage = async (file, productId) => {
  try {
    // Compresser l'image
    const compressedFile = await compressImage(file);
    
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/${Math.random()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, compressedFile);

    if (error) throw error;

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Erreur upload image:', error);
    throw error;
  }
};

export const compressImage = async (file) => {
  const imageCompression = (await import('browser-image-compression')).default;
  
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: file.type,
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Erreur compression:', error);
    throw error;
  }
};

export const deleteProductImages = async (productId, imageUrls) => {
  try {
    // Supprimer toutes les images du produit
    for (const url of imageUrls) {
      const path = url.split('/').pop();
      const { error } = await supabase.storage
        .from('product-images')
        .remove([`${productId}/${path}`]);
      
      if (error) console.error('Erreur suppression image:', error);
    }
  } catch (error) {
    console.error('Erreur suppression images:', error);
  }
};