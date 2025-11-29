import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface ColorScheme {
  male: {
    primary: string; // Main gender indicator color (e.g., bg-blue-500)
    light: string; // Header background color (e.g., bg-blue-100)
  };
  female: {
    primary: string;
    light: string;
  };
  neutral: {
    primary: string;
    light: string;
  };
  connections: {
    parent: {
      border: string;
      background: string;
    };
    child: {
      border: string;
      background: string;
    };
    spouse: {
      border: string;
      background: string;
    };
  };
}

export const DEFAULT_COLOR_SCHEME: ColorScheme = {
  male: {
    primary: "#3b82f6", // blue-500
    light: "#dbeafe", // blue-100
  },
  female: {
    primary: "#ec4899", // pink-500
    light: "#fce7f3", // pink-100
  },
  neutral: {
    primary: "#22c55e", // green-500
    light: "#dcfce7", // green-100
  },
  connections: {
    parent: {
      border: "#93c5fd", // blue-300
      background: "#eff6ff", // blue-50
    },
    child: {
      border: "#86efac", // green-300
      background: "#f0fdf4", // green-50
    },
    spouse: {
      border: "#f9a8d4", // pink-300
      background: "#fdf2f8", // pink-50
    },
  },
};

interface ColorContextType {
  colors: ColorScheme;
  updateColors: (newColors: Partial<ColorScheme>) => void;
  resetToDefaults: () => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

const STORAGE_KEY = "geneaflow-color-scheme";

export const ColorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [colors, setColors] = useState<ColorScheme>(DEFAULT_COLOR_SCHEME);

  // Load colors from localStorage on mount
  useEffect(() => {
    const savedColors = localStorage.getItem(STORAGE_KEY);
    if (savedColors) {
      try {
        const parsed = JSON.parse(savedColors);
        setColors({ ...DEFAULT_COLOR_SCHEME, ...parsed });
      } catch (e) {
        console.error("Failed to load color scheme from localStorage", e);
      }
    }
  }, []);

  // Save colors to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  }, [colors]);

  const updateColors = (newColors: Partial<ColorScheme>) => {
    setColors((prev) => {
      // Deep merge for nested objects
      const merged = { ...prev };

      if (newColors.male) merged.male = { ...prev.male, ...newColors.male };
      if (newColors.female)
        merged.female = { ...prev.female, ...newColors.female };
      if (newColors.neutral)
        merged.neutral = { ...prev.neutral, ...newColors.neutral };
      if (newColors.connections) {
        merged.connections = { ...prev.connections };
        if (newColors.connections.parent) {
          merged.connections.parent = {
            ...prev.connections.parent,
            ...newColors.connections.parent,
          };
        }
        if (newColors.connections.child) {
          merged.connections.child = {
            ...prev.connections.child,
            ...newColors.connections.child,
          };
        }
        if (newColors.connections.spouse) {
          merged.connections.spouse = {
            ...prev.connections.spouse,
            ...newColors.connections.spouse,
          };
        }
      }

      return merged;
    });
  };

  const resetToDefaults = () => {
    setColors(DEFAULT_COLOR_SCHEME);
  };

  return (
    <ColorContext.Provider value={{ colors, updateColors, resetToDefaults }}>
      {children}
    </ColorContext.Provider>
  );
};

export const useColors = () => {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error("useColors must be used within a ColorProvider");
  }
  return context;
};
