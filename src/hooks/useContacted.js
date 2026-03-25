import { useState, useCallback } from 'react';

const STORAGE_KEY = 'fa_contacted';

function loadContacted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveContacted(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export default function useContacted() {
  const [contacted, setContacted] = useState(loadContacted);

  const isContacted = useCallback((propertyId) => {
    return contacted.has(propertyId);
  }, [contacted]);

  const toggleContacted = useCallback((propertyId) => {
    setContacted((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) {
        next.delete(propertyId);
      } else {
        next.add(propertyId);
      }
      saveContacted(next);
      return next;
    });
  }, []);

  return { isContacted, toggleContacted };
}
