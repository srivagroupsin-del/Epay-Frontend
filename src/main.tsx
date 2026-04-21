// import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { RefreshProvider } from "./components/refreshcontext/RefreshContext";
import SessionProvider from "./components/sessionprovider/SessionProvider";
import { LoadingProvider } from "./context/LoadingContext";
import LoadingOverlay from "./components/LoadingOverlay/LoadingOverlay";
import { SuccessPopupProvider } from "./context/SuccessPopupContext";
import { DeleteConfirmProvider } from "./context/DeleteConfirmContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <RefreshProvider>
          <LoadingProvider>
            <SuccessPopupProvider>
              <DeleteConfirmProvider>
                <LoadingOverlay />
                <App />
              </DeleteConfirmProvider>
            </SuccessPopupProvider>
          </LoadingProvider>
        </RefreshProvider>
      </SessionProvider>
    </BrowserRouter>
  // </React.StrictMode>
);
