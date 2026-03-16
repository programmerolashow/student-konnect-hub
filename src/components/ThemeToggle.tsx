import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
};

export default ThemeToggle;
