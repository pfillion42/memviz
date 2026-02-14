import { useState, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({ value, onChange, placeholder = 'Rechercher...', debounceMs = 300 }: SearchBarProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) {
        onChange(local);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [local, debounceMs, onChange, value]);

  return (
    <input
      type="search"
      value={local}
      onChange={e => setLocal(e.target.value)}
      placeholder={placeholder}
      aria-label="Recherche"
      style={{
        width: '100%',
        padding: '8px 12px',
        fontSize: '14px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        outline: 'none',
      }}
    />
  );
}
