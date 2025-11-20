'use client';

import { useEffect, useState } from 'react';

export function useSession() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    if (storedRole) {
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  return { role, loading };
}
