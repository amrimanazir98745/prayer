/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { District, DayPrayerSchedule, PrayerKey, NotificationSettings } from './types/prayer';
import { DEFAULT_DISTRICT, findClosestDistrict, getDistrictById } from './utils/sriLankaDistricts';
import { calculateDailyPrayerSchedule, buildPrayerTimeItems, getSriLankaTimeParts } from './utils/prayerCalculator';
import { loadNotificationSettings, saveNotificationSettings, sendPrayerNotification } from './utils/notifications';
import { Header } from './components/Header';
import { HeroTimer } from './components/HeroTimer';
import { PrayerGrid } from './components/PrayerGrid';
import { QiblaCompass } from './components/QiblaCompass';
import { MonthlyCalendar } from './components/MonthlyCalendar';
import { TasbihCounter } from './components/TasbihCounter';
import { DuasModal } from './components/DuasModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { OfflineStatusModal } from './components/OfflineStatusModal';
import { TasbihIcon, DuaIcon, CustomMosqueLogoSvg, PrayingManIcon } from './components/IslamicIcons';
import { Clock, Compass, Calendar, ShieldCheck, Link as LinkIcon, CalendarDays, Bell, Zap, Navigation, AlertTriangle, CheckCircle2, WifiOff, HardDrive } from 'lucide-react';

export default function App() {
  const [selectedDistrict, setSelectedDistrict] = useState<District>(DEFAULT_DISTRICT);
  const [selectedDate, setSelectedDate] = useState<Date>(() => getSriLankaTimeParts(new Date()).dateObj);
  const [activeTab, setActiveTab] = useState<'today' | 'qibla' | 'calendar' | 'tasbih' | 'duas'>('today');
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [locationNotice, setLocationNotice] = useState<{ msg: string; type: 'success' | 'warn' | 'error' } | null>(null);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(loadNotificationSettings());
  const [now, setNow] = useState<Date>(new Date());

  // Listen to Online/Offline network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotice('⚡ Connection restored. App synced and online.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showNotice('📡 Network offline. App operating in 100% offline mode.', 'warn');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ensure document root always has dark class
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Restore saved district from localStorage if present
  useEffect(() => {
    try {
      const savedDistrictId = localStorage.getItem('sl_prayer_district_id');
      if (savedDistrictId) {
        setSelectedDistrict(getDistrictById(savedDistrictId));
      }
    } catch (e) {
      console.warn('Could not load saved district', e);
    }
  }, []);

  const handleSelectDistrict = (district: District) => {
    setSelectedDistrict(district);
    try {
      localStorage.setItem('sl_prayer_district_id', district.id);
    } catch (e) {
      console.warn('Could not save district preference', e);
    }
  };

  // Ticking timer every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate daily schedule
  const dailySchedule: DayPrayerSchedule = calculateDailyPrayerSchedule(
    selectedDate,
    selectedDistrict.lat,
    selectedDistrict.lng,
    selectedDistrict.id
  );

  // Build prayer time items
  const { items: prayerItems, nextPrayer, currentPrayer, timeRemainingSeconds, totalIntervalSeconds } =
    buildPrayerTimeItems(dailySchedule, now);

  // Automatic Adhan Push Alert trigger check
  useEffect(() => {
    if (!notificationSettings.pushEnabled) return;

    const slNow = getSriLankaTimeParts(now);
    const currentMinKey = `${slNow.hours}:${slNow.minutes}`;
    const notifiedKey = `notified_${slNow.year}_${slNow.month}_${slNow.day}_${currentMinKey}`;

    if (sessionStorage.getItem(notifiedKey)) return;

    prayerItems.forEach(item => {
      if (item.key === 'Sunrise') return;
      if (!notificationSettings.prayers[item.key]) return;

      const pDate = item.dateObj;
      const diffMs = Math.abs(now.getTime() - pDate.getTime());

      if (diffMs <= 40000) {
        sessionStorage.setItem(notifiedKey, 'true');
        sendPrayerNotification(item.name, selectedDistrict.name, false);
      }
    });
  }, [now, notificationSettings, prayerItems, selectedDate, selectedDistrict]);

  const showNotice = (msg: string, type: 'success' | 'warn' | 'error') => {
    setLocationNotice({ msg, type });
    setTimeout(() => {
      setLocationNotice(null);
    }, 7000);
  };

  // Handle Geolocation Detection with multi-stage fallback
  const handleDetectLocation = () => {
    if (!('geolocation' in navigator)) {
      showNotice('Geolocation is not supported in this browser.', 'error');
      return;
    }

    setIsDetectingLocation(true);

    const onSuccess = (position: GeolocationPosition) => {
      setIsDetectingLocation(false);
      const { latitude, longitude } = position.coords;
      const closest = findClosestDistrict(latitude, longitude);
      handleSelectDistrict(closest);

      const inSriLanka = latitude >= 5.5 && latitude <= 10.0 && longitude >= 79.0 && longitude <= 82.5;
      if (inSriLanka) {
        showNotice(`📍 Location detected! District set to ${closest.name} (${closest.province}).`, 'success');
      } else {
        showNotice(`🌍 Device location detected (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°). Matched to closest Sri Lankan district: ${closest.name}.`, 'warn');
      }
    };

    // First attempt: High accuracy with 6s timeout
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        console.warn('High accuracy GPS timed out/failed, trying standard accuracy...', err);
        // Second attempt: Standard accuracy with 8s timeout (works reliably on Wi-Fi/desktop)
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (finalErr) => {
            setIsDetectingLocation(false);
            console.warn('Standard geolocation error:', finalErr);
            if (finalErr.code === finalErr.PERMISSION_DENIED) {
              showNotice('⚠️ GPS Permission Denied or restricted by browser/iframe. Please enable location permissions or pick your district manually.', 'warn');
            } else {
              showNotice('⚠️ Could not determine GPS coordinates. Falling back to default district.', 'warn');
            }
          },
          { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 }
        );
      },
      { timeout: 6000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  const handleToggleNotification = (key: PrayerKey) => {
    const updated = {
      ...notificationSettings,
      prayers: {
        ...notificationSettings.prayers,
        [key]: !notificationSettings.prayers[key]
      }
    };
    setNotificationSettings(updated);
    saveNotificationSettings(updated);
  };

  return (
    <div className="app-bg min-h-screen text-[#F3F1EC] flex flex-col font-['Anek_Tamil',sans-serif] selection:bg-[#C9B896]/30 selection:text-white transition-colors duration-500 overflow-x-hidden">
      
      <div className="app-content min-h-screen flex flex-col">
        {/* Sticky Header with Navigation */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hijriDate={dailySchedule.hijriDate}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
        />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-12">
        
        {/* Floating Location Notice Banner */}
        {locationNotice && (
          <div className={`p-4 rounded-[20px] shadow-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all animate-fadeIn ${
            locationNotice.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
              : locationNotice.type === 'warn'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
              : 'bg-red-500/15 border-red-500/40 text-red-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {locationNotice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : locationNotice.type === 'warn' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <span>{locationNotice.msg}</span>
            </div>
            <button
              onClick={() => setLocationNotice(null)}
              className="text-xs opacity-70 hover:opacity-100 font-bold px-2 py-0.5 rounded-lg bg-white/10 shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: TODAY'S SCHEDULE (Primary View) */}
        {activeTab === 'today' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            
            {/* Hero Banner with Live Countdown Timer & District Selector */}
            <HeroTimer
              schedule={dailySchedule}
              nextPrayer={nextPrayer}
              currentPrayer={currentPrayer}
              timeRemainingSeconds={timeRemainingSeconds}
              totalIntervalSeconds={totalIntervalSeconds}
              district={selectedDistrict}
              onViewCalendar={() => setActiveTab('calendar')}
              selectedDate={selectedDate}
              onChangeDate={setSelectedDate}
              onSelectDistrict={handleSelectDistrict}
              onDetectLocation={handleDetectLocation}
              isDetectingLocation={isDetectingLocation}
            />

            {/* Prayer Cards Row */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#F3F1EC] flex items-center gap-2 font-['Anek_Tamil',sans-serif]">
                  <PrayingManIcon className="w-5 h-5 text-[#C9B896] shrink-0" fill="#C9B896" />
                  <span>Daily Adhan Timings</span>
                  <span className="text-[#F3F1EC]/30">•</span>
                  <span className="text-[#C9B896] font-bold">{selectedDistrict.name}</span>
                </h3>

                <span className="text-xs text-[#C9B896] font-bold flex items-center gap-1.5 glass-pill px-3 py-1 rounded-[14px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C9B896]" />
                  <span>Official Sri Lanka Standard</span>
                </span>
              </div>

              <PrayerGrid
                prayers={prayerItems}
                activeNotificationPrayers={notificationSettings.prayers}
                onToggleNotification={handleToggleNotification}
              />
            </section>



          </div>
        )}

        {/* TAB 2: QIBLA COMPASS */}
        {activeTab === 'qibla' && (
          <div className="animate-fadeIn">
            <QiblaCompass district={selectedDistrict} onDistrictSelect={setSelectedDistrict} />
          </div>
        )}

        {/* TAB 3: MONTHLY CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="animate-fadeIn">
            <MonthlyCalendar district={selectedDistrict} />
          </div>
        )}

        {/* TAB 4: TASBIH COUNTER */}
        {activeTab === 'tasbih' && (
          <div className="animate-fadeIn">
            <TasbihCounter />
          </div>
        )}

        {/* TAB 5: DAILY DUAS */}
        {activeTab === 'duas' && (
          <div className="animate-fadeIn">
            <DuasModal />
          </div>
        )}

      </main>

      {/* Floating iPhone Liquid Glass Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-3 left-3 right-3 z-50 lg:hidden glass-nav rounded-[20px] p-1.5 shadow-2xl border border-[#F3F1EC]/15">
        <div className="grid grid-cols-5 gap-1 text-center">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-[14px] transition-all active:scale-[0.97] cursor-pointer ${
              activeTab === 'today'
                ? 'glass-btn-accent text-[#C9B896] font-extrabold'
                : 'glass-pill text-[#F3F1EC]/65 hover:text-[#F3F1EC]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-1">Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('qibla')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-[14px] transition-all active:scale-[0.97] cursor-pointer ${
              activeTab === 'qibla'
                ? 'glass-btn-accent text-[#C9B896] font-extrabold'
                : 'glass-pill text-[#F3F1EC]/65 hover:text-[#F3F1EC]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-1">Qibla</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-[14px] transition-all active:scale-[0.97] cursor-pointer ${
              activeTab === 'calendar'
                ? 'glass-btn-accent text-[#C9B896] font-extrabold'
                : 'glass-pill text-[#F3F1EC]/65 hover:text-[#F3F1EC]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-1">Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('tasbih')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-[14px] transition-all active:scale-[0.97] cursor-pointer ${
              activeTab === 'tasbih'
                ? 'glass-btn-accent text-[#C9B896] font-extrabold'
                : 'glass-pill text-[#F3F1EC]/65 hover:text-[#F3F1EC]'
            }`}
          >
            <TasbihIcon className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-1">Tasbih</span>
          </button>

          <button
            onClick={() => setActiveTab('duas')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-[14px] transition-all active:scale-[0.97] cursor-pointer ${
              activeTab === 'duas'
                ? 'glass-btn-accent text-[#C9B896] font-extrabold'
                : 'glass-pill text-[#F3F1EC]/65 hover:text-[#F3F1EC]'
            }`}
          >
            <DuaIcon className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-1">Duas</span>
          </button>
        </div>
      </nav>

      {/* Push Notification Settings Modal Overlay */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        settings={notificationSettings}
        onUpdateSettings={setNotificationSettings}
        selectedDistrict={selectedDistrict}
      />

      {/* 100% Offline Capability Status Modal Overlay */}
      <OfflineStatusModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        isOnline={isOnline}
      />

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-[#F3F1EC]/10 glass-nav py-8 px-4 sm:px-6 lg:px-8 text-xs text-[#F3F1EC]/65 mb-24 lg:mb-0">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
          {/* Main Title & Portal Info */}
          <div className="flex flex-col items-center justify-center space-y-1 text-center">
            <h3 className="text-sm sm:text-base font-extrabold text-[#F3F1EC] font-['Anek_Tamil',sans-serif] tracking-wide">
              Srilanka Prayer Times
            </h3>
            <p className="text-xs sm:text-sm font-medium text-[#F3F1EC]/85">
              Official Sri Lanka Standard Prayer & Qibla Portal 🇱🇰
            </p>
          </div>

          {/* Quick Links with Icons */}
          <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-[#F3F1EC]/80 bg-[#0A0A0C]/50 px-5 py-3 rounded-[14px] border border-[#F3F1EC]/10 w-full max-w-md">
            <div className="font-extrabold text-[#C9B896] flex items-center justify-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#C9B896]" />
              <span>Quick Links</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={() => setActiveTab('calendar')}
                className="inline-flex items-center gap-1.5 text-[#F3F1EC] hover:text-[#C9B896] transition-colors font-semibold cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#C9B896]" />
                <span>Official Timetables</span>
              </button>
              <span className="text-[#C9B896]/40">|</span>
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-[#F3F1EC] hover:text-[#C9B896] transition-colors font-semibold cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-[#C9B896]" />
                <span>Push Alerts</span>
              </button>
              <span className="text-[#C9B896]/40">|</span>
              <button
                onClick={() => setIsOfflineModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-[#F3F1EC] hover:text-[#C9B896] transition-colors font-semibold cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5 text-[#C9B896]" />
                <span>Offline Status</span>
              </button>
            </div>
          </div>

          {/* Copyright & Credit */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-[#F3F1EC]/70 pt-2 border-t border-[#F3F1EC]/10 w-full">
            <span>© 2026 Srilanka Prayer Times</span>
            <span className="hidden sm:inline text-[#F3F1EC]/30">•</span>
            <a
              href="https://khalidz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#C9B896] hover:underline font-bold transition-all hover:scale-[1.02]"
            >
              <Zap className="w-3.5 h-3.5 text-[#C9B896] fill-[#C9B896]/20" />
              <span>Powered by khalidz.com</span>
            </a>
          </div>
        </div>
      </footer>

      </div>
    </div>
  );
}
