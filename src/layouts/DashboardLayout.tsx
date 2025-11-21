import React, { useState } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
// import { DashboardHeader } from '@/components/DashboardHeader';
import DashboardHeader from '@/components/DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onMenuToggle={toggleSidebar}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
        
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};