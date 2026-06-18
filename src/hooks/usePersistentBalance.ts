import { useState } from 'react';
import { getFromLocalStorage, setToLocalStorage } from '@/utilities/localStorage';

export function usePersistentBalance(key: string, defaultValue: boolean = true) {
  const [showBalance, setShowBalance] = useState(() => {
    const stored = getFromLocalStorage(key);
    return stored !== null ? stored : defaultValue;
  });

  const toggleBalance = () => {
    const newValue = !showBalance;
    setShowBalance(newValue);
    setToLocalStorage(key, newValue);
  };

  return { showBalance, toggleBalance };
}
