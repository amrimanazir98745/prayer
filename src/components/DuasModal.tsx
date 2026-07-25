import React, { useState } from 'react';
import { ISLAMIC_DUAS } from '../utils/duasData';
import { Copy, Check, Search } from 'lucide-react';
import { DuaIcon } from './IslamicIcons';

export const DuasModal: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredDuas = ISLAMIC_DUAS.filter(dua => {
    const matchesCategory = selectedCategory === 'all' || dua.category === selectedCategory;
    const matchesQuery = dua.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dua.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dua.translation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleCopy = (duaId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(duaId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Banner */}
      <div className="p-4 sm:p-6 rounded-[20px] glass-panel shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#C9B896] text-xs font-bold uppercase tracking-wider">
              <DuaIcon className="w-4 h-4 text-[#C9B896]" />
              <span>ISLAMIC DUAS & SUPPLICATIONS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#F3F1EC] mt-1 font-['Anek_Tamil',sans-serif]">Daily Azkar & Adhan Duas</h2>
            <p className="text-xs text-[#F3F1EC]/65 mt-1">
              Authentic supplications for Adhan, Wudu, and after daily prayers with Arabic & English translations.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#F3F1EC]/40" />
            <input
              type="text"
              placeholder="Search supplications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-[14px] bg-[#1C1B1F]/90 border border-[#F3F1EC]/20 text-xs text-[#F3F1EC] focus:outline-none focus:border-[#C9B896] font-medium placeholder-[#F3F1EC]/40"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
        {['all', 'adhan', 'prayer', 'wudu'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-[14px] text-xs font-bold capitalize transition-all whitespace-nowrap active:scale-[0.97] cursor-pointer ${
              selectedCategory === cat
                ? 'glass-btn-accent text-[#C9B896] font-extrabold'
                : 'glass-pill text-[#F3F1EC]/65 hover:text-[#F3F1EC]'
            }`}
          >
            {cat === 'all' ? 'All Duas' : `${cat} Duas`}
          </button>
        ))}
      </div>

      {/* Dua Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDuas.map((dua) => (
          <div
            key={dua.id}
            className="p-5 sm:p-6 rounded-[20px] glass-panel shadow-2xl flex flex-col justify-between space-y-4 hover:border-[#C9B896]/40 transition-all font-['Anek_Tamil',sans-serif]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-[8px] text-[10px] font-bold uppercase tracking-wider glass-pill text-[#C9B896]">
                  {dua.category}
                </span>

                <button
                  onClick={() => handleCopy(dua.id, `${dua.title}\n\n${dua.arabic}\n\n${dua.transliteration}\n\n${dua.translation}`)}
                  className="p-1.5 rounded-[10px] glass-pill text-[#F3F1EC]/65 hover:text-[#F3F1EC] transition-colors active:scale-[0.97] cursor-pointer"
                  title="Copy Dua"
                >
                  {copiedId === dua.id ? <Check className="w-4 h-4 text-[#C9B896]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <h3 className="text-base font-extrabold text-[#F3F1EC] font-['Anek_Tamil',sans-serif]">{dua.title}</h3>

              {/* Arabic Script */}
              <div className="p-4 rounded-[14px] bg-[#1C1B1F]/80 border border-[#C9B896]/30 font-arabic text-xl sm:text-2xl text-[#C9B896] text-right leading-relaxed dir-rtl">
                {dua.arabic}
              </div>

              {/* Transliteration */}
              <div className="text-xs text-[#C9B896] font-medium italic leading-relaxed">
                {dua.transliteration}
              </div>

              {/* Translation */}
              <div className="text-xs text-[#F3F1EC]/65 leading-relaxed">
                "{dua.translation}"
              </div>
            </div>

            {/* Reference Footer */}
            <div className="pt-3 border-t border-[#F3F1EC]/10 text-[10px] text-[#F3F1EC]/65 font-medium">
              Reference: {dua.reference}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
