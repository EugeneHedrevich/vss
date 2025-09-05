import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import PreviousResults from "./components/PreviousResults.jsx"; // <-- new component
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
    console.error("Could not find #root element in index.html");
} else {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<App />} />
                    <Route path="/previousResults" element={<PreviousResults />} />
                </Routes>
            </BrowserRouter>
        </React.StrictMode>
    );
}
