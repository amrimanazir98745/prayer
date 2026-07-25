import React, { useState } from 'react';
import { District } from '../types/prayer';
import { calculateDailyPrayerSchedule, isSriLankaToday, getSriLankaTimeParts } from '../utils/prayerCalculator';
import { Calendar, Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthlyCalendarProps {
  district: District;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ district }) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => getSriLankaTimeParts(new Date()).dateObj);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = MONTH_NAMES[month];

  const monthlySchedules = Array.from({ length: daysInMonth }).map((_, i) => {
    const dayDate = new Date(year, month, i + 1);
    return calculateDailyPrayerSchedule(dayDate, district.lat, district.lng, district.id);
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(getSriLankaTimeParts(new Date()).dateObj);
  };

  const handleSelectMonth = (mIdx: number) => {
    setCurrentDate(new Date(year, mIdx, 1));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = ['Date', 'Day', 'Hijri Date', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const rows = monthlySchedules.map(s => [
      s.dateFormatted,
      s.dayName,
      `"${s.hijriDate}"`,
      s.prayers.Fajr.time12,
      s.prayers.Sunrise.time12,
      s.prayers.Dhuhr.time12,
      s.prayers.Asr.time12,
      s.prayers.Maghrib.time12,
      s.prayers.Isha.time12,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Prayer_Schedule_${district.name}_${monthName}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6 print:m-0 print:p-0">
      
      {/* Top Header Card */}
      <div className="p-4 sm:p-6 rounded-[20px] glass-panel shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2 text-[#C9B896] text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>MONTHLY PRAYER TIMETABLE</span>
            <span className="text-[#F3F1EC]/30">•</span>
            <span className="text-[#F3F1EC]">SRI LANKA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F3F1EC] mt-1 font-['Anek_Tamil',sans-serif]">
            {monthName} {year} - <span className="text-[#C9B896]">{district.name} District</span>
          </h2>
          <p className="text-xs text-[#F3F1EC]/65 mt-1 flex flex-wrap items-center gap-1.5">
            <span>Official monthly prayer timetable & Hijri dates synced with All Ceylon Jamiyyathul Ulama (ACJU) Sri Lanka for {district.name} ({district.province}).</span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          
          {/* Month Steppers */}
          <div className="flex items-center glass-pill rounded-[14px] p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-[#F3F1EC]/65 hover:text-[#F3F1EC] hover:bg-[#C9B896]/15 rounded-[10px] transition-colors active:scale-[0.97] cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentMonth}
              className="px-2.5 py-1 text-xs font-bold text-[#C9B896] hover:bg-[#C9B896]/20 rounded-[10px] transition-colors cursor-pointer"
            >
              Current
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-[#F3F1EC]/65 hover:text-[#F3F1EC] hover:bg-[#C9B896]/15 rounded-[10px] transition-colors active:scale-[0.97] cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-[14px] glass-pill text-[#F3F1EC] text-xs font-bold transition-all active:scale-[0.97] cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#C9B896]" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-[14px] glass-btn-accent text-[#C9B896] text-xs font-bold transition-all active:scale-[0.97] cursor-pointer"
            title="Print Timetable"
          >
            <Printer className="w-3.5 h-3.5 text-[#C9B896]" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Month Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar print:hidden">
        {MONTH_NAMES.map((mName, idx) => (
          <button
            key={mName}
            onClick={() => handleSelectMonth(idx)}
            className={`px-3 py-1.5 rounded-[14px] text-xs font-bold transition-all whitespace-nowrap active:scale-[0.97] cursor-pointer ${
              idx === month
                ? 'glass-btn-accent text-[#C9B896] font-extrabold'
                : 'glass-pill text-[#F3F1EC]/65 hover:text-[#F3F1EC]'
            }`}
          >
            {mName}
          </button>
        ))}
      </div>

      {/* Printable Title Block */}
      <div className="hidden print:block text-slate-900 mb-6 text-center">
        <h1 className="text-2xl font-bold uppercase">Sri Lanka Prayer Timetable - {monthName} {year}</h1>
        <p className="text-sm">District: {district.name} ({district.province}) | Latitude: {district.lat}°N, Longitude: {district.lng}°E</p>
      </div>

      {/* Monthly Table */}
      <div className="overflow-hidden rounded-[20px] glass-panel shadow-2xl border border-[#F3F1EC]/12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-0 font-['Anek_Tamil',sans-serif]">
            <thead>
              <tr className="bg-[#1C1B1F]/90 text-[#C9B896] text-[11px] sm:text-xs font-bold uppercase border-b border-[#F3F1EC]/10">
                <th className="py-3.5 px-3 sm:px-4">Date</th>
                <th className="py-3.5 px-3 sm:px-4 hidden sm:table-cell">Day</th>
                <th className="py-3.5 px-3 sm:px-4 hidden sm:table-cell">Hijri Date</th>
                <th className="py-3.5 px-3 sm:px-4 text-[#C9B896] font-black">Fajr</th>
                <th className="py-3.5 px-3 sm:px-4 text-[#F3F1EC]/65">Sunrise</th>
                <th className="py-3.5 px-3 sm:px-4">Dhuhr</th>
                <th className="py-3.5 px-3 sm:px-4">Asr</th>
                <th className="py-3.5 px-3 sm:px-4 text-[#C9B896] font-black">Maghrib</th>
                <th className="py-3.5 px-3 sm:px-4">Isha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F1EC]/10 text-xs font-medium text-[#F3F1EC]">
              {monthlySchedules.map((s) => {
                const isToday = isSriLankaToday(s.date);

                return (
                  <tr
                    key={s.dateFormatted}
                    className={`transition-colors hover:bg-[#C9B896]/10 ${
                      isToday
                        ? 'bg-[#C9B896]/20 font-bold text-[#F3F1EC] border-l-4 border-l-[#C9B896]'
                        : s.date.getDay() === 5
                        ? 'bg-[#8F8066]/20 font-semibold'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-3 sm:px-4 font-bold whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span>{s.dateFormatted}</span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 rounded-[8px] glass-btn-accent text-[#C9B896] font-black uppercase text-[9px]">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#C9B896] font-semibold sm:hidden">{s.hijriDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 hidden sm:table-cell text-[#F3F1EC]/65 whitespace-nowrap">
                      {s.dayName}
                    </td>
                    <td className="py-3 px-3 sm:px-4 hidden sm:table-cell text-[#C9B896] font-semibold whitespace-nowrap">
                      {s.hijriDate}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-mono font-bold text-[#C9B896] whitespace-nowrap">
                      {s.prayers.Fajr.time12}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-mono text-[#F3F1EC]/65 whitespace-nowrap">
                      {s.prayers.Sunrise.time12}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-mono font-semibold text-[#F3F1EC] whitespace-nowrap">
                      {s.prayers.Dhuhr.time12}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-mono font-semibold text-[#F3F1EC] whitespace-nowrap">
                      {s.prayers.Asr.time12}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-mono font-bold text-[#C9B896] whitespace-nowrap">
                      {s.prayers.Maghrib.time12}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-mono font-semibold text-[#F3F1EC] whitespace-nowrap">
                      {s.prayers.Isha.time12}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
