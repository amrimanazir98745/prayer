import React, { useState } from 'react';
import { Volume2, VolumeX, RotateCcw, CheckCircle, Flame } from 'lucide-react';
import { TasbihIcon } from './IslamicIcons';
import { playTasbihClickSound } from '../utils/audioSynthesizer';

interface DhikrPreset {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  target: number;
}

const PRESETS: DhikrPreset[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'SubhanAllah',
    translation: 'Glory be to Allah',
    target: 33,
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    translation: 'Praise be to Allah',
    target: 33,
  },
  {
    id: 'allahuakbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah is the Greatest',
    target: 33,
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    translation: 'I seek forgiveness from Allah',
    target: 100,
  },
  {
    id: 'lailahaillallah',
    arabic: 'لَا إِلٰهَ إِلَّا اللَّهُ',
    transliteration: 'La Ilaha Illallah',
    translation: 'There is no deity worthy of worship except Allah',
    target: 100,
  },
];

export const TasbihCounter: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<DhikrPreset>(PRESETS[0]);
  const [count, setCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [totalToday, setTotalToday] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    setTotalToday(prev => prev + 1);

    if (soundEnabled) {
      playTasbihClickSound();
    }

    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch (e) {
        // ignore
      }
    }

    if (newCount >= selectedPreset.target) {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setCount(0);
    setIsCompleted(false);
  };

  const handleSelectPreset = (preset: DhikrPreset) => {
    setSelectedPreset(preset);
    setCount(0);
    setIsCompleted(false);
  };

  const progressPercent = Math.min(100, (count / selectedPreset.target) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Top Banner */}
      <div className="p-4 sm:p-6 rounded-[20px] glass-panel shadow-2xl text-center">
        <div className="inline-flex items-center space-x-2 text-[#C9B896] text-xs font-bold uppercase tracking-wider mb-1">
          <TasbihIcon className="w-4 h-4 text-[#C9B896]" />
          <span>DIGITAL TASBIH & DHIKR COUNTER</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#F3F1EC] font-['Anek_Tamil',sans-serif]">Daily Remembrance of Allah</h2>
        <p className="text-xs text-[#F3F1EC]/65 mt-1">
          Tap the counter ring to count your dhikr with gentle sound & vibration feedback.
        </p>
      </div>

      {/* Preset Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelectPreset(preset)}
            className={`px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all whitespace-nowrap active:scale-[0.97] cursor-pointer ${
              selectedPreset.id === preset.id
                ? 'glass-btn-accent text-[#C9B896] font-extrabold'
                : 'glass-pill text-[#F3F1EC]/65 hover:text-[#F3F1EC]'
            }`}
          >
            <span>{preset.transliteration}</span>
            <span className="ml-1.5 opacity-70">({preset.target})</span>
          </button>
        ))}
      </div>

      {/* Dhikr Card */}
      <div className="p-6 sm:p-8 rounded-[20px] glass-panel shadow-2xl flex flex-col items-center justify-center space-y-6 text-center relative overflow-hidden font-['Anek_Tamil',sans-serif]">
        
        {/* Audio Toggle & Reset buttons */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-[14px] glass-pill text-[#F3F1EC] transition-all active:scale-[0.97] cursor-pointer"
            title={soundEnabled ? 'Click sound ON' : 'Click sound OFF'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#C9B896]" /> : <VolumeX className="w-4 h-4 text-[#F3F1EC]/35" />}
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-[14px] glass-pill text-[#F3F1EC] transition-all hover:text-[#C9B896] active:scale-[0.97] cursor-pointer"
            title="Reset Count"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Dhikr Phrase */}
        <div className="space-y-2 pt-2">
          <div className="font-arabic text-3xl sm:text-4xl text-[#C9B896] font-bold tracking-wide">
            {selectedPreset.arabic}
          </div>
          <div className="text-lg font-black text-[#F3F1EC] font-['Anek_Tamil',sans-serif]">
            {selectedPreset.transliteration}
          </div>
          <div className="text-xs text-[#F3F1EC]/65 italic">
            "{selectedPreset.translation}"
          </div>
        </div>

        {/* Big Tap Button Ring */}
        <div className="relative my-2 sm:my-4">
          <button
            onClick={handleIncrement}
            className={`w-48 h-48 sm:w-60 sm:h-60 rounded-full flex flex-col items-center justify-center border-8 transition-all duration-150 active:scale-[0.97] shadow-2xl cursor-pointer ${
              isCompleted
                ? 'bg-[#8F8066] text-[#C9B896] border-[#C9B896] shadow-[0_0_50px_rgba(201,184,150,0.3)]'
                : 'bg-[#1C1B1F]/80 border-[#C9B896]/30 hover:border-[#C9B896] backdrop-blur-md'
            }`}
          >
            <span className={`text-5xl sm:text-6xl font-mono font-black tracking-tight ${isCompleted ? 'text-[#EDE3D0]' : 'text-[#F3F1EC]'}`}>
              {count}
            </span>
            <span className={`text-xs font-bold uppercase tracking-widest mt-1 ${isCompleted ? 'text-[#EDE3D0]' : 'text-[#F3F1EC]/65'}`}>
              / {selectedPreset.target}
            </span>
            <span className={`text-[10px] uppercase font-extrabold mt-2 text-[#C9B896]`}>
              TAP TO COUNT
            </span>
          </button>

          <div className="absolute inset-0 pointer-events-none rounded-full border-4 border-[#C9B896]/30" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${progressPercent}%, 0 ${progressPercent}%)` }}></div>
        </div>

        {/* Completion Toast Banner */}
        {isCompleted && (
          <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full glass-btn-accent text-[#C9B896] font-black text-xs uppercase tracking-wider shadow-lg animate-bounce">
            <CheckCircle className="w-4 h-4 text-[#C9B896]" />
            <span>MashaAllah! Goal Completed ({selectedPreset.target})</span>
          </div>
        )}

        {/* Statistics Row */}
        <div className="pt-4 border-t border-[#F3F1EC]/10 w-full flex justify-around text-xs text-[#F3F1EC]/65 font-medium">
          <div className="flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-[#C9B896]" />
            <span>Total Recited Today: <strong className="text-[#F3F1EC] font-mono">{totalToday}</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
};
