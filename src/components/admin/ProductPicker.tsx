'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Plus, X, Loader2 } from 'lucide-react';

export interface PickerProduct {
  _id: string;
  name: string;
  slug?: string;
  price?: number;
  image?: string;
}

interface ProductPickerProps {
  selected: PickerProduct[];
  onChange: (next: PickerProduct[]) => void;
  placeholder?: string;
}

export default function ProductPicker({
  selected,
  onChange,
  placeholder = 'Search products…',
}: ProductPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickerProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced search
  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const sp = new URLSearchParams();
        if (query.trim()) sp.set('q', query.trim());
        sp.set('limit', '15');
        const res = await fetch(`/api/admin/products/search?${sp.toString()}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data?.success) {
          // Exclude already-selected
          const selIds = new Set(selected.map((s) => s._id));
          setResults(
            (data.data.products || []).filter(
              (p: PickerProduct) => !selIds.has(p._id)
            )
          );
        } else {
          setResults([]);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, selected]);

  const addProduct = (p: PickerProduct) => {
    if (selected.some((s) => s._id === p._id)) return;
    onChange([...selected, p]);
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const removeProduct = (id: string) => {
    onChange(selected.filter((s) => s._id !== id));
  };

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((p) => (
            <span
              key={p._id}
              className="inline-flex items-center gap-2 pl-2 pr-1 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs"
            >
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt=""
                  className="w-5 h-5 rounded object-cover"
                />
              )}
              <span className="max-w-[180px] truncate">{p.name}</span>
              <button
                type="button"
                onClick={() => removeProduct(p._id)}
                className="p-1 rounded-full hover:bg-amber-100"
                aria-label="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + dropdown */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm"
          />
        </div>

        {open && (
          <div className="absolute z-30 mt-1 w-full max-h-72 overflow-auto bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg">
            {loading ? (
              <div className="px-3 py-4 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500">
                {query.trim() ? 'No products found' : 'Start typing to search products'}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {results.map((p) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => addProduct(p)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-3"
                    >
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt=""
                          className="w-9 h-9 rounded object-cover flex-none"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded bg-gray-100 dark:bg-gray-700 flex-none" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {p.name}
                        </div>
                        {p.slug && (
                          <div className="text-xs text-gray-500 truncate">
                            /{p.slug}
                          </div>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-amber-600 flex-none" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
