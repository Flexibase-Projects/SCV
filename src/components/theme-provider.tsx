import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
    theme: "light",
    resolvedTheme: "light",
    setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === "undefined") {
        return "light";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export function ThemeProvider({
    children,
    defaultTheme = "light",
    storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
        theme === "system" ? getSystemTheme() : theme
    );

    useEffect(() => {
        const root = window.document.documentElement;
        const nextTheme = theme === "system" ? getSystemTheme() : theme;

        root.classList.remove("light", "dark");
        root.classList.add(nextTheme);
        setResolvedTheme(nextTheme);
    }, [theme]);

    const value = {
        theme,
        resolvedTheme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
        },
    };

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
}
