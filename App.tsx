
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BotMessageSquare, BrainCircuit, Files, Mail, Settings, Phone } from 'lucide-react';
import { StatusBar } from './components/StatusBar';
import { Dock } from './components/Dock';
import { MobileBottomNavigationBar } from './components/MobileBottomNavigationBar';
import { HomeDashboard } from './components/HomeDashboard';
import { PlaceholderAppView } from './components/PlaceholderAppView';
import { ProtonLauncher } from './components/ProtonLauncher';
import PhoneApp from './components/PhoneApp';
import { AgentConsole } from './components/AgentConsole';
import { OnboardingStepper } from './components/onboarding/OnboardingStepper';
import { ConversationalSettingsView } from './components/settings/ConversationalSettingsView';
import PhoneSettingsView from './components/settings/PhoneSettingsView';
import MemorySettings from './components/MemorySettings';
import MemoryHub from './components/MemoryHub';
import { useResponsive } from './hooks/useResponsive';
import { useDeviceType } from './hooks/useDeviceType';
import { useOnboarding } from './hooks/useOnboarding';
import { useDock } from './hooks/useDock';
import { useTheme } from './contexts/ThemeContext';
import { useTrainingScheduler } from './hooks/useTrainingScheduler';


const App: React.FC = () => {
  const { isMobileLayout } = useResponsive();
  const { deviceType, orientation, hasGamepad } = useDeviceType();
  const { isOnboardingComplete } = useOnboarding();
  const { navItems } = useDock();
  const { theme } = useTheme();
  const location = useLocation();

  const trainingEnabled = import.meta.env.VITE_TRAINING_ENABLED !== 'false';
  const trainingFreq = parseInt(import.meta.env.VITE_TRAINING_FREQUENCY_MS || '3600000', 10);
  useTrainingScheduler(trainingEnabled, trainingFreq);

  React.useEffect(() => {
    const win = window as any;
    if (win.boot_info) {
      if (win.SVG_BOOT_UPDATE && win.boot_info.svg_base) {
        win.SVG_BOOT_UPDATE();
      } else if (win.SPRITE_BOOT_PLAY && !win.boot_info.svg_base && win.boot_info.sprite_base) {
        win.SPRITE_BOOT_PLAY();
      }
    }
  }, []);


  if (!isOnboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  
  // If onboarding is complete and user tries to access /onboarding, redirect to home
  if (isOnboardingComplete && location.pathname === '/onboarding') {
    return <Navigate to="/home" replace />;
  }

  const showChrome = location.pathname !== '/onboarding';

  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isDark ? 'bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 text-white/90' : 'bg-gradient-to-br from-white via-gray-200 to-blue-300 text-gray-900'}`}
    >
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
          <Route path="/gaming" element={<ProtonLauncher />} />
          <Route path="/phone" element={<PhoneApp />} />
          <Route path="/settings" element={<ConversationalSettingsView />} />
          <Route path="/settings/phone" element={<PhoneSettingsView />} />
          <Route path="/settings/memory" element={<MemorySettings />} />
          <Route path="/memory-hub" element={<MemoryHub />} />
          <Route path="*" element={isOnboardingComplete ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />} />
        </Routes>
      </main>
      {showChrome && (
        isMobileLayout && deviceType !== 'steamdeck' && deviceType !== 'vr' ? (
          <MobileBottomNavigationBar navItems={navItems} deviceType={deviceType} hasGamepad={hasGamepad} />
        ) : (
          <Dock deviceType={deviceType} orientation={orientation} hasGamepad={hasGamepad} />
        )
      )}
    </div>
  );
};

export default App;
