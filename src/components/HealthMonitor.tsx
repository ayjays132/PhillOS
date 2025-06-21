import React from 'react';

interface Props {
  trends: { cpu: number; memory: number };
}

export const HealthMonitor: React.FC<Props> = ({ trends }) => {
  return (
    <div className="text-xs mt-2">
      <p>Avg CPU: {(trends.cpu * 100).toFixed(1)}%</p>
      <p>Avg Memory: {(trends.memory * 100).toFixed(1)}%</p>
    </div>
  );
};

export default HealthMonitor;
