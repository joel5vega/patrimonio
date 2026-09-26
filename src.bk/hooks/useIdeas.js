import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeIdeas } from '../lib/firebase';

export function useIdeas() {
  const { user } = useAuth(); // Obtenemos el usuario del contexto
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no hay usuario logueado (joel5vega@gmail.com), no intentamos leer
    // Esto evita el error de permisos de las reglas de seguridad
    if (!user) {
      setIdeas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeIdeas((data) => {
      setIdeas(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { ideas, loading };
}