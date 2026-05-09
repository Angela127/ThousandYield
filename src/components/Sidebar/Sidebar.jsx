import React from 'react';
import './Sidebar.css';
import {
  LayoutDashboard,
  Sprout,
  Droplets,
  CloudSun,
  Bug,
  Box,
  Warehouse,
  Layers,
  FileText,
  HelpCircle,
  Bell,
  Settings,
  User
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'fields', icon: Sprout, label: 'Fields' },
    { id: 'racks', icon: Layers, label: 'Racks' },
    { id: 'irrigation', icon: Droplets, label: 'Irrigation' },
    { id: 'climate', icon: CloudSun, label: 'Climate' },
    { id: 'pests', icon: Bug, label: 'Pests' },
    { id: 'inventory', icon: Box, label: 'Inventory' },
    { id: 'reports', icon: FileText, label: 'Reports' },
    { id: 'help', icon: HelpCircle, label: 'Help' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Sprout size={35} color="var(--primary-green)" />
        <span>ThousandYield</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={20} />
          <span>Notification</span>
          <span className="badge">2</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'setting' ? 'active' : ''}`}
          onClick={() => setActiveTab('setting')}
        >
          <Settings size={20} />
          <span>Setting</span>
        </button>
        <div className="user-profile">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          <div className="user-info">
            <span className="user-name">Alex Jackson</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
