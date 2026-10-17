import React, { useState, useEffect } from 'react';

export function ColorPickerWithHex({ label, value, onChange, description }) {
  const [internalHex, setInternalHex] = useState(value || '#000000');
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setInternalHex(value || '#000000');
  }, [value]);

  const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

  const handleTextChange = (e) => {
    let inputVal = e.target.value.trim();
    if (!inputVal.startsWith('#') && inputVal.length > 0) {
      inputVal = '#' + inputVal;
    }
    setInternalHex(inputVal);

    if (hexRegex.test(inputVal)) {
      setIsValid(true);
      onChange(inputVal.toUpperCase());
    } else {
      setIsValid(false);
    }
  };

  const handlePickerChange = (e) => {
    const newVal = e.target.value.toUpperCase();
    setInternalHex(newVal);
    setIsValid(true);
    onChange(newVal);
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
        {description && <span className="text-[11px] text-slate-400">{description}</span>}
      </div>

      <div className="flex items-center gap-3 mt-1">
        {/* Visual Color Picker input */}
        <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-inner border border-slate-300 flex-shrink-0 cursor-pointer">
          <input
            type="color"
            value={isValid ? internalHex : '#000000'}
            onChange={handlePickerChange}
            className="absolute inset-[-10px] w-16 h-16 cursor-pointer border-0"
          />
        </div>

        {/* HEX text input with validation */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={internalHex}
            onChange={handleTextChange}
            maxLength={7}
            placeholder="#0066FF"
            className={`w-full px-3 py-2 text-sm font-mono font-semibold rounded-lg border focus:outline-none focus:ring-2 uppercase ${
              isValid
                ? 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-800'
                : 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20 text-red-700'
            }`}
          />
          {!isValid && (
            <span className="absolute right-2.5 top-2.5 text-xs text-red-500 font-bold">Invalid</span>
          )}
        </div>
      </div>
    </div>
  );
}
