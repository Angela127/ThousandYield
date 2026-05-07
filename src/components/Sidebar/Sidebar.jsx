import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import {
  LayoutDashboard,
  Sprout,
  Droplets,
  CloudSun,
  Bug,
  Box,
  Warehouse,
  FileText,
  HelpCircle,
  Bell,
  Settings,
  User,
  Zap
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/virtual-farm', icon: Warehouse, label: 'Virtual Farm' },
    { path: '/fields', icon: Sprout, label: 'Fields' },
    { path: '/irrigation', icon: Droplets, label: 'Irrigation' },
    { path: '/climate', icon: CloudSun, label: 'Climate' },
    { path: '/electricity', icon: Zap, label: 'Electricity' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/help', icon: HelpCircle, label: 'Help' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Sprout size={35} color="var(--primary-green)" />
        <span>ThousandYield</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link
          to="/notifications"
          className={`nav-item ${location.pathname === '/notifications' ? 'active' : ''}`}
        >
          <Bell size={20} />
          <span>Notification</span>
          <span className="badge">2</span>
        </Link>
        <Link
          to="/settings"
          className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
        >
          <Settings size={20} />
          <span>Setting</span>
        </Link>
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
