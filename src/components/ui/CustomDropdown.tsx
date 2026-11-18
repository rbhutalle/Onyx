import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function CustomDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder = '— Select —', 
  required = false, 
  disabled = false 
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {required && (
        <input 
          type="text" 
          value={value} 
          required 
          onChange={() => {}} 
          tabIndex={-1} 
          aria-hidden="true"
          className="absolute opacity-0 pointer-events-none h-0 w-0" 
        />
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) px-3.5 py-2 rounded-lg text-xs flex items-center justify-between focus:outline-none focus:border-(--text-primary) ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span className={selectedOption ? 'text-(--text-primary)' : 'text-(--text-muted)'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-(--text-muted) transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Options Popup List */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-(--bg-surface) border border-(--border-main) rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3.5 py-2.5 text-xs text-(--text-muted) italic">No options available</div>
          ) : (
            options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3.5 py-2.5 text-xs cursor-pointer transition-colors ${
                  opt.value === value 
                    ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) font-semibold' 
                    : 'text-(--text-primary) hover:bg-(--accent-subtle)'
                }`}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;