
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BotMessageSquare, BrainCircuit, Files, Mail, Settings, Phone, CalendarDays } from 'lucide-react';
import { StatusBar } from './components/StatusBar';
import { Dock } from './components/Dock';
import { MobileBottomNavigationBar } from './components/MobileBottomNavigationBar';
import { HomeDashboard } from './components/HomeDashboard';
import { PlaceholderAppView } from './components/PlaceholderAppView';
import Vault from './src/apps/vault';
import TimeAI from './src/apps/timeai';
import GenLab from './src/apps/genlab';
import ConverseAI from './src/apps/converseai';
import InBoxAI from './src/apps/inboxai';
import WebLens from './src/apps/weblens';
import MediaSphere from './src/apps/mediasphere';
import SoundScape from './src/apps/soundscape';
import VisionVault from './src/apps/visionvault';
import SecureCore from './src/apps/securecore';
import AppForge from './src/apps/appforge';
import SpaceManager from './src/apps/spacemanager';
import PulseMonitor from './src/apps/pulsemonitor';
import BrainPadApp from './src/apps/brainpad';
import { ProtonLauncher } from './components/ProtonLauncher';
import PhoneApp from './components/PhoneApp';
import { AgentConsole } from './components/AgentConsole';
import { OnboardingStepper } from './components/onboarding/OnboardingStepper';
import { ConversationalSettingsView } from './components/settings/ConversationalSettingsView';
import PhoneSettingsView from './components/settings/PhoneSettingsView';
import MemorySettings from './components/MemorySettings';
import MemoryHub from './components/MemoryHub';
import SettingsApp from './src/apps/settings';
import CursorSettingsView from './components/settings/CursorSettingsView';
import SettingsLayout from './components/settings/SettingsLayout';
import SettingsHome from './src/apps/settings/SettingsHome';
import { useResponsive } from './hooks/useResponsive';
import { useDeviceType } from './hooks/useDeviceType';
import { useOnboarding } from './hooks/useOnboarding';
import { useDock } from './hooks/useDock';
import { useTheme } from './contexts/ThemeContext';
import { useTrainingScheduler } from './hooks/useTrainingScheduler';
import { useAuth } from './contexts/AuthContext';
import LockScreen from './components/LockScreen';


const App: React.FC = () => {
  const { isMobileLayout } = useResponsive();
  const { deviceType, orientation, hasGamepad } = useDeviceType();
  const { isOnboardingComplete } = useOnboarding();
  const { navItems } = useDock();
  const { theme } = useTheme();
  const location = useLocation();
  const { authenticated } = useAuth();

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

  if (!authenticated) {
    return <LockScreen />;
  }


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
          <Route path="/files" element={<Vault />} />
          <Route path="/mail" element={<PlaceholderAppView appName="Mail Client" icon={Mail} />} />
          <Route path="/gaming" element={<ProtonLauncher />} />
          <Route path="/timeai" element={<TimeAI />} />
          <Route path="/genlab" element={<GenLab />} />
          <Route path="/mediasphere" element={<MediaSphere />} />
          <Route path="/soundscape" element={<SoundScape />} />
          <Route path="/visionvault" element={<VisionVault />} />
          <Route path="/securecore" element={<SecureCore />} />
          <Route path="/appforge" element={<AppForge />} />
          <Route path="/spacemanager" element={<SpaceManager />} />
          <Route path="/pulsemonitor" element={<PulseMonitor />} />
          <Route path="/brainpad" element={<BrainPadApp />} />
          <Route path="/converseai" element={<ConverseAI />} />
          <Route path="/inboxai" element={<InBoxAI />} />
          <Route path="/weblens" element={<WebLens />} />
          <Route path="/phone" element={<PhoneApp />} />
          <Route path="/settings/*" element={<SettingsLayout />}>
            <Route index element={<SettingsHome />} />
            <Route path="conversational" element={<ConversationalSettingsView />} />
            <Route path="phone" element={<PhoneSettingsView />} />
            <Route path="memory" element={<MemorySettings />} />
            <Route path="ai" element={<SettingsApp />} />
            <Route path="cursor" element={<CursorSettingsView />} />
          </Route>
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
