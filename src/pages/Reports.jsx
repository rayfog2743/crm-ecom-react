import React, { useState } from "react";
import QrPayments from "../pages/QrPayments";
import InventoryManager from "../pages/Sku";
import RouteMap from "../pages/RouteMap";
import OfflineOrders from "../pages/OfflineOrders"; 

const Reports = () => {
  const [activeTab, setActiveTab] = useState("qr");

  const renderComponent = () => {
    switch (activeTab) {
      case "qr":
        return <QrPayments />;    // orders
      case "offline":          // 👉 NEW TAB
        return <OfflineOrders />; 
      case "inventory":
        return <InventoryManager />;
      case "route":
        return <RouteMap />;
      default:
        return <QrPayments />;
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Button group */}
      <div className="flex flex-wrap gap-3 mb-6 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveTab("qr")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "qr"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
          }`}
        >
         Orders
        </button>

          {/* NEW Offline Orders Tab */}
        <button
          onClick={() => setActiveTab("offline")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "offline"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          Offline Orders
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "inventory"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          Inventory Management
        </button>

        <button
          onClick={() => setActiveTab("route")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "route"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          Purchase Details
        </button>
      </div>

      {/* Dynamic content */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {renderComponent()}
      </div>
    </div>
  );
};

export default Reports;
