import React, { useState, useMemo } from 'react';
import { useElectricityContext } from '../../context/ElectricityContext';
import { Lightbulb, Thermometer, Droplets, Settings, ArrowLeft, ChevronRight } from 'lucide-react';

const CATEGORY_ICONS = {
  lighting: Lightbulb,
  climate: Thermometer,
  water: Droplets,
  system: Settings,
};

const DeviceTable = () => {
  const { deviceRegistry, updateDevice } = useElectricityContext();
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const groups = useMemo(() => {
    const groupMap = {};
    Object.keys(deviceRegistry).forEach(id => {
      const device = deviceRegistry[id];
      const gId = device.groupId || 'misc';
      const gName = device.groupName || 'Other Devices';
      const gCat = device.category || 'system';

      if (!groupMap[gId]) {
        groupMap[gId] = {
          id: gId,
          name: gName,
          category: gCat,
          devices: [],
          totalWatts: 0,
          status: 'on'
        };
      }
      groupMap[gId].devices.push({ id, ...device });
      groupMap[gId].totalWatts += device.watts_live;
      if (device.status === 'breached') groupMap[gId].status = 'breached';
      else if (device.status === 'warning' && groupMap[gId].status !== 'breached') groupMap[gId].status = 'warning';
    });
    return Object.values(groupMap);
  }, [deviceRegistry]);

  const handleThresholdChange = (id, e) => {
    const val = Number(e.target.value);
    if (!isNaN(val) && val > 0) {
      updateDevice(id, { watts_threshold: val });
    }
  };

  const handleToggle = (id, currentStatus) => {
    updateDevice(id, { status: currentStatus === 'off' ? 'on' : 'off' });
  };

  if (!selectedGroupId) {
    return (
      <div className="device-grid">
        {groups.map(group => {
          const Icon = CATEGORY_ICONS[group.category] || Settings;
          const activeCount = group.devices.filter(d => d.status !== 'off').length;
          
          return (
            <div 
              key={group.id} 
              className={`group-card ${group.status}`}
              onClick={() => setSelectedGroupId(group.id)}
            >
              <div className="group-card-header">
                <div className={`group-icon-wrapper ${group.category}`}>
                  <Icon size={24} />
                </div>
                <div className="group-info">
                  <h3>{group.name}</h3>
                  <p>{activeCount} / {group.devices.length} Devices Active</p>
                </div>
                <ChevronRight className="drill-down-arrow" />
              </div>
              <div className="group-card-body">
                <div className="group-metric">
                  <span className="metric-label">Power Usage</span>
                  <span className="metric-value">{group.totalWatts.toFixed(0)} W</span>
                </div>
                <div className="group-status-pill">
                  <span className={`status-dot ${group.status}`}></span>
                  {group.status === 'on' ? 'Optimal' : group.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const activeGroup = groups.find(g => g.id === selectedGroupId);
  const Icon = CATEGORY_ICONS[activeGroup.category] || Settings;

  return (
    <div className="device-list-view">
      <div className="list-view-header">
        <button className="back-button" onClick={() => setSelectedGroupId(null)}>
          <ArrowLeft size={18} />
          Back to Overview
        </button>
        <div className="active-group-title">
          <Icon size={20} className="category-icon" />
          <h2>{activeGroup.name}</h2>
        </div>
      </div>

      <div className="device-table-container">
        <table className="device-table">
          <thead>
            <tr>
              <th>Device Name</th>
              <th>Live W</th>
              <th>Threshold W</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {activeGroup.devices.map(device => {
              const pct = Math.min(100, (device.watts_live / device.watts_threshold) * 100);
              let barColor = 'safe';
              if (pct >= 80 && pct < 100) barColor = 'warn';
              if (pct >= 100) barColor = 'danger';

              let priorityLabel = device.priority;
              if (device.priority === 'critical') priorityLabel = "Never auto-cut";
              else if (device.auto_cut_at_90) priorityLabel = "Auto-cut at 90%";
              else if (device.priority === 'low') priorityLabel = "Auto-cut at 90%";
              else if (device.priority === 'medium') priorityLabel = "Cut after 30s";
              else if (device.priority === 'high') priorityLabel = "Dim after 60s";

              return (
                <tr key={device.id}>
                  <td className="device-name">{device.name}</td>
                  <td className="live-watts">{device.watts_live.toFixed(1)}</td>
                  <td>
                    <div className="threshold-input-wrapper">
                      <input 
                        type="number" 
                        className="threshold-input" 
                        value={device.watts_threshold}
                        onChange={(e) => handleThresholdChange(device.id, e)}
                      />
                      <span className="threshold-hint">suggested: {device.watts_suggested} W</span>
                    </div>
                  </td>
                  <td>
                    <div className="usage-bar-bg">
                      <div className={`usage-bar-fill ${barColor}`} style={{width: `${pct}%`}} />
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${device.status}`}>{device.status}</span>
                  </td>
                  <td>
                    <div style={{textTransform: 'capitalize', fontWeight: '500'}}>{device.priority}</div>
                    <div className="threshold-hint">{priorityLabel}</div>
                  </td>
                  <td>
                    <button 
                      className="toggle-btn"
                      disabled={device.priority === 'critical'}
                      onClick={() => handleToggle(device.id, device.status)}
                    >
                      {device.status === 'off' ? 'Turn on' : 'Turn off'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeviceTable;
