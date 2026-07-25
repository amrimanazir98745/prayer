import React from 'react';
import { PrayerTimeItem, PrayerKey } from '../types/prayer';
import { Sunrise, Sun, Sunset, Moon, SunMedium, SunDim, CloudSun, Bell, BellOff } from 'lucide-react';

interface PrayerGridProps {
  prayers: PrayerTimeItem[];
  activeNotificationPrayers: Record<PrayerKey, boolean>;
  onToggleNotification: (key: PrayerKey) => void;
}

export const PrayerGrid: React.FC<PrayerGridProps> = ({
  prayers,
  activeNotificationPrayers,
  onToggleNotification,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CloudSun':
        return <CloudSun className="w-5 h-5" />;
      case 'Sunrise':
        return <Sunrise className="w-5 h-5" />;
      case 'SunMedium':
        return <SunMedium className="w-5 h-5" />;
      case 'Sun':
        return <Sun className="w-5 h-5" />;
      case 'SunDim':
        return <SunDim className="w-5 h-5" />;
      case 'Sunset':
        return <Sunset className="w-5 h-5" />;
      case 'Moon':
      default:
        return <Moon className="w-5 h-5" />;
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 font-['Anek_Tamil',sans-serif]">
      {prayers.map((prayer) => {
        const isNotified = activeNotificationPrayers[prayer.key];

        return (
          <div
            key={prayer.key}
            className={`relative flex flex-col justify-between rounded-[22px] p-3.5 sm:p-5 transition-colors duration-200 ${
              prayer.isNext
                ? 'bg-gradient-to-br from-[#C9B896]/30 via-[#1C1B1F]/95 to-[#C9B896]/20 border-2 border-[#C9B896] text-[#F3F1EC] shadow-[0_0_35px_rgba(201,184,150,0.28)] scale-[1.02] sm:scale-[1.03] z-10'
                : 'glass-card text-[#F3F1EC] hover:border-[#C9B896]/40'
            }`}
          >
            {/* Top row: Icon & Notification toggle */}
            <div className="flex items-center justify-between">
              <div
                className={`p-2 rounded-[14px] ${
                  prayer.isNext
                    ? 'bg-[#C9B896] text-[#0A0A0C] shadow-lg font-black'
                    : 'glass-pill text-[#C9B896]'
                }`}
              >
                {getIcon(prayer.iconName)}
              </div>

              {prayer.key !== 'Sunrise' && (
                <button
                  onClick={() => onToggleNotification(prayer.key)}
                  className={`p-2 rounded-[14px] transition-all active:scale-[0.97] cursor-pointer ${
                    isNotified
                      ? prayer.isNext
                        ? 'text-[#0A0A0C] bg-[#C9B896] font-bold shadow-md'
                        : 'text-[#C9B896] glass-pill'
                      : 'text-[#F3F1EC]/35 hover:text-[#F3F1EC]/65'
                  }`}
                  title={isNotified ? 'Adhan notification ON' : 'Adhan notification OFF'}
                >
                  {isNotified ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Middle: Name & Language Labels */}
            <div className="mt-3 sm:mt-4">
              <div className="flex items-baseline justify-between gap-1">
                <h4 className={`text-sm sm:text-lg font-black font-['Anek_Tamil',sans-serif] ${prayer.isNext ? 'text-[#EDE3D0] drop-shadow-sm' : 'text-[#F3F1EC]'}`}>
                  {prayer.name}
                </h4>
                <span className={`font-arabic text-sm font-bold shrink-0 ${prayer.isNext ? 'text-[#C9B896] font-black' : 'text-[#C9B896]/80'}`}>{prayer.arabicName}</span>
              </div>
              <div className={`text-[10px] sm:text-[11px] mt-0.5 flex flex-wrap items-center gap-1 font-medium ${prayer.isNext ? 'text-[#EDE3D0]/90 font-semibold' : 'text-[#F3F1EC]/65'}`}>
                <span className="font-sinhala">{prayer.sinhalaName}</span>
                <span>•</span>
                <span className="font-tamil">{prayer.tamilName}</span>
              </div>
            </div>

            {/* Time Display */}
            <div className={`mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t flex items-baseline justify-between ${
              prayer.isNext ? 'border-[#C9B896]/60' : 'border-[#F3F1EC]/10'
            }`}>
              <span className={`text-base sm:text-2xl font-black font-['Anek_Tamil',sans-serif] tracking-tight ${prayer.isNext ? 'text-[#EDE3D0] drop-shadow' : 'text-[#F3F1EC]'}`}>
                {prayer.timeFormatted}
              </span>

              {prayer.isNext && (
                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-[#C9B896] text-[#0A0A0C] rounded-[10px] shadow-md flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
                    <span className="absolute inline-flex h-2 w-2 rounded-full bg-red-500 animate-smooth-red-halo"></span>
                    <span className="relative h-2 w-2 rounded-full bg-red-500 animate-smooth-red-blink"></span>
                  </span>
                  NEXT
                </span>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};
