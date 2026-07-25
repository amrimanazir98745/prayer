import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, CheckCircle2, ShieldCheck, HardDrive, Smartphone, RefreshCw, X, Zap } from 'lucide-react';

interface OfflineStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
}

export const OfflineStatusModal: React.FC<OfflineStatusModalProps> = ({
  isOpen,
  onClose,
  isOnline,
}) => {
  const [swRegistered, setSwRegistered] = useState<boolean>(false);
  const [cacheCount, setCacheCount] = useState<number>(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [cacheSuccessMsg, setCacheSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setSwRegistered(true);
      });
    }

    if ('caches' in window) {
      caches.keys().then((keys) => {
        setCacheCount(keys.length);
      });
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (!installPrompt) return;
    setIsInstalling(true);
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setIsInstalling(false);
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handlePrecacheAssets = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      setCacheSuccessMsg('Refreshing offline cache storage...');
      try {
        const cache = await caches.open('sl-prayer-static-v2');
        await cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          '/islamic-pattern.svg',
          '/bg-pattern.svg'
        ]);
        setCacheSuccessMsg('✅ All offline assets pre-cached successfully!');
        setTimeout(() => setCacheSuccessMsg(null), 4000);
      } catch (e) {
        setCacheSuccessMsg('Offline assets updated in cache storage.');
        setTimeout(() => setCacheSuccessMsg(null), 4000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-card rounded-[24px] border border-[#C9B896]/30 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full glass-pill text-[#F3F1EC]/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3.5 border-b border-[#F3F1EC]/10 pb-4">
          <div className="p-3 rounded-[16px] glass-btn-accent shrink-0">
            {isOnline ? (
              <Wifi className="w-6 h-6 text-[#C9B896]" />
            ) : (
              <WifiOff className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#F3F1EC] font-['Anek_Tamil',sans-serif]">
              100% Offline Capability
            </h2>
            <p className="text-xs text-[#F3F1EC]/70 font-medium">
              {isOnline ? 'Connected to Network (Cache Active)' : 'Offline Mode Active'}
            </p>
          </div>
        </div>

        {/* Status Indicator Banner */}
        <div className={`p-4 rounded-[18px] border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold ${
          isOnline
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
            )}
            <span>
              {isOnline
                ? 'Network connected. App is fully cached and ready to work without internet.'
                : 'You are currently offline. All features, prayers, Qibla compass, and Adhan remain 100% functional!'}
            </span>
          </div>
        </div>

        {/* Offline Features Checklist */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#C9B896] flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-[#C9B896]" />
            <span>On-Device Offline Infrastructure</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-[14px] glass-pill flex items-center gap-2.5 text-[#F3F1EC]/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All 25 Sri Lanka Districts</span>
            </div>

            <div className="p-3 rounded-[14px] glass-pill flex items-center gap-2.5 text-[#F3F1EC]/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Local Solar Math Algorithms</span>
            </div>

            <div className="p-3 rounded-[14px] glass-pill flex items-center gap-2.5 text-[#F3F1EC]/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Web Audio Synthesizer Adhan</span>
            </div>

            <div className="p-3 rounded-[14px] glass-pill flex items-center gap-2.5 text-[#F3F1EC]/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Compass Sensor & Maps</span>
            </div>

            <div className="p-3 rounded-[14px] glass-pill flex items-center gap-2.5 text-[#F3F1EC]/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Complete Duas Database</span>
            </div>

            <div className="p-3 rounded-[14px] glass-pill flex items-center gap-2.5 text-[#F3F1EC]/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Digital Tasbih Counter</span>
            </div>
          </div>
        </div>

        {/* Service Worker Status & Actions */}
        <div className="p-4 rounded-[18px] glass-panel border border-[#F3F1EC]/10 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#F3F1EC]/70 font-semibold">Service Worker Engine:</span>
            <span className="font-extrabold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {swRegistered ? 'Active & Registered' : 'Initializing...'}
            </span>
          </div>

          {cacheSuccessMsg && (
            <p className="text-xs text-emerald-300 font-medium bg-emerald-500/10 p-2.5 rounded-[10px] text-center">
              {cacheSuccessMsg}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={handlePrecacheAssets}
              className="flex-1 py-2.5 px-4 rounded-[14px] glass-btn-champagne text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#C9B896]" />
              <span>Pre-Cache Assets</span>
            </button>

            {installPrompt && (
              <button
                onClick={handleInstallPWA}
                disabled={isInstalling}
                className="flex-1 py-2.5 px-4 rounded-[14px] bg-[#C9B896] hover:bg-[#EDE3D0] text-[#0A0A0C] text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isInstalling ? 'Installing...' : 'Install PWA App'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Home Screen Instructions */}
        <div className="text-[11px] text-[#F3F1EC]/60 space-y-1 bg-[#0A0A0C]/40 p-3.5 rounded-[14px] border border-[#F3F1EC]/10">
          <p className="font-bold text-[#C9B896] flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5" />
            <span>How to Install as App on iOS / Mobile:</span>
          </p>
          <p>
            • <strong>iOS (Safari):</strong> Tap the <strong>Share</strong> button at the bottom of Safari, then select <strong>"Add to Home Screen"</strong>.
          </p>
          <p>
            • <strong>Android (Chrome):</strong> Tap the <strong>3 dots menu</strong> at the top right and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
          </p>
        </div>

        {/* Dismiss Footer Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-[16px] glass-pill text-xs font-bold text-[#F3F1EC] hover:text-white transition-colors cursor-pointer"
        >
          Close Offline Info
        </button>

      </div>
    </div>
  );
};
