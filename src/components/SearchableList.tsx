import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface SearchableListItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SearchableListProps {
  items: SearchableListItem[];
  onSelect: (item: SearchableListItem) => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
}

export function SearchableList({
  items,
  onSelect,
  placeholder = 'Search...',
  debounceMs = 300,
  loading = false,
  emptyMessage = 'No items available',
  noResultsMessage = 'No results found',
}: SearchableListProps) {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState<SearchableListItem[]>(items);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() === '') {
        setFiltered(items);
      } else {
        const lower = query.toLowerCase();
        setFiltered(
          items.filter(
            (item) =>
              item.label.toLowerCase().includes(lower) ||
              item.description?.toLowerCase().includes(lower)
          )
        );
      }
      setActiveIndex(-1);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, items, debounceMs]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const enabledItems = filtered.filter((i) => !i.disabled);

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = prev + 1;
            return next >= enabledItems.length ? 0 : next;
          });
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? enabledItems.length - 1 : next;
          });
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < enabledItems.length) {
            onSelect(enabledItems[activeIndex]);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          setQuery('');
          inputRef.current?.blur();
          break;
        }
      }
    },
    [filtered, activeIndex, onSelect]
  );

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (loading) {
    return (
      <div role="status" aria-label="Loading" data-testid="searchable-list-loading">
        <span aria-hidden="true">Loading...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div role="status" data-testid="searchable-list-empty">
        {emptyMessage}
      </div>
    );
  }

  const enabledFiltered = filtered.filter((i) => !i.disabled);

  return (
    <div data-testid="searchable-list">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={filtered.length > 0}
        aria-controls="searchable-list-results"
        aria-activedescendant={
          activeIndex >= 0 ? `item-${enabledFiltered[activeIndex]?.id}` : undefined
        }
        data-testid="searchable-list-input"
      />

      {filtered.length === 0 && query.trim() !== '' ? (
        <div role="status" data-testid="searchable-list-no-results">
          {noResultsMessage}
        </div>
      ) : (
        <ul
          ref={listRef}
          id="searchable-list-results"
          role="listbox"
          data-testid="searchable-list-results"
        >
          {filtered.map((item, index) => {
            const enabledIndex = enabledFiltered.indexOf(item);
            const isActive = enabledIndex === activeIndex;

            return (
              <li
                key={item.id}
                id={`item-${item.id}`}
                role="option"
                aria-selected={isActive}
                aria-disabled={item.disabled}
                data-active={isActive}
                data-testid={`searchable-list-item-${item.id}`}
                onClick={() => {
                  if (!item.disabled) {
                    onSelect(item);
                  }
                }}
              >
                <span>{item.label}</span>
                {item.description && <span>{item.description}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
