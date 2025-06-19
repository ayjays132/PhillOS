import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface WidgetConfig {
  id: string;
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
  colSpanDesktop?: number; // How many columns it spans on desktop (lg grid-cols-4)
  rowSpanDesktop?: number;
  colSpanTablet?: number; // md grid-cols-2
  rowSpanTablet?: number;
  component: React.FC<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  props?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface StratumConfig {
  id: string;
  title?: string; // Optional title for the stratum itself
  widgets: WidgetConfig[];
  gridColsDesktop?: number; // Tailwind class like grid-cols-1, grid-cols-2 etc. for widgets within this stratum on desktop
  gridColsTablet?: number; // for widgets within this stratum on tablet
}

export interface WidgetOrder {
  [stratumId: string]: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
}

// Grounding metadata types, if used
export interface WebGroundingChunk {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: WebGroundingChunk;
  // other types of grounding chunks can be added here
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // other grounding metadata fields
}

export interface Candidate {
  groundingMetadata?: GroundingMetadata;
  // other candidate fields
}

export interface GenerateContentResponseWithGrounding {
  text: string;
  candidates?: Candidate[];
}

export type AIModelPreference = 'local' | 'cloud';

export interface UserProfile {
  username: string;
  avatarSeed: string; // e.g., a simple string like "avatar1", "phillosuser", "userseedX"
}

export type UserInterest = 'technology' | 'art' | 'productivity' | 'wellness' | 'gaming' | 'science' | 'news';

export type ConnectedService = 'calendar' | 'contacts' | 'cloudStorage' | 'email';

export interface OnboardingState {
  currentStep: number;
  isComplete: boolean;
  modelPreference: AIModelPreference;
  userProfile: UserProfile | null;
  userInterests: UserInterest[];
  connectedServices: ConnectedService[];
}

export interface PhoneSettings {
  bluetoothAddress: string;
  modemDevice: string;
  autoConnect: boolean;
}