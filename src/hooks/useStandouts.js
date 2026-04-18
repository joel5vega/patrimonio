import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeStandouts } from '../lib/firebase';

export function useStandouts() {
  const { user } = useAuth();
  const [standouts, setStandouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStandouts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeStandouts((data) => {
      setStandouts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { standouts, loading };
}