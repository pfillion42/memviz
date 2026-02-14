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
        padding: '10px 14px',
        fontSize: '14px',
        backgroundColor: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        outline: 'none',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
      }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--accent-primary)';
        e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'var(--border-default)';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}
