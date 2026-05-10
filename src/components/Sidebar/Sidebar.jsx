import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Leaf,
  Waves,
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
  User,
  Bot,
  Camera,
  Zap
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
	{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ to: '/virtual-farm', label: 'Virtual Farm', icon: Sprout},
	{ to: '/fields', label: 'Camera', icon: Camera },
	{ to: '/rack-detail', label: 'Rack Detail', icon: Layers },
	{ to: '/irrigation', label: 'Irrigation', icon: Waves },
	{ to: '/electricity', label: 'Electricity', icon: Zap },
	{ to: '/automation', label: 'Automation', icon: Bot },
	{ to: '/environment', label: 'Environment', icon: CloudSun },
	{ to: '/harvest', label: 'Harvest', icon: Leaf },
	{ to: '/reports', label: 'Reports', icon: FileText },
	{ to: '/notifications', label: 'Notifications', icon: Bell },
	{ to: '/help', label: 'Help', icon: HelpCircle },
	{ to: '/settings', label: 'Settings', icon: Settings },
];

const menuItems = [
	{ path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
	{ path: '/virtual-farm', icon: Warehouse, label: 'Virtual Farm' },
	{ path: '/fields', icon: Camera, label: 'Camera' },
	{ path: '/irrigation', icon: Droplets, label: 'Irrigation' },
	{ path: '/rack-detail', icon: Layers, label: 'Rack Detail' },
	{ path: '/electricity', icon: Zap, label: 'Electricity' },
	{ path: '/environment', icon: CloudSun, label: 'Environment' },
	{ path: '/automation', icon: Bot, label: 'Automation' },
	{ path: '/reports', icon: FileText, label: 'Reports' },
	{ path: '/help', icon: HelpCircle, label: 'Help' },
];

const Sidebar = () => {
	return (
		<aside className="sidebar">
			<div className="sidebar-logo">
				<Sprout size={22} />
				<span>ThousandYield</span>
			</div>

			<nav className="sidebar-nav">
				{navItems.map(({ to, label, icon: Icon, badge }) => (
					<NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
						<Icon size={18} />
						<span>{label}</span>
						{badge ? <span className="badge">{badge}</span> : null}
					</NavLink>
				))}
			</nav>

			<div className="sidebar-footer">
				<div className="user-profile">
					<img src="https://api.dicebear.com/9.x/bottts/svg?seed=ThousandYield" alt="User avatar" />
					<div>
						<div className="user-name">Farm Operator</div>
						<div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>System Online</div>
					</div>
				</div>
			</div>
		</aside>
	);
};

export default Sidebar;
