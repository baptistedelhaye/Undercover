import { createContext, useContext, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const ThemeContext = createContext();

const themePalette = [
  { id: 'dark', label: 'Sombre' },
  { id: 'light', label: 'Clair' },
  { id: 'rose', label: 'Rose' }
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage('party-games-theme', 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const currentIndex = themePalette.findIndex((item) => item.id === theme);
    const nextIndex = (currentIndex + 1) % themePalette.length;
    setTheme(themePalette[nextIndex].id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themePalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
