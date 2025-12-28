import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter as Router } from "react-router-dom";
import App from "./App"; // Import the main App component
import "./index.css"; // Import your global styles

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router basename="/">
      <App /> {/* Render App as the main component */}
    </Router>
  </React.StrictMode>
);
