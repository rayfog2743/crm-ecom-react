import React, { useState } from "react";
import OnlineOrders from "../pages/OnlineOrders";
import OfflineOrders from "../pages/OfflineOrders";
import InventoryManager from "../pages/Sku";
import RouteMap from "../pages/RouteMap";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("online");

  const renderComponent = () => {
    switch (activeTab) {
      case "online":
        return <OnlineOrders />;

      case "offline":
        return <OfflineOrders />;

      case "inventory":
        return <InventoryManager />;

      case "route":
        return <RouteMap />;

      default:
        return <OnlineOrders />;
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">

      {/* Main Tabs */}
      <div className="flex flex-wrap gap-3 mb-6 border-b border-gray-200 pb-4">

        {/* Online Orders */}
        <button
          onClick={() => setActiveTab("online")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "online"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-white text-gray-700 border hover:bg-gray-100"
          }`}
        >
          Online Orders
        </button>

        {/* Offline Orders */}
        <button
          onClick={() => setActiveTab("offline")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "offline"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-white text-gray-700 border hover:bg-gray-100"
          }`}
        >
          Offline Orders
        </button>

        {/* Inventory */}
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "inventory"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-white text-gray-700 border hover:bg-gray-100"
          }`}
        >
          Inventory Management
        </button>

        {/* Purchase */}
        <button
          onClick={() => setActiveTab("route")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "route"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-white text-gray-700 border hover:bg-gray-100"
          }`}
        >
          Purchase Details
        </button>
      </div>

      {/* Content */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        {renderComponent()}
      </div>
    </div>
  );
};

export default Reports;
