import React from 'react';
import ReactDOM from 'react-dom/client';
import FamilyTreeApp from "./FamilyTreeApp";
import { ColorProvider } from "./context/ColorContext";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // <React.StrictMode>
    <ColorProvider>
      <FamilyTreeApp />
    </ColorProvider>
  // </React.StrictMode>
);