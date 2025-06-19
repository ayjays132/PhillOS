
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Settings, Files, BotMessageSquare, LayoutGrid, MonitorPlay, Mail, BrainCircuit } from 'lucide-react';
import { StatusBar } from './components/StatusBar';
import { Dock } from './components/Dock';
import { MobileBottomNavigationBar } from './components/MobileBottomNavigationBar';
import { HomeDashboard } from './components/HomeDashboard';
import { PlaceholderAppView } from './components/PlaceholderAppView';
import { AgentConsole } from './components/AgentConsole';
import { OnboardingStepper } from './components/onboarding/OnboardingStepper';
import { ConversationalSettingsView } from './components/settings/ConversationalSettingsView';
import { useResponsive } from './hooks/useResponsive';
import { useDeviceType } from './hooks/useDeviceType';
import { useOnboarding } from './hooks/useOnboarding';
import { NavItem } from './types';

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', path: '/home', icon: LayoutGrid },
  { id: 'copilot', label: 'AI CoPilot', path: '/copilot', icon: BotMessageSquare },
  { id: 'agent', label: 'Agent', path: '/agent', icon: BrainCircuit },
  { id: 'files', label: 'Files', path: '/files', icon: Files },
  { id: 'mail', label: 'Mail', path: '/mail', icon: Mail },
  { id: 'gaming', label: 'Gaming', path: '/gaming', icon: MonitorPlay },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
];

const App: React.FC = () => {
  const { isMobileLayout } = useResponsive();
  const { deviceType } = useDeviceType();
  const { isOnboardingComplete } = useOnboarding();
  const location = useLocation();


  if (!isOnboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  
  // If onboarding is complete and user tries to access /onboarding, redirect to home
  if (isOnboardingComplete && location.pathname === '/onboarding') {
    return <Navigate to="/home" replace />;
  }

  const showChrome = location.pathname !== '/onboarding';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 text-white/90">
      {showChrome && <StatusBar />}
      <main className={`flex-grow overflow-y-auto ${showChrome ? `p-3 pt-0 sm:p-4 ${isMobileLayout && deviceType === 'mobile' ? 'pb-20' : 'pb-4'}` : 'p-0'}`}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingStepper />} />
          <Route path="/" element={isOnboardingComplete ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />} />
          <Route path="/home" element={<HomeDashboard />} />
          <Route path="/copilot" element={<PlaceholderAppView appName="AI CoPilot" icon={BotMessageSquare} message="AI CoPilot integrated into Home Dashboard widgets." />} />
          <Route path="/agent" element={<AgentConsole />} />
          <Route path="/files" element={<PlaceholderAppView appName="File Explorer" icon={Files} />} />
          <Route path="/mail" element={<PlaceholderAppView appName="Mail Client" icon={Mail} />} />
          <Route path="/gaming" element={<PlaceholderAppView appName="Gaming Hub" icon={MonitorPlay} />} />
          <Route path="/settings" element={<ConversationalSettingsView />} />
          <Route path="*" element={isOnboardingComplete ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />} />
        </Routes>
      </main>
      {showChrome && (
        isMobileLayout && deviceType !== 'steamdeck' && deviceType !== 'vr' ? (
          <MobileBottomNavigationBar navItems={navItems} deviceType={deviceType} />
        ) : (
          <Dock navItems={navItems} deviceType={deviceType} />
        )
      )}
    </div>
  );
};

export default App;
