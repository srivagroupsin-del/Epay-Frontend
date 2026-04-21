import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/* =====================
   TYPES
===================== */
type LoadingContextType = {
    isLoading: boolean;
    showLoader: (message?: string) => void;
    hideLoader: () => void;
    loadingMessage: string;
};

/* =====================
   CONTEXT
===================== */
const LoadingContext = createContext<LoadingContextType>({
    isLoading: false,
    showLoader: () => { },
    hideLoader: () => { },
    loadingMessage: "Loading, please wait...",
});

/* =====================
   PROVIDER
===================== */
export const LoadingProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Loading, please wait...");

    const showLoader = useCallback((message = "Loading, please wait...") => {
        setLoadingMessage(message);
        setIsLoading(true);
    }, []);

    const hideLoader = useCallback(() => {
        setIsLoading(false);
    }, []);

    return (
        <LoadingContext.Provider value={{ isLoading, showLoader, hideLoader, loadingMessage }}>
            {children}
        </LoadingContext.Provider>
    );
};

/* =====================
   HOOK
===================== */
export const useLoading = () => useContext(LoadingContext);
