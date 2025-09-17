import { Sun, Moon } from "lucide-react";
import { UseMode } from "../../hooks/theme/UseMode";

const ThemeToggle = ({ className = "" }) => {
  const [isLight, setIsLight] = UseMode();

  return (
    <div className={`inline-flex items-center ${className}`}>
      <label className="relative inline-flex items-center cursor-pointer">
        {/* Hidden checkbox */}
        <input
          type="checkbox"
          className="sr-only peer"
          checked={isLight}
          onChange={(e) => setIsLight(e.target.checked)}
          aria-label="Toggle theme"
        />

        {/* Toggle background */}
        <div className="relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary">
          {/* Sun icon - visible in light mode */}
          <Sun
            className={`absolute top-1 left-1 w-5 h-5 text-yellow-500 transition-opacity duration-300 ${
              isLight ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Moon icon - visible in dark mode */}
          <Moon
            className={`absolute top-1 right-1 w-5 h-5 text-blue-400 transition-opacity duration-300 ${
              !isLight ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </label>
    </div>
  );
};

export default ThemeToggle;
