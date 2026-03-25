import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';

export default function useFeedFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  // Debounce search input → URL param
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput) {
          next.set('search', searchInput);
        } else {
          next.delete('search');
        }
        next.set('page', '1'); // reset page on search change
        return next;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1', 10),
    sort: searchParams.get('sort') || 'score_desc',
    minScore: searchParams.get('min_score') || '',
    incidentType: searchParams.get('incident_type') || '',
    search: searchParams.get('search') || '',
  }), [searchParams]);

  const setFilter = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== 'page') next.set('page', '1');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setPage = useCallback((page) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(page));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
    setSearchInput('');
  }, [setSearchParams]);

  return { filters, setFilter, setPage, resetFilters, searchInput, setSearchInput };
}
