"use client";
import { useState } from "react";

export default function AutocompleteInput({ value, onChange, options, placeholder, className }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState(options);

  function handleChange(e) {
    const val = e.target.value;
    onChange(val);
    if (!val) {
      setFiltered(options);
    } else {
      setFiltered(options.filter(function (o) { return o.toLowerCase().includes(val.toLowerCase()); }));
    }
    setShowDropdown(true);
  }

  function handleFocus() {
    setFiltered(value ? options.filter(function (o) { return o.toLowerCase().includes(value.toLowerCase()); }) : options);
    setShowDropdown(true);
  }

  function handleBlur() {
    setTimeout(function () { setShowDropdown(false); }, 150);
  }

  function selectOption(opt) {
    onChange(opt);
    setShowDropdown(false);
  }

  return (
    <div className="relative">
<input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        style={{ color: "#151C33", backgroundColor: "#FFFFFF" }}
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 bg-white border border-indigo-950/20 rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
          {filtered.map(function (opt) {
            return (
              <button key={opt} type="button" onClick={() => selectOption(opt)} className="block w-full text-left px-3 py-2 text-sm hover:bg-indigo-950/5">
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}