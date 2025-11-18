"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthProvider";

export default function useUser() {
  const { user, getUserProfile, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    async function fetchProfile() {
      setProfileLoading(true);
      setProfileError(null);
      
      try {
        if (user?.id) {
          const p = await getUserProfile(user.id);
          if (mounted) {
            if (p) {
              setProfile(p);
              setProfileError(null);
            } else {
              setProfile(null);
              setProfileError("Profil utilisateur non trouvé");
            }
          }
        } else {
          if (mounted) {
            setProfile(null);
            setProfileError(null);
          }
        }
      } catch (e) {
        console.error('Erreur lors du chargement du profil:', e);
        if (mounted) {
          setProfile(null);
          setProfileError(e.message || "Erreur lors du chargement du profil");
        }
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id, getUserProfile]);

  return { user, profile, loading, profileLoading, profileError };
}
