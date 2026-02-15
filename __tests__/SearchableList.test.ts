import '@testing-library/jest-dom';
import React from 'react';
import { SearchableList } from '../src/components/SearchableList';
import { act, fireEvent, render, screen } from '@testing-library/react';

interface SearchableListItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

const mockItems: SearchableListItem[] = [
  { id: '1', label: 'Apple', description: 'A red fruit' },
  { id: '2', label: 'Banana', description: 'A yellow fruit' },
  { id: '3', label: 'Cherry', description: 'A small red fruit' },
  { id: '4', label: 'Date', description: 'A sweet fruit' },
];

const mockItemsWithDisabled: SearchableListItem[] = [
  { id: '1', label: 'Apple', description: 'A red fruit' },
  { id: '2', label: 'Banana', description: 'A yellow fruit', disabled: true },
  { id: '3', label: 'Cherry', description: 'A small red fruit' },
];

// Mock scrollIntoView globally since jsdom doesn't support it
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe('SearchableList', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial render', () => {
    it('should render the searchable list with all items', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      expect(screen.getByTestId('searchable-list')).toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-input')).toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-3')).toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-4')).toBeInTheDocument();
    });

    it('should render with default placeholder', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      expect(input).toHaveAttribute('placeholder', 'Search...');
    });

    it('should render with custom placeholder', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect, placeholder: 'Find items...' }));

      const input = screen.getByTestId('searchable-list-input');
      expect(input).toHaveAttribute('placeholder', 'Find items...');
    });

    it('should render input with combobox role', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByRole('combobox');
      expect(input).toBeInTheDocument();
    });

    it('should render list items with option role', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
    });

    it('should set aria-expanded to true when items exist', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('should not have aria-activedescendant initially', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('should render item descriptions when present', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      expect(screen.getByText('A red fruit')).toBeInTheDocument();
      expect(screen.getByText('A yellow fruit')).toBeInTheDocument();
    });

    it('should not render description span when description is absent', () => {
      const onSelect = jest.fn();
      const itemsNoDesc: SearchableListItem[] = [
        { id: '1', label: 'Apple' },
      ];
      render(React.createElement(SearchableList, { items: itemsNoDesc, onSelect }));

      const item = screen.getByTestId('searchable-list-item-1');
      const spans = item.querySelectorAll('span');
      expect(spans).toHaveLength(1);
      expect(spans[0].textContent).toBe('Apple');
    });

    it('should set all items as not active initially', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      mockItems.forEach((item) => {
        const el = screen.getByTestId(`searchable-list-item-${item.id}`);
        expect(el).toHaveAttribute('data-active', 'false');
        expect(el).toHaveAttribute('aria-selected', 'false');
      });
    });
  });

  describe('Loading state', () => {
    it('should render loading indicator when loading is true', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect, loading: true }));

      expect(screen.getByTestId('searchable-list-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should not render the list when loading', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect, loading: true }));

      expect(screen.queryByTestId('searchable-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('searchable-list-input')).not.toBeInTheDocument();
    });

    it('should have proper aria attributes on loading state', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect, loading: true }));

      const loadingDiv = screen.getByTestId('searchable-list-loading');
      expect(loadingDiv).toHaveAttribute('role', 'status');
      expect(loadingDiv).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('Empty state', () => {
    it('should render empty message when items array is empty', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: [], onSelect }));

      expect(screen.getByTestId('searchable-list-empty')).toBeInTheDocument();
      expect(screen.getByText('No items available')).toBeInTheDocument();
    });

    it('should render custom empty message', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: [], onSelect, emptyMessage: 'Nothing here' }));

      expect(screen.getByText('Nothing here')).toBeInTheDocument();
    });

    it('should not render the list when items are empty', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: [], onSelect }));

      expect(screen.queryByTestId('searchable-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('searchable-list-input')).not.toBeInTheDocument();
    });

    it('should have role status on empty message', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: [], onSelect }));

      const emptyDiv = screen.getByTestId('searchable-list-empty');
      expect(emptyDiv).toHaveAttribute('role', 'status');
    });
  });

  describe('Search/filtering with debounce', () => {
    it('should filter items after debounce delay', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.change(input, { target: { value: 'apple' } });

      // Before debounce, all items should still be visible
      expect(screen.getByTestId('searchable-list-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-2')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.getByTestId('searchable-list-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('searchable-list-item-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('searchable-list-item-3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('searchable-list-item-4')).not.toBeInTheDocument();
    });

    it('should filter by description', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.change(input, { target: { value: 'yellow' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.queryByTestId('searchable-list-item-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-2')).toBeInTheDocument();
      expect(screen.queryByTestId('searchable-list-item-3')).not.toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.change(input, { target: { value: 'APPLE' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.getByTestId('searchable-list-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('searchable-list-item-2')).not.toBeInTheDocument();
    });

    it('should show no results message when no items match', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.change(input, { target: { value: 'xyz' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.getByTestId('searchable-list-no-results')).toBeInTheDocument();
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should show custom no results message', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect, noResultsMessage: 'Nothing matched' }));

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.change(input, { target: { value: 'xyz' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.getByText('Nothing matched')).toBeInTheDocument();
    });

    it('should show all items when query is cleared', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.change(input, { target: { value: 'apple' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.queryByTestId('searchable-list-item-2')).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: '' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.getByTestId('searchable-list-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-3')).toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-4')).toBeInTheDocument();
    });

    it('should use custom debounce delay', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect, debounceMs: 500 }));

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.change(input, { target: { value: 'apple' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should still show all items since debounce hasn't completed
      expect(screen.getByTestId('searchable-list-item-2')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Now debounce has completed
      expect(screen.queryByTestId('searchable-list-item-2')).not.toBeInTheDocument();
    });

    it('should debounce multiple rapid inputs', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      fireEvent.change(input, { target: { value: 'a' } });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      fireEvent.change(input, { target: { value: 'ap' } });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      fireEvent.change(input, { target: { value: 'app' } });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Only "Apple" should match "app"
      expect(screen.getByTestId('searchable-list-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('searchable-list-item-2')).not.toBeInTheDocument();
    });

    it('should treat whitespace-only query as empty', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.change(input, { target: { value: '   ' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // All items should still be visible
      expect(screen.getByTestId('searchable-list-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-3')).toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-4')).toBeInTheDocument();
    });

    it('should filter matching both label and description', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.change(input, { target: { value: 'red' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Apple has "A red fruit" and Cherry has "A small red fruit"
      expect(screen.getByTestId('searchable-list-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('searchable-list-item-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('searchable-list-item-3')).toBeInTheDocument();
      expect(screen.queryByTestId('searchable-list-item-4')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard navigation', () => {
    it('should navigate down with ArrowDown', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const item1 = screen.getByTestId('searchable-list-item-1');
      expect(item1).toHaveAttribute('data-active', 'true');
      expect(item1).toHaveAttribute('aria-selected', 'true');
    });

    it('should navigate up with ArrowUp', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      // ArrowUp from -1 should wrap to last item (index 3)
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const item4 = screen.getByTestId('searchable-list-item-4');
      expect(item4).toHaveAttribute('data-active', 'true');
    });

    it('should wrap around when navigating past the last item with ArrowDown', () => {
      const onSelect = jest.fn();
      const shortItems: SearchableListItem[] = [
        { id: '1', label: 'Apple' },
        { id: '2', label: 'Banana' },
      ];
      render(React.createElement(SearchableList, { items: shortItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      // Navigate: -1 -> 0 -> 1 -> 0 (wrap)
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // 0
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // 1
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // 0 (wrap)

      const item1 = screen.getByTestId('searchable-list-item-1');
      expect(item1).toHaveAttribute('data-active', 'true');
    });

    it('should wrap around when navigating past the first item with ArrowUp', () => {
      const onSelect = jest.fn();
      const shortItems: SearchableListItem[] = [
        { id: '1', label: 'Apple' },
        { id: '2', label: 'Banana' },
      ];
      render(React.createElement(SearchableList, { items: shortItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      // Navigate down to first item, then up to wrap
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // 0
      fireEvent.keyDown(input, { key: 'ArrowUp' }); // -1 -> wraps to 1

      const item2 = screen.getByTestId('searchable-list-item-2');
      expect(item2).toHaveAttribute('data-active', 'true');
    });

    it('should select item on Enter when an item is active', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      fireEvent.keyDown(input, { key: 'ArrowDown' }); // select first item
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSelect).toHaveBeenCalledWith(mockItems[0]);
    });

    it('should not select on Enter when no item is active', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should clear query and blur input on Escape', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input') as HTMLInputElement;
      input.focus();

      fireEvent.change(input, { target: { value: 'apple' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(input.value).toBe('');
    });

    it('should skip disabled items in keyboard navigation', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItemsWithDisabled, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      // Enabled items are: Apple (index 0), Cherry (index 1)
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // active index 0 -> Apple
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // active index 1 -> Cherry

      const item3 = screen.getByTestId('searchable-list-item-3');
      expect(item3).toHaveAttribute('data-active', 'true');
    });

    it('should select correct enabled item on Enter with disabled items', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItemsWithDisabled, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      fireEvent.keyDown(input, { key: 'ArrowDown' }); // Apple
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // Cherry
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSelect).toHaveBeenCalledWith(mockItemsWithDisabled[2]); // Cherry
    });

    it('should set aria-activedescendant when navigating', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(input).toHaveAttribute('aria-activedescendant', 'item-1');
    });

    it('should reset active index after filtering', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      // Navigate to an item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(screen.getByTestId('searchable-list-item-1')).toHaveAttribute('data-active', 'true');

      // Type to filter
      fireEvent.change(input, { target: { value: 'banana' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Active index should be reset to -1
      const item2 = screen.getByTestId('searchable-list-item-2');
      expect(item2).toHaveAttribute('data-active', 'false');
    });
  });

  describe('Click selection', () => {
    it('should call onSelect when clicking an enabled item', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const item = screen.getByTestId('searchable-list-item-2');
      fireEvent.click(item);

      expect(onSelect).toHaveBeenCalledWith(mockItems[1]);
    });

    it('should not call onSelect when clicking a disabled item', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItemsWithDisabled, onSelect }));

      const item = screen.getByTestId('searchable-list-item-2');
      fireEvent.click(item);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should set aria-disabled on disabled items', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItemsWithDisabled, onSelect }));

      const disabledItem = screen.getByTestId('searchable-list-item-2');
      expect(disabledItem).toHaveAttribute('aria-disabled', 'true');

      const enabledItem = screen.getByTestId('searchable-list-item-1');
      expect(enabledItem).not.toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Scroll into view', () => {
    it('should scroll active item into view', () => {
      const scrollIntoViewMock = jest.fn();
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      // Mock scrollIntoView on the element that will become active
      const item1 = screen.getByTestId('searchable-list-item-1');
      item1.scrollIntoView = scrollIntoViewMock;

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: 'nearest' });
    });
  });

  describe('aria-expanded', () => {
    it('should set aria-expanded to false when no results', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.change(input, { target: { value: 'nonexistent' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Loading priority over empty', () => {
    it('should show loading state even when items are empty', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: [], onSelect, loading: true }));

      expect(screen.getByTestId('searchable-list-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('searchable-list-empty')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle items without descriptions in filtering', () => {
      const onSelect = jest.fn();
      const itemsNoDesc: SearchableListItem[] = [
        { id: '1', label: 'Apple' },
        { id: '2', label: 'Banana' },
      ];
      render(React.createElement(SearchableList, { items: itemsNoDesc, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.change(input, { target: { value: 'apple' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.getByTestId('searchable-list-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('searchable-list-item-2')).not.toBeInTheDocument();
    });

    it('should handle all items being disabled', () => {
      const onSelect = jest.fn();
      const allDisabled: SearchableListItem[] = [
        { id: '1', label: 'Apple', disabled: true },
        { id: '2', label: 'Banana', disabled: true },
      ];
      render(React.createElement(SearchableList, { items: allDisabled, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      // ArrowDown with all disabled - enabledItems.length is 0, so next (0) >= 0 wraps to 0
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should handle single item list', () => {
      const onSelect = jest.fn();
      const singleItem: SearchableListItem[] = [
        { id: '1', label: 'Apple' },
      ];
      render(React.createElement(SearchableList, { items: singleItem, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSelect).toHaveBeenCalledWith(singleItem[0]);
    });

    it('should handle partial match in label', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      fireEvent.change(input, { target: { value: 'an' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // "Banana" contains "an", "Date" doesn't
      expect(screen.getByTestId('searchable-list-item-2')).toBeInTheDocument();
    });

    it('should render listbox with correct id', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('id', 'searchable-list-results');
    });

    it('should set aria-controls on input', () => {
      const onSelect = jest.fn();
      render(React.createElement(SearchableList, { items: mockItems, onSelect }));

      const input = screen.getByTestId('searchable-list-input');
      expect(input).toHaveAttribute('aria-controls', 'searchable-list-results');
    });

    it('should handle ArrowDown wrapping with single enabled item among disabled', () => {
      const onSelect = jest.fn();
      const items: SearchableListItem[] = [
        { id: '1', label: 'Apple', disabled: true },
        { id: '2', label: 'Banana' },
        { id: '3', label: 'Cherry', disabled: true },
      ];
      render(React.createElement(SearchableList, { items, onSelect }));

      const input = screen.getByTestId('searchable-list-input');

      fireEvent.keyDown(input, { key: 'ArrowDown' }); // 0 (Banana)
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // wraps to 0 (Banana again)

      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalledWith(items[1]); // Banana
    });
  });
});