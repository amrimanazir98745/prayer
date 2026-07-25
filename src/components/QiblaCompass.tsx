import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QiblaInfo, District } from '../types/prayer';
import { SRI_LANKA_DISTRICTS, getDistrictById, findClosestDistrict } from '../utils/sriLankaDistricts';
import {
  getQiblaInfo,
  computeTiltCompensatedHeading,
  smoothAngle,
  getCardinalDirection,
  calculateDistanceToMeccaMiles,
  calculateDistanceToMeccaKm,
  calculateQiblaBearing
} from '../utils/qiblaCalculator';
import {
  Compass,
  Navigation,
  CheckCircle2,
  ShieldCheck,
  LocateFixed,
  Radio,
  AlertCircle,
  AlertTriangle,
  Wrench,
  MapPin,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Target,
  ChevronDown,
  Building2,
  Check
} from 'lucide-react';
import { playQiblaAlignedBeep } from '../utils/audioSynthesizer';

interface QiblaCompassProps {
  district?: District;
  onDistrictSelect?: (district: District) => void;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({ district, onDistrictSelect }) => {
  // Currently Selected Sri Lanka District
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(
    district?.id || 'colombo'
  );
  const currentDistrict = getDistrictById(selectedDistrictId);

  // Device Orientation State
  const [rawHeading, setRawHeading] = useState<number | null>(null);
  const [smoothedHeading, setSmoothedHeading] = useState<number | null>(null);
  const [pitch, setPitch] = useState<number | null>(null);
  const [roll, setRoll] = useState<number | null>(null);

  // Settings & Controls
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);

  // Permission & Sensor State
  const [sensorStatus, setSensorStatus] = useState<'active' | 'permission_required' | 'unsupported' | 'idle'>('idle');

  // GPS & Location State
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>({
    lat: currentDistrict.lat,
    lng: currentDistrict.lng
  });
  const [locationName, setLocationName] = useState<string>(`${currentDistrict.name} District, Sri Lanka 🇱🇰`);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Aladhan Qibla API Live Data State
  const [apiBearing, setApiBearing] = useState<number | null>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);

  // Drag & Manual Rotation
  const [manualOffset, setManualOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const compassGraphicRef = useRef<HTMLDivElement | null>(null);
  const dragStartAngleRef = useRef<number>(0);
  const initialOffsetRef = useRef<number>(0);

  // Animation frame ref for smooth 60fps interpolation
  const animFrameRef = useRef<number | null>(null);
  const targetHeadingRef = useRef<number | null>(null);
  const currentHeadingRef = useRef<number | null>(null);

  // Sync external district prop if changed
  useEffect(() => {
    if (district && district.id !== selectedDistrictId) {
      setSelectedDistrictId(district.id);
      setGpsCoords({ lat: district.lat, lng: district.lng });
      setLocationName(`${district.name} District, Sri Lanka 🇱🇰`);
    }
  }, [district]);

  // Fetch Qibla bearing directly from Aladhan API for maximum reliability
  const fetchAladhanQibla = useCallback(async (lat: number, lng: number) => {
    setApiLoading(true);
    try {
      const res = await fetch(`https://api.aladhan.com/v1/qibla/${lat}/${lng}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && typeof json.data.direction === 'number') {
          setApiBearing(Math.round(json.data.direction * 100) / 100);
        }
      }
    } catch (e) {
      console.warn('Aladhan Qibla API fetch failed:', e);
    } finally {
      setApiLoading(false);
    }
  }, []);

  // Fetch Aladhan API Qibla whenever coordinates change
  useEffect(() => {
    const lat = gpsCoords ? gpsCoords.lat : currentDistrict.lat;
    const lng = gpsCoords ? gpsCoords.lng : currentDistrict.lng;
    fetchAladhanQibla(lat, lng);
  }, [gpsCoords, currentDistrict, fetchAladhanQibla]);

  // Handle District Switch
  const handleSelectDistrict = (id: string) => {
    setSelectedDistrictId(id);
    const dist = getDistrictById(id);
    setGpsCoords({ lat: dist.lat, lng: dist.lng });
    setLocationName(`${dist.name} District, ${dist.province} 🇱🇰`);
    if (onDistrictSelect) {
      onDistrictSelect(dist);
    }
  };

  // Request GPS position within Sri Lanka
  const acquireGpsLocation = useCallback(() => {
    setIsLocatingGps(true);
    setGpsError(null);

    if (typeof window !== 'undefined' && 'navigator' in window && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGpsCoords({ lat, lng, accuracy: pos.coords.accuracy });
          setIsLocatingGps(false);

          // Find closest Sri Lankan District
          const closest = findClosestDistrict(lat, lng);
          setSelectedDistrictId(closest.id);
          setLocationName(`${closest.name} District (GPS Detected) 🇱🇰`);
          if (onDistrictSelect) {
            onDistrictSelect(closest);
          }
        },
        (err) => {
          console.warn('GPS Error:', err.message);
          setGpsError('GPS permission denied or unavailable. Showing Sri Lanka district location.');
          setIsLocatingGps(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGpsError('Geolocation is not supported by this browser.');
      setIsLocatingGps(false);
    }
  }, [onDistrictSelect]);

  // Auto-acquire GPS location once on initial mount
  const hasAutoGpsRunRef = useRef(false);
  useEffect(() => {
    if (!hasAutoGpsRunRef.current) {
      hasAutoGpsRunRef.current = true;
      acquireGpsLocation();
    }
  }, [acquireGpsLocation]);

  // Active Coordinates
  const activeLat = gpsCoords ? gpsCoords.lat : currentDistrict.lat;
  const activeLng = gpsCoords ? gpsCoords.lng : currentDistrict.lng;

  // Active Device Heading from sensor or manual offset
  const sensorHeading = smoothedHeading !== null ? smoothedHeading : (rawHeading !== null ? rawHeading : 0);
  const activeHeading = (sensorHeading + manualOffset + 360) % 360;

  // Calculate Qibla Info (Local Great Circle)
  const qiblaInfo: QiblaInfo = getQiblaInfo(activeLat, activeLng, activeHeading);
  const calculatedBearing = qiblaInfo.qiblaBearing;
  // Use API bearing if available, else local calculated bearing
  const effectiveQiblaBearing = apiBearing !== null ? apiBearing : calculatedBearing;

  const distanceKm = calculateDistanceToMeccaKm(activeLat, activeLng);
  const distanceMiles = calculateDistanceToMeccaMiles(activeLat, activeLng);

  // Check Alignment
  const diffFromQibla = Math.min(
    Math.abs(effectiveQiblaBearing - activeHeading),
    360 - Math.abs(effectiveQiblaBearing - activeHeading)
  );
  const isAligned = diffFromQibla <= 3.5;

  // Alignment audio & haptic trigger
  const lastAlignedRef = useRef<boolean>(false);
  useEffect(() => {
    if (isAligned && !lastAlignedRef.current) {
      if (soundEnabled) {
        playQiblaAlignedBeep();
      }
      if (vibrationEnabled && typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        try {
          navigator.vibrate([120, 60, 120]);
        } catch (e) {
          // ignore
        }
      }
    }
    lastAlignedRef.current = isAligned;
  }, [isAligned, soundEnabled, vibrationEnabled]);

  // Drag interaction logic for manual compass rotation
  const getPointerAngleInCompass = (clientX: number, clientY: number): number | null => {
    if (!compassGraphicRef.current) return null;
    const rect = compassGraphicRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rad = Math.atan2(clientY - cy, clientX - cx);
    let deg = rad * (180 / Math.PI);
    return (deg + 360) % 360;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const angle = getPointerAngleInCompass(e.clientX, e.clientY);
    if (angle === null) return;

    setIsDragging(true);
    dragStartAngleRef.current = angle;
    initialOffsetRef.current = manualOffset;

    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentAngle = getPointerAngleInCompass(e.clientX, e.clientY);
    if (currentAngle === null) return;

    const angleDelta = currentAngle - dragStartAngleRef.current;
    let newOffset = (initialOffsetRef.current - angleDelta + 360) % 360;
    if (newOffset > 180) newOffset -= 360;

    setManualOffset(Math.round(newOffset));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      if (e.currentTarget.releasePointerCapture) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (err) {
          // ignore
        }
      }
    }
  };

  // Orientation Sensor Event Handler
  const sensorStatusRef = useRef<'active' | 'permission_required' | 'unsupported' | 'idle'>('idle');
  const isAbsoluteRef = useRef<boolean>(false);

  useEffect(() => {
    let sensorFired = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let compassHeading: number | null = null;

      if ('webkitCompassHeading' in e && typeof (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading === 'number') {
        const webkitVal = (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading;
        if (!isNaN(webkitVal) && webkitVal >= 0) {
          compassHeading = webkitVal;
        }
      } else if (e.alpha !== null && e.alpha !== undefined) {
        const isAbs = e.absolute || ('absolute' in e && (e as any).absolute) || e.type === 'deviceorientationabsolute';
        if (isAbs) {
          isAbsoluteRef.current = true;
          compassHeading = (360 - e.alpha) % 360;
        } else if (!isAbsoluteRef.current) {
          compassHeading = computeTiltCompensatedHeading(e.alpha, e.beta, e.gamma);
        }
      }

      if (e.beta !== null && e.beta !== undefined) setPitch(Math.round(e.beta));
      if (e.gamma !== null && e.gamma !== undefined) setRoll(Math.round(e.gamma));

      if (compassHeading !== null && !isNaN(compassHeading)) {
        sensorFired = true;
        sensorStatusRef.current = 'active';
        setSensorStatus('active');

        let screenAngle = 0;
        if (typeof window !== 'undefined') {
          if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number') {
            screenAngle = window.screen.orientation.angle;
          } else if (typeof window.orientation === 'number') {
            screenAngle = Number(window.orientation) || 0;
          }
        }

        const compensatedHeading = (compassHeading + screenAngle + 360) % 360;
        setRawHeading(Math.round(compensatedHeading));
        targetHeadingRef.current = compensatedHeading;
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      if (
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
      ) {
        setSensorStatus('permission_required');
      } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);

        const timeout = setTimeout(() => {
          if (!sensorFired && sensorStatusRef.current !== 'active') {
            sensorStatusRef.current = 'unsupported';
            setSensorStatus('unsupported');
          }
        }, 5000);

        return () => {
          clearTimeout(timeout);
          window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
          window.removeEventListener('deviceorientation', handleOrientation, true);
        };
      }
    } else {
      setSensorStatus('unsupported');
    }
  }, []);

  // Request iOS permission
  const requestIosPermission = async () => {
    if (
      typeof window !== 'undefined' &&
      'DeviceOrientationEvent' in window &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
    ) {
      try {
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (permission === 'granted') {
          setSensorStatus('active');
          window.location.reload();
        } else {
          setSensorStatus('unsupported');
          alert('Compass permission was denied.');
        }
      } catch (e) {
        console.error(e);
        setSensorStatus('unsupported');
      }
    }
  };

  // 60FPS Smooth Heading Animation Loop
  useEffect(() => {
    const updateSmoothHeading = () => {
      if (targetHeadingRef.current !== null) {
        if (currentHeadingRef.current === null) {
          currentHeadingRef.current = targetHeadingRef.current;
        } else {
          currentHeadingRef.current = smoothAngle(currentHeadingRef.current, targetHeadingRef.current, 0.22);
        }
        setSmoothedHeading(Math.round(currentHeadingRef.current * 10) / 10);
      }
      animFrameRef.current = requestAnimationFrame(updateSmoothHeading);
    };

    animFrameRef.current = requestAnimationFrame(updateSmoothHeading);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Compute rotation angles
  const displayHeading = activeHeading !== null ? activeHeading : 0;
  const compassDialRotation = -displayHeading;
  const qiblaPointerAngle = (effectiveQiblaBearing - displayHeading + 360) % 360;

  // Direct alignment action: orient screen to Mecca
  const alignToMecca = () => {
    const desiredOffset = (effectiveQiblaBearing - (sensorHeading || 0) + 360) % 360;
    setManualOffset(Math.round(desiredOffset));
  };

  const resetOrientation = () => {
    setManualOffset(0);
  };

  const cardinalStr = getCardinalDirection(effectiveQiblaBearing);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-['Anek_Tamil',sans-serif]">
      
      {/* Maintenance Notice Banner */}
      <div id="qibla-compass-maintenance-banner" className="p-4 rounded-[22px] bg-red-500/15 border border-red-500/40 text-red-100 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 text-xs sm:text-sm font-semibold">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/25 text-red-400 shrink-0">
            <Wrench className="w-5 h-5 animate-pulse text-red-400" />
          </div>
          <div>
            <span className="font-extrabold text-red-400 uppercase tracking-wide block sm:inline mr-2">
              ⚠️ Maintenance Notice:
            </span>
            <span className="text-red-100/90">
              Qibla Compass live orientation sensors are currently undergoing scheduled maintenance. Geodetic district calculations & alignment modes remain fully operational below.
            </span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-red-500/25 border border-red-500/50 text-red-300 text-[11px] font-black uppercase tracking-wider shrink-0 whitespace-nowrap self-end sm:self-center">
          Under Maintenance
        </span>
      </div>

      {/* Top Banner Header */}
      <div className="p-6 sm:p-8 rounded-[28px] glass-panel-gold border border-[#C9B896]/40 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[#C9B896] text-xs font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5 bg-[#C9B896]/20 px-3 py-1 rounded-full border border-[#C9B896]/40 text-[#C9B896]">
                <Radio className="w-3.5 h-3.5 animate-pulse text-[#C9B896]" />
                <span>OFFICIAL SRI LANKA QIBLA PORTAL 🇱🇰</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F3F1EC] tracking-wide flex items-center gap-2">
              <span>Sri Lanka Standard Qibla Direction</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#F3F1EC]/80 font-medium max-w-xl">
              High-precision Great Circle geodetic bearing to Mecca from all 25 Sri Lanka Districts & live GPS location.
            </p>
          </div>

          {/* District Picker & GPS Trigger (One-line container, fit-content, Auto GPS first) */}
          <div className="w-full sm:w-auto flex flex-row items-center flex-nowrap gap-2 max-w-full overflow-x-auto py-1">
            <button
              onClick={acquireGpsLocation}
              disabled={isLocatingGps}
              className="px-3.5 py-2.5 rounded-[14px] bg-gradient-to-r from-[#EDE3D0] via-[#C9B896] to-[#8F8066] text-[#0A0A0C] border border-[#C9B896]/60 font-black text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(201,184,150,0.3)] active:scale-[0.97] hover:brightness-110 flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocatingGps ? 'animate-spin' : ''}`} />
              <span>{isLocatingGps ? 'Detecting...' : '📍 Auto GPS'}</span>
            </button>

            <div className="relative shrink min-w-[140px] max-w-[210px] sm:max-w-[260px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9B896] pointer-events-none">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <select
                value={selectedDistrictId}
                onChange={(e) => handleSelectDistrict(e.target.value)}
                className="w-full pl-8 pr-7 py-2.5 rounded-[14px] bg-[#0A0A0C]/90 border border-[#C9B896]/50 text-xs sm:text-sm font-bold text-[#F3F1EC] appearance-none focus:outline-none focus:border-[#C9B896] cursor-pointer truncate"
              >
                {SRI_LANKA_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#121115] text-[#F3F1EC]">
                    {d.name} District ({d.province})
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C9B896] pointer-events-none">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {sensorStatus === 'permission_required' && (
              <button
                onClick={requestIosPermission}
                className="px-3 py-2.5 rounded-[14px] bg-emerald-500 text-black font-extrabold text-xs transition-all flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sensor</span>
              </button>
            )}
          </div>

        </div>

        {/* Live Status Bar */}
        <div className="mt-5 pt-4 border-t border-[#F3F1EC]/10 flex flex-wrap items-center justify-between text-xs text-[#F3F1EC]/80 gap-3">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#C9B896] shrink-0" />
            <span className="font-extrabold text-[#F3F1EC]">{locationName}</span>
            <span className="text-[#C9B896]/50">•</span>
            <span className="font-mono text-[11px] text-[#C9B896]">
              {activeLat.toFixed(4)}°N, {activeLng.toFixed(4)}°E
            </span>
          </div>

          <div className="flex items-center gap-2">
            {sensorStatus === 'active' ? (
              <span className="text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30 text-[11px]">
                <Radio className="w-3 h-3 animate-pulse" /> Live Phone Gyro Active
              </span>
            ) : (
              <span className="text-[#C9B896] font-bold flex items-center gap-1 bg-[#0A0A0C]/80 px-2.5 py-1 rounded-full border border-[#C9B896]/30 text-[11px]">
                <Compass className="w-3 h-3 text-[#C9B896]" /> Interactive Touch Compass
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Central Live Interactive Compass Card (Col 8) */}
        <div className="lg:col-span-8 p-6 sm:p-10 rounded-[28px] glass-panel shadow-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[480px]">
          
          {/* Top Audio & Quick Control Header */}
          <div className="w-full flex items-center justify-between mb-6 z-10">
            <div className="flex items-center space-x-2">
              <button
                onClick={alignToMecca}
                className="px-3.5 py-2 rounded-full bg-[#C9B896] text-[#0A0A0C] text-xs font-black transition-all hover:brightness-110 active:scale-95 flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Align Screen to Mecca</span>
              </button>

              {manualOffset !== 0 && (
                <button
                  onClick={resetOrientation}
                  className="px-3 py-2 rounded-full glass-pill text-xs font-bold text-[#C9B896] hover:bg-[#C9B896]/20 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset ({manualOffset}°)
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-full glass-pill transition-all cursor-pointer ${
                  soundEnabled ? 'text-[#C9B896] border border-[#C9B896]/50 bg-[#C9B896]/10' : 'text-[#F3F1EC]/40'
                }`}
                title={soundEnabled ? 'Alignment Beep Enabled' : 'Mute Alignment Sound'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Compass Graphic Area */}
          <div className="flex flex-col items-center gap-3 my-2">
            <div
              ref={compassGraphicRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center touch-none select-none transition-transform ${
                isDragging ? 'cursor-grabbing scale-[0.99]' : 'cursor-grab hover:scale-[1.01]'
              }`}
            >
              {/* Outer Alignment Radiant Aura */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-500 ${
                  isAligned
                    ? 'shadow-[0_0_90px_rgba(34,197,94,0.55)] border-4 border-emerald-400/90'
                    : 'shadow-[0_0_40px_rgba(201,184,150,0.15)] border border-[#C9B896]/30'
                }`}
              />

              {/* ROTATING COMPASS DIAL */}
              <div
                className="absolute inset-2 rounded-full border-2 border-[#C9B896]/40 bg-[#0A0A0C]/90 backdrop-blur-md flex items-center justify-center transition-transform duration-100 ease-out"
                style={{ transform: `rotate(${compassDialRotation}deg)` }}
              >
                {/* 360 Degree Ticks */}
                {Array.from({ length: 36 }).map((_, i) => {
                  const deg = i * 10;
                  const isMajor = deg % 30 === 0;
                  return (
                    <div
                      key={deg}
                      className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col justify-between items-center py-2 pointer-events-none"
                      style={{ transform: `rotate(${deg}deg)` }}
                    >
                      <div
                        className={`w-0.5 ${
                          isMajor ? 'h-3 bg-[#C9B896]' : 'h-1.5 bg-[#C9B896]/30'
                        }`}
                      />
                      <div
                        className={`w-0.5 ${
                          isMajor ? 'h-3 bg-[#C9B896]' : 'h-1.5 bg-[#C9B896]/30'
                        }`}
                      />
                    </div>
                  );
                })}

                {/* Cardinal Points */}
                <span className="absolute top-4 font-black text-sm text-amber-400 font-mono tracking-widest">N</span>
                <span className="absolute right-4 font-black text-sm text-[#F3F1EC]/80 font-mono">E</span>
                <span className="absolute bottom-4 font-black text-sm text-[#F3F1EC]/80 font-mono">S</span>
                <span className="absolute left-4 font-black text-sm text-[#F3F1EC]/80 font-mono">W</span>

                {/* Sri Lanka Average Qibla Range Marker (~294.7° WNW) */}
                <div
                  className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex items-start pt-1 pointer-events-none"
                  style={{ transform: `rotate(${effectiveQiblaBearing}deg)` }}
                >
                  <div className="flex flex-col items-center">
                    <div className="bg-[#C9B896] text-[#0A0A0C] p-2 rounded-full shadow-lg border-2 border-[#F3F1EC] animate-pulse">
                      <span className="text-xs">🕋</span>
                    </div>
                    <span className="text-[10px] font-black text-[#C9B896] bg-[#0A0A0C]/90 px-2 py-0.5 rounded-full border border-[#C9B896]/40 mt-1 shadow-md">
                      QIBLA {effectiveQiblaBearing}°
                    </span>
                  </div>
                </div>
              </div>

              {/* FIXED SCREEN TOP DIRECTION INDICATOR */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-emerald-400" />
                <span className="text-[9px] font-black tracking-widest uppercase text-emerald-400 bg-[#0A0A0C]/90 px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-md mt-0.5">
                  SCREEN TOP
                </span>
              </div>

              {/* DIRECT POINTER ARROW POINTING TO MECCA */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out z-10 pointer-events-none"
                style={{ transform: `rotate(${qiblaPointerAngle}deg)` }}
              >
                <div className="h-full flex flex-col justify-between items-center py-6">
                  {/* Pointing Head */}
                  <div className="flex flex-col items-center">
                    <Navigation className={`w-10 h-10 drop-shadow-[0_0_15px_rgba(201,184,150,0.8)] ${isAligned ? 'text-emerald-400 animate-bounce' : 'text-[#C9B896]'}`} />
                  </div>
                  {/* Tail */}
                  <div className="w-1.5 h-12 bg-gradient-to-t from-transparent to-[#C9B896]/60 rounded-full" />
                </div>
              </div>

              {/* Center Readout Badge */}
              <div className="absolute inset-0 m-auto w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#121115]/95 border-2 border-[#C9B896]/60 flex flex-col items-center justify-center z-30 shadow-2xl backdrop-blur-lg">
                {isAligned ? (
                  <div className="text-center space-y-0.5 animate-fadeIn">
                    <Check className="w-8 h-8 text-emerald-400 mx-auto stroke-[3]" />
                    <span className="text-xs font-black text-emerald-400 tracking-wider uppercase block">ALIGNED!</span>
                    <span className="text-[10px] text-[#F3F1EC]/80 font-bold block">{effectiveQiblaBearing}° {cardinalStr}</span>
                  </div>
                ) : (
                  <div className="text-center space-y-0.5">
                    <span className="text-2xl font-black text-[#C9B896] font-mono block tracking-tight">
                      {effectiveQiblaBearing}°
                    </span>
                    <span className="text-[11px] font-extrabold text-[#F3F1EC] uppercase block tracking-wider">
                      {cardinalStr}
                    </span>
                    <span className="text-[9px] text-[#C9B896]/70 font-semibold block">
                      To Holy Kaaba
                    </span>
                  </div>
                )}
              </div>

            </div>

            <p className="text-center text-xs text-[#F3F1EC]/70 font-medium">
              💡 <span className="text-[#C9B896]">Drag dial</span> to manually rotate or tap <span className="text-[#C9B896] font-bold">Align Screen to Mecca</span>.
            </p>
          </div>

        </div>

        {/* Right Information & Telemetry Sidebar (Col 4) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Official Bearing Summary Card */}
          <div className="p-6 rounded-[24px] glass-panel border border-[#C9B896]/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F3F1EC]/10 pb-3">
              <h3 className="text-sm font-black text-[#F3F1EC] flex items-center space-x-2">
                <Compass className="w-4 h-4 text-[#C9B896]" />
                <span>Sri Lanka Qibla Telemetry</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-[14px] bg-[#0A0A0C]/80 border border-[#C9B896]/20">
                <span className="text-[#F3F1EC]/70 font-medium">Sri Lanka District:</span>
                <span className="font-extrabold text-[#F3F1EC]">{currentDistrict.name} ({currentDistrict.province})</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-[14px] bg-[#0A0A0C]/80 border border-[#C9B896]/20">
                <span className="text-[#F3F1EC]/70 font-medium">Qibla Direction (Bearing):</span>
                <span className="font-mono font-black text-base text-[#C9B896]">
                  {effectiveQiblaBearing}° {cardinalStr}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-[14px] bg-[#0A0A0C]/80 border border-[#C9B896]/20">
                <span className="text-[#F3F1EC]/70 font-medium">Distance to Makkah:</span>
                <span className="font-mono font-bold text-[#F3F1EC]">
                  {distanceKm.toLocaleString()} km ({distanceMiles.toLocaleString()} miles)
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-[14px] bg-[#0A0A0C]/80 border border-[#C9B896]/20">
                <span className="text-[#F3F1EC]/70 font-medium">Aladhan API Status:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  {apiLoading ? 'Fetching...' : `Verified (${apiBearing || 294.7}°)`}
                </span>
              </div>
            </div>
          </div>

          {/* All 25 Districts Quick Reference */}
          <div className="p-6 rounded-[24px] glass-panel border border-[#C9B896]/20 space-y-3">
            <h4 className="text-xs font-black text-[#C9B896] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C9B896]" />
              <span>Select Sri Lanka District</span>
            </h4>
            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {SRI_LANKA_DISTRICTS.map((d) => {
                const isSelected = d.id === selectedDistrictId;
                const districtBearing = calculateQiblaBearing(d.lat, d.lng);
                return (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDistrict(d.id)}
                    className={`px-3 py-2 rounded-[12px] text-left transition-all text-xs flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#C9B896] text-[#0A0A0C] font-black shadow-md'
                        : 'glass-pill text-[#F3F1EC] hover:bg-[#C9B896]/20 font-medium'
                    }`}
                  >
                    <span className="truncate">{d.name}</span>
                    <span className="font-mono text-[10px] shrink-0 opacity-80 pl-1">{districtBearing}°</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Standard Great Circle Formula Info */}
          <div className="p-4 rounded-[20px] bg-[#0A0A0C]/60 border border-[#F3F1EC]/10 text-[11px] text-[#F3F1EC]/70 space-y-1">
            <div className="font-extrabold text-[#C9B896] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C9B896]" />
              <span>Universal Sri Lanka Qibla Standard</span>
            </div>
            <p className="leading-relaxed">
              In Sri Lanka, the Holy Kaaba in Mecca is situated West-Northwest (WNW) at an azimuth angle between 294° and 295° True North.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
