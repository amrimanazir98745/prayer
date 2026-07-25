import React, { useState, useEffect } from 'react';
import { DayPrayerSchedule, PrayerTimeItem, District } from '../types/prayer';
import { SRI_LANKA_DISTRICTS } from '../utils/sriLankaDistricts';
import { Calendar, Clock, Volume2, VolumeX, Moon, ChevronLeft, ChevronRight, Check, ShieldCheck, ChevronDown, Navigation, MapPin } from 'lucide-react';
import { playAdhanTone } from '../utils/audioSynthesizer';
import { isSriLankaToday, getSriLankaTimeParts } from '../utils/prayerCalculator';
import { CustomMosqueLogoSvg, PrayingManIcon } from './IslamicIcons';

interface HeroTimerProps {
  schedule: DayPrayerSchedule;
  nextPrayer: PrayerTimeItem | null;
  currentPrayer: PrayerTimeItem | null;
  timeRemainingSeconds: number;
  totalIntervalSeconds: number;
  district: District;
  onViewCalendar: () => void;
  selectedDate: Date;
  onChangeDate: (newDate: Date) => void;
  onSelectDistrict?: (district: District) => void;
  onDetectLocation?: () => void;
  isDetectingLocation?: boolean;
}

export const HeroTimer: React.FC<HeroTimerProps> = ({
  schedule,
  nextPrayer,
  currentPrayer,
  timeRemainingSeconds,
  totalIntervalSeconds,
  district,
  onViewCalendar,
  selectedDate,
  onChangeDate,
  onSelectDistrict,
  onDetectLocation,
  isDetectingLocation = false,
}) => {
  const [isPlayingTestAdhan, setIsPlayingTestAdhan] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [isHeroDistrictOpen, setIsHeroDistrictOpen] = useState(false);
  const [heroDistrictSearch, setHeroDistrictSearch] = useState('');

  // Live clock - Sri Lanka Standard Time (SLST, Asia/Colombo)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Colombo',
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format seconds to e.g. "3h 51m 45s"
  const formatCountdown = (totalSecs: number) => {
    if (totalSecs <= 0) return '00s';
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    if (hours > 0) {
      return `${hours}h ${minutes < 10 ? '0' + minutes : minutes}m ${seconds < 10 ? '0' + seconds : seconds}s`;
    }
    return `${minutes}m ${seconds < 10 ? '0' + seconds : seconds}s`;
  };

  const progressPercent = Math.min(100, Math.max(0, 100 - (timeRemainingSeconds / Math.max(1, totalIntervalSeconds)) * 100));

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onChangeDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onChangeDate(d);
  };

  const handleTodayReset = () => {
    const sl = getSriLankaTimeParts(new Date());
    onChangeDate(sl.dateObj);
  };

  const isToday = isSriLankaToday(selectedDate);
  const currentMonthName = selectedDate.toLocaleString('default', { month: 'long' }).toUpperCase();

  const handlePlayAdhanPreview = () => {
    setIsPlayingTestAdhan(true);
    playAdhanTone();
    setTimeout(() => {
      setIsPlayingTestAdhan(false);
    }, 4000);
  };

  const filteredDistricts = SRI_LANKA_DISTRICTS.filter(d =>
    d.name.toLowerCase().includes(heroDistrictSearch.toLowerCase()) ||
    d.province.toLowerCase().includes(heroDistrictSearch.toLowerCase())
  );

  return (
    <div className="relative overflow-hidden rounded-[20px] glass-panel shadow-2xl p-4 sm:p-6 md:p-8 transition-all font-['Anek_Tamil',sans-serif]">
      
      {/* Background Soft Radial Emerald Glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#173B34]/30 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 space-y-4 sm:space-y-6">

        {/* Top Header Row with Date & District Location Switcher */}
        <div className="flex flex-col items-center justify-center text-center gap-3 sm:gap-4 border-b border-[#F3F1EC]/10 pb-4 sm:pb-6">
          <div className="flex flex-col items-center justify-center text-center space-y-2 w-full">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <h2 className="text-lg sm:text-2xl font-black tracking-wide text-[#F3F1EC] font-['Anek_Tamil',sans-serif] flex items-center justify-center gap-2.5">
                <PrayingManIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#C9B896] shrink-0 drop-shadow-[0_0_12px_rgba(201,184,150,0.5)]" fill="#C9B896" />
                <span>PRAYER TIMES - <span className="text-[#C9B896]">{currentMonthName}</span></span>
              </h2>
              
              {/* Embedded GPS Location Button + District Selector */}
              <div className="flex items-center space-x-1.5 my-0.5">
                {/* GPS Auto Detect Button */}
                {onDetectLocation && (
                  <button
                    onClick={onDetectLocation}
                    disabled={isDetectingLocation}
                    title="Auto detect location in Sri Lanka using GPS"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[14px] glass-btn-accent text-xs font-bold transition-all active:scale-[0.97] cursor-pointer disabled:opacity-75"
                  >
                    <Navigation className={`w-3.5 h-3.5 text-[#C9B896] ${isDetectingLocation ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline text-[11px] text-[#C9B896]">
                      {isDetectingLocation ? 'Locating...' : 'GPS Detect'}
                    </span>
                  </button>
                )}

                {/* District Selector */}
                {onSelectDistrict && (
                  <div className="relative inline-block">
                    <button
                      onClick={() => setIsHeroDistrictOpen(!isHeroDistrictOpen)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[14px] glass-pill text-[#F3F1EC] text-xs sm:text-sm font-extrabold transition-all active:scale-[0.97] hover:border-[#C9B896]/40 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#C9B896]" />
                      <span>{district.name}</span>
                      <span className="hidden sm:inline text-[10px] text-[#F3F1EC]/65 font-normal">({district.province})</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[#C9B896] transition-transform ${isHeroDistrictOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Backdrop to close district dropdown on outside click */}
                    {isHeroDistrictOpen && (
                      <div
                        className="fixed inset-0 z-40 bg-transparent cursor-default"
                        onClick={() => setIsHeroDistrictOpen(false)}
                      />
                    )}

                    {/* Dropdown Menu inside Hero */}
                    {isHeroDistrictOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-72 rounded-[20px] bg-[#121115]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden border border-[#C9B896]/40 animate-fadeIn text-left">
                        <div className="p-3 border-b border-[#F3F1EC]/10">
                          <input
                            type="text"
                            placeholder="Search District in Sri Lanka..."
                            value={heroDistrictSearch}
                            onChange={(e) => setHeroDistrictSearch(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-[14px] bg-[#0A0A0C]/90 text-[#F3F1EC] text-xs border border-[#F3F1EC]/20 focus:outline-none focus:border-[#C9B896] font-medium placeholder-[#F3F1EC]/40"
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto py-1 divide-y divide-[#F3F1EC]/10">
                          {filteredDistricts.map(d => (
                            <button
                              key={d.id}
                              onClick={() => {
                                onSelectDistrict(d);
                                setIsHeroDistrictOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors hover:bg-[#C9B896]/15 cursor-pointer ${
                                district.id === d.id ? 'bg-[#C9B896]/20 text-[#C9B896] font-bold' : 'text-[#F3F1EC]'
                              }`}
                            >
                              <div>
                                <span className="block font-semibold">{d.name}</span>
                                <span className="text-[10px] text-[#F3F1EC]/65">{d.province}</span>
                              </div>
                              {district.id === d.id && <Check className="w-3.5 h-3.5 text-[#C9B896]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
            <div className="text-xs sm:text-sm text-[#F3F1EC]/80 font-medium mt-1 flex flex-col items-center justify-center gap-1.5 leading-snug">
              <div className="bg-[#1C1B1F]/90 px-3.5 py-1.5 rounded-[12px] border border-[#C9B896]/35 text-[#F3F1EC] text-[11px] sm:text-xs font-bold inline-flex items-center gap-1.5 shadow-md backdrop-blur-md whitespace-nowrap overflow-x-auto max-w-full">
                <span className="text-[#C9B896] font-black">Schedule:</span>
                <span className="text-[#F3F1EC]">{schedule.dateFormatted} ({schedule.dayName}) | {schedule.hijriDate}</span>
              </div>
              <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-1 text-[11px] text-[#C9B896] bg-[#0A0A0C]/70 px-3.5 py-1.5 rounded-[12px] border border-[#C9B896]/25 shadow-sm text-center">
                <div className="flex items-center gap-1.5 font-bold text-[#F3F1EC]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C9B896] shrink-0" />
                  <span>Prayer Times and Hijri Calendar</span>
                </div>
                <span className="hidden sm:inline text-[#C9B896]/40">•</span>
                <span className="text-[#C9B896] font-semibold">Approved by the All Ceylon Jamiyyathul Ulama (ACJU)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 shrink-0 w-full">
            {/* Day Switchers */}
            <div className="flex items-center glass-pill rounded-[14px] p-1">
              <button
                onClick={handlePrevDay}
                className="p-1.5 text-[#F3F1EC]/65 hover:text-[#F3F1EC] hover:bg-[#C9B896]/15 rounded-[10px] transition-colors active:scale-[0.97] cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {!isToday && (
                <button
                  onClick={handleTodayReset}
                  className="px-2.5 py-1 text-xs font-bold text-[#C9B896] hover:bg-[#C9B896]/20 rounded-[10px] transition-colors cursor-pointer"
                >
                  Today
                </button>
              )}

              <button
                onClick={handleNextDay}
                className="p-1.5 text-[#F3F1EC]/65 hover:text-[#F3F1EC] hover:bg-[#C9B896]/15 rounded-[10px] transition-colors active:scale-[0.97] cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Month Calendar Button */}
            <button
              onClick={onViewCalendar}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[14px] glass-btn-accent text-xs font-bold transition-all active:scale-[0.97] cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C9B896]" />
              <span className="text-[11px] sm:text-xs text-[#C9B896]">VIEW {currentMonthName} CALENDAR</span>
            </button>
          </div>
        </div>

        {/* Hero Banner: Next Adhan Banner + Live Countdown Timer */}
        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#C9B896]/20 via-[#1C1B1F]/80 to-[#1C1B1F]/60 border-2 border-[#C9B896]/60 p-4 sm:p-6 shadow-[0_0_35px_rgba(201,184,150,0.18)] text-center">
          {/* Subtle Soft Glow Background */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#C9B896]/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center justify-center gap-4 sm:gap-5">
            
            {/* Left: Next Adhan Status */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-[#C9B896] flex items-center justify-center space-x-2">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 animate-smooth-red-blink mr-1"></span>
                <span className="bg-[#C9B896]/20 px-2 py-0.5 rounded-[6px] border border-[#C9B896]/40 text-[#EDE3D0]">LIVE ADHAN STATUS</span>
                <span className="text-[#C9B896]/40">•</span>
                <span>{district.name}, Sri Lanka</span>
              </div>
              {nextPrayer ? (
                <h3 className="text-lg sm:text-2xl font-black text-[#F3F1EC] mt-2 font-['Anek_Tamil',sans-serif] leading-tight">
                  Next Adhan: <span className="text-gradient-gold text-xl sm:text-3xl font-black underline decoration-[#C9B896]/50 decoration-wavy underline-offset-4">{nextPrayer.name}</span> <span className="text-[#C9B896] font-extrabold font-mono ml-1">({nextPrayer.timeFormatted})</span>
                </h3>
              ) : (
                <h3 className="text-lg sm:text-2xl font-black text-[#F3F1EC] mt-2 font-['Anek_Tamil',sans-serif] leading-tight">
                  Adhan Completed for Today
                </h3>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-2 text-xs text-[#F3F1EC]/65">
                <span className="flex items-center gap-1.5">
                  <span>Sri Lanka Time (SLST):</span>
                  <strong className="font-['Anek_Tamil',sans-serif] text-gradient-gold text-xs sm:text-sm bg-[#0A0A0C]/80 px-2 py-0.5 rounded-[8px] border border-[#C9B896]/30">{currentTimeStr}</strong>
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[8px] glass-pill text-[#C9B896] font-semibold text-[11px]">
                  <ShieldCheck className="w-3 h-3 text-[#C9B896]" />
                  <span>Official Sri Lanka Standard</span>
                </span>
              </div>
            </div>

            {/* Right: Live Countdown Display & Audio Test */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 pt-2 border-t border-[#F3F1EC]/10 shrink-0 w-full max-w-md">
              <div className="flex items-center space-x-2 bg-[#0A0A0C]/90 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-[12px] border border-[#C9B896]/40 shadow-inner whitespace-nowrap shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C9B896] shrink-0" />
                <span className="text-[10px] sm:text-xs font-extrabold text-[#C9B896] uppercase tracking-wider shrink-0">
                  Time Remaining:
                </span>
                <span className="text-xs sm:text-sm font-['Anek_Tamil',sans-serif] text-hero-countdown font-extrabold font-mono tracking-tight shrink-0">
                  {formatCountdown(timeRemainingSeconds)}
                </span>
              </div>

              <button
                onClick={handlePlayAdhanPreview}
                className="p-1.5 sm:p-2 rounded-[10px] sm:rounded-[12px] glass-btn-accent active:scale-[0.97] transition-all shrink-0 font-bold flex items-center justify-center cursor-pointer"
                title="Preview Adhan Takbeer Audio Chime"
              >
                {isPlayingTestAdhan ? (
                  <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C9B896]" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C9B896]" />
                )}
              </button>
            </div>

          </div>

          {/* Progress bar between prayers */}
          <div className="mt-4 sm:mt-5 space-y-1">
            <div className="flex justify-between text-[10px] sm:text-[11px] font-bold text-[#F3F1EC]/65">
              <span>Passed: {currentPrayer ? currentPrayer.name : 'Start'}</span>
              <span className="text-[#C9B896]">{Math.round(progressPercent)}% Elapsed</span>
              <span>Next: {nextPrayer ? nextPrayer.name : 'Tomorrow'}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0A0A0C]/80 border border-[#F3F1EC]/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8F8066] via-[#C9B896] to-[#EDE3D0] transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
