import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { IconButton } from '../ui/IconButton';

export function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <IconButton label={`Switch to ${next} theme`} onClick={toggleTheme} className={className}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </IconButton>
  );
}
