import React, { useState } from 'react';
import { LayoutDashboard, Warehouse, Camera, Droplets, Layers, Zap, CloudSun, Bot, Bell, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Help.css';

const Help = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const sections = [
    {
      icon: LayoutDashboard,
      title: 'Dashboard',
      desc: 'The central hub for your farm. Monitor high-level metrics and check system status.',
      details: 'The Dashboard provides a bird\'s-eye view of your facility. Here you can see active alerts, weather forecasts, and quick action buttons to trigger irrigation or lighting manual overrides. Use the charts to track historical data over the last 24 hours.'
    },
    {
      icon: Warehouse,
      title: 'Virtual Farm',
      desc: 'A visual layout of your facility. View racks, zones, and drill down into specific areas.',
      details: 'Navigate a visual digital twin of your vertical farm. You can see the spatial layout of your facility, check which racks are occupied, and click on specific zones to see their localized environment conditions.'
    },
    {
      icon: Camera,
      title: 'Camera & Analysis',
      desc: 'Live streams from field cameras. Use AI computer vision to detect plant health and issues.',
      details: 'Access live video feeds from fixed field cameras. Our AI model automatically identifies plants, tracks growth stages, and highlights potential diseases or pest infestations with visual bounding boxes on the stream.'
    },
    {
      icon: Droplets,
      title: 'Irrigation',
      desc: 'Manage water delivery, pH dosing, and EC levels. Set schedules and monitor zone moisture.',
      details: 'Control the water and nutrient delivery system. You can set up automated schedules based on time or soil moisture levels, calibrate pH and EC dosing pumps, and monitor live flow rates across different zones.'
    },
    {
      icon: Layers,
      title: 'Rack Detail',
      desc: 'Granular view of a specific rack. Monitor vertical farming layers and localized environment.',
      details: 'View specific data for a single vertical farming rack. This includes per-layer sensor readings for temperature, humidity, and light intensity, as well as the status of individual growing trays and plant varieties.'
    },
    {
      icon: Zap,
      title: 'Electricity',
      desc: 'Track energy consumption, manage budget limits, and optimize usage during peak hours.',
      details: 'Monitor energy consumption in real-time. Set budget limits to receive alerts when usage is high. View the tariff timeline to see when power is cheapest and schedule heavy equipment accordingly.'
    },
    {
      icon: CloudSun,
      title: 'Environment',
      desc: 'Predictive analytics for climate. View trends for temp, humidity, and nutrient stability.',
      details: 'View 1-hour predictions for atmospheric and hydroponic sensors. Our predictive model alerts you to potential breaches before they happen (e.g., predicted rain or water temp spikes), allowing you to take action early.'
    },
    {
      icon: Bot,
      title: 'Automation',
      desc: 'Create intelligent triggers and actions. Let the system manage HVAC, lighting, and irrigation.',
      details: 'Create "If-This-Then-That" rules for your farm. For example, "If humidity > 70%, then turn on exhaust fan". View a log of all automated actions triggered by the system and active overrides.'
    },
    {
      icon: Bell,
      title: 'Notifications',
      desc: 'Unified view of all system alerts. Filter by source and jump directly to the issue.',
      details: 'The unified inbox for all system alerts. You can filter by source (Environment, Electricity, Irrigation) to find specific issues, or click on any alert to jump directly to the page where you can address the issue.'
    }
  ];

  return (
    <div className="help-container">
      <div className="help-header header-text">
        <h1>User Manual</h1>
        <p>Learn how to use the ThousandYield farm management system. Click a section to see more details.</p>
      </div>

      <div className="help-grid">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isExpanded = expandedIndex === index;
          return (
            <div
              key={index}
              className={`help-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              style={{ cursor: 'pointer' }}
            >
              <div className="help-card-main">
                <div className="help-card-icon">
                  <Icon size={24} />
                </div>
                <div className="help-card-content">
                  <h3>{section.title}</h3>
                  <p>{section.desc}</p>
                </div>
                <div className="help-expand-icon">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="help-card-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="details-content">
                      <hr />
                      <h4>How to use:</h4>
                      <p>{section.details}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="help-footer">
        <h3>Need more support?</h3>
        <p>Contact the engineering team or refer to the full system documentation.</p>
      </div>
    </div>
  );
};

export default Help;
