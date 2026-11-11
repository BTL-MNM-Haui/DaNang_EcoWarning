import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "@goongmaps/goong-js/dist/goong-js.css";
import "./workspace/workspace.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
