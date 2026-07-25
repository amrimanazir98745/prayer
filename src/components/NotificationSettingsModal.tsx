import React, { useState } from 'react';
import { NotificationSettings, PrayerKey, District } from '../types/prayer';
import { requestNotificationPermission, sendPrayerNotification, saveNotificationSettings } from '../utils/notifications';
import { Bell, X, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { playAdhanTone } from '../utils/audioSynthesizer';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  selectedDistrict: District;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  selectedDistrict,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermissionStatus('granted');
      const updated = { ...settings, pushEnabled: true };
      onUpdateSettings(updated);
      saveNotificationSettings(updated);
    } else {
      setPermissionStatus(Notification.permission);
    }
  };

  const handleTogglePush = async () => {
    if (!settings.pushEnabled && permissionStatus !== 'granted') {
      await handleRequestPermission();
    } else {
      const updated = { ...settings, pushEnabled: !settings.pushEnabled };
      onUpdateSettings(updated);
      saveNotificationSettings(updated);
    }
  };

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    onUpdateSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleTogglePrayer = (key: PrayerKey) => {
    const updated = {
      ...settings,
      prayers: {
        ...settings.prayers,
        [key]: !settings.prayers[key],
      },
    };
    onUpdateSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleTestNotification = () => {
    sendPrayerNotification('Fajr', selectedDistrict.name, false);
    if (settings.soundEnabled) {
      playAdhanTone();
    }
  };

  const prayerKeys: { key: PrayerKey; label: string }[] = [
    { key: 'Fajr', label: 'Fajr Adhan' },
    { key: 'Dhuhr', label: 'Dhuhr Adhan' },
    { key: 'Asr', label: 'Asr Adhan' },
    { key: 'Maghrib', label: 'Maghrib Adhan' },
    { key: 'Isha', label: 'Isha Adhan' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0A0C]/90 backdrop-blur-xl animate-fadeIn font-['Anek_Tamil',sans-serif] overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[24px] glass-panel shadow-2xl p-4 sm:p-8 space-y-5 sm:space-y-6 text-[#F3F1EC] border border-[#F3F1EC]/12 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F1EC]/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-[14px] glass-btn-accent text-[#C9B896]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#F3F1EC] font-['Anek_Tamil',sans-serif]">Push & Adhan Notifications</h3>
              <p className="text-xs text-[#F3F1EC]/65">Sri Lanka Prayer Alert Preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-[12px] glass-pill text-[#F3F1EC]/65 hover:text-[#F3F1EC] transition-all active:scale-[0.97] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Permission Banner */}
        <div className="p-4 rounded-[16px] bg-[#1C1B1F]/80 border border-[#F3F1EC]/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className={`w-4 h-4 ${permissionStatus === 'granted' ? 'text-[#C9B896]' : 'text-[#C9B896]'}`} />
              <span className="text-xs font-bold text-[#F3F1EC]">Browser Push Permission</span>
            </div>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-[6px] ${
              permissionStatus === 'granted'
                ? 'glass-btn-accent text-[#C9B896]'
                : 'glass-pill text-[#F3F1EC]/65'
            }`}>
              {permissionStatus}
            </span>
          </div>

          {permissionStatus !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="w-full py-2.5 rounded-[14px] glass-btn-accent text-[#C9B896] font-extrabold text-xs transition-all active:scale-[0.97] cursor-pointer"
            >
              Grant Browser Notification Permission
            </button>
          )}
        </div>

        {/* Global Sound & Push Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#1C1B1F]/80 border border-[#F3F1EC]/10">
            <div>
              <span className="block text-xs font-bold text-[#F3F1EC]">Enable Push Notifications</span>
              <span className="text-[10px] text-[#F3F1EC]/65">Receive browser alerts at prayer times</span>
            </div>
            <button
              onClick={handleTogglePush}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${settings.pushEnabled ? 'bg-[#C9B896]' : 'bg-[#8F8066]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-[#0A0A0C] absolute top-0.5 transition-transform ${settings.pushEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#1C1B1F]/80 border border-[#F3F1EC]/10">
            <div>
              <span className="block text-xs font-bold text-[#F3F1EC]">Adhan Audio Chime</span>
              <span className="text-[10px] text-[#F3F1EC]/65">Play Takbeer chime audio when notification fires</span>
            </div>
            <button
              onClick={handleToggleSound}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${settings.soundEnabled ? 'bg-[#C9B896]' : 'bg-[#8F8066]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-[#0A0A0C] absolute top-0.5 transition-transform ${settings.soundEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
            </button>
          </div>
        </div>

        {/* Per-Prayer Notification Checkbox Matrix */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#C9B896] uppercase tracking-wider">Per-Prayer Alerts</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {prayerKeys.map(({ key }) => {
              const isChecked = settings.prayers[key];
              return (
                <button
                  key={key}
                  onClick={() => handleTogglePrayer(key)}
                  className={`p-3 rounded-[14px] text-xs font-bold flex items-center justify-between transition-all active:scale-[0.97] cursor-pointer ${
                    isChecked
                      ? 'glass-btn-accent text-[#C9B896] font-extrabold'
                      : 'glass-pill text-[#F3F1EC]/65'
                  }`}
                >
                  <span>{key}</span>
                  {isChecked && <Check className="w-3.5 h-3.5 text-[#C9B896]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Test Notification Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#F3F1EC]/10">
          <button
            onClick={handleTestNotification}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-[14px] glass-pill text-[#F3F1EC] text-xs font-bold transition-all active:scale-[0.97] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9B896]" />
            <span>Send Test Push Notification</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-[14px] glass-btn-accent text-[#C9B896] text-xs font-extrabold transition-all active:scale-[0.97] cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
