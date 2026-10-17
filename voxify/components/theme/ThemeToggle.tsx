'use client';

import React from 'react';
import { useTheme } from '@/lib/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

// ThemeToggle retired - Voxify is light mode only
export function ThemeToggle({ showLabel: _showLabel = false, className: _className = '' }: ThemeToggleProps) {
  return null;
}
