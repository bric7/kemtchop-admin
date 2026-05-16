import React from "react";
import AdminPanel from "./admin/AdminPanel"; // On importe le chef d'orchestre

function App() {
  // Désormais, App ne gère plus les onglets directement.
  // C'est AdminPanel qui va encapsuler toute la logique (Login + Sidebar + Tabs)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPanel />
    </div>
  );
}

export default App;