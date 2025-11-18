"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import useUser from "@/hooks/useUser";

export default function MessagesPage() {
  const { profile } = useUser();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    async function fetchConversations() {
      setLoading(true);

      // Récupérer les conversations (distinct users)
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:sender_id(name), receiver:receiver_id(name)")
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setConversations(data);

      setLoading(false);
    }

    fetchConversations();
  }, [profile]);

  if (loading) return <p className="p-4">Chargement des messages...</p>;

  if (!conversations.length) return <p className="p-4">Aucun message pour le moment.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Messagerie</h1>
      <div className="flex flex-col gap-4">
        {conversations.map((msg) => {
          const otherUser = msg.sender_id === profile.id ? msg.receiver : msg.sender;
          return (
            <div key={msg.id} className="p-4 border rounded hover:bg-gray-50 cursor-pointer">
              <p className="font-bold">{otherUser.name}</p>
              <p className="text-gray-600 truncate">{msg.content}</p>
              <p className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString()}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
