import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";  // Make sure you have global styles if needed

const rootElement = document.getElementById("root");
if (!rootElement) {
    console.error("Could not find #root element in index.html");
} else {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
