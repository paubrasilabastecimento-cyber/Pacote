import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DateRangePickerPopoverProps {
  isOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
  triggerClassName?: string;
  buttonLabel?: string;
}

// Preset shortcuts matching image
type ShortcutKey =
  | 'hoje'
  | 'ontem'
  | 'ultimos7'
  | 'ultimos30'
  | 'esteMes'
  | 'mesPassado'
  | 'ultimos4meses';

interface Shortcut {
  key: ShortcutKey;
  label: string;
  getRange: (refDate: Date) => { start: string; end: string };
}

const formatDateToISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateToBR = (isoStr: string): string => {
  if (!isoStr) return '-';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const SHORTCUTS: Shortcut[] = [
  {
    key: 'hoje',
    label: 'Hoje',
    getRange: (refDate) => {
      const s = formatDateToISO(refDate);
      return { start: s, end: s };
    },
  },
  {
    key: 'ontem',
    label: 'Ontem',
    getRange: (refDate) => {
      const d = new Date(refDate);
      d.setDate(d.getDate() - 1);
      const s = formatDateToISO(d);
      return { start: s, end: s };
    },
  },
  {
    key: 'ultimos7',
    label: 'Últimos 7 dias',
    getRange: (refDate) => {
      const start = new Date(refDate);
      start.setDate(start.getDate() - 6);
      return { start: formatDateToISO(start), end: formatDateToISO(refDate) };
    },
  },
  {
    key: 'ultimos30',
    label: 'Últimos 30 dias',
    getRange: (refDate) => {
      const start = new Date(refDate);
      start.setDate(start.getDate() - 29);
      return { start: formatDateToISO(start), end: formatDateToISO(refDate) };
    },
  },
  {
    key: 'esteMes',
    label: 'Este Mês',
    getRange: (refDate) => {
      const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      const end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
      return { start: formatDateToISO(start), end: formatDateToISO(end) };
    },
  },
  {
    key: 'mesPassado',
    label: 'Mês Passado',
    getRange: (refDate) => {
      const start = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
      const end = new Date(refDate.getFullYear(), refDate.getMonth(), 0);
      return { start: formatDateToISO(start), end: formatDateToISO(end) };
    },
  },
  {
    key: 'ultimos4meses',
    label: 'Últimos 4 meses',
    getRange: (refDate) => {
      const start = new Date(refDate.getFullYear(), refDate.getMonth() - 3, 1);
      const end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
      return { start: formatDateToISO(start), end: formatDateToISO(end) };
    },
  },
];

const MONTH_NAMES = [
  'AGOSTO', // Will index correctly from array
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
];

const ALL_MONTHS = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
];

const WEEKDAY_NAMES = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export const DateRangePickerPopover: React.FC<DateRangePickerPopoverProps> = ({
  isOpen: controlledIsOpen,
  onClose,
  inline = false,
  triggerClassName = '',
  buttonLabel,
}) => {
  const { filtros, setFiltros } = useApp();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isPopoverOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  // Reference date: system date (2026-08-24)
  const today = new Date();
  const todayISO = formatDateToISO(today);

  // Calendar View month/year navigation state
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth()); // 0-11

  // Temporary selection state until "APLICAR" is clicked
  const [tempStart, setTempStart] = useState<string>(filtros.dataInicio || '');
  const [tempEnd, setTempEnd] = useState<string>(filtros.dataFim || '');
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [activeShortcut, setActiveShortcut] = useState<ShortcutKey | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with filters when opening
  useEffect(() => {
    if (isPopoverOpen) {
      setTempStart(filtros.dataInicio || '');
      setTempEnd(filtros.dataFim || '');

      // Set view month based on current filter or today
      if (filtros.dataInicio) {
        const parts = filtros.dataInicio.split('-');
        if (parts.length === 3) {
          setViewYear(parseInt(parts[0], 10));
          setViewMonth(parseInt(parts[1], 10) - 1);
        }
      } else if (filtros.mes) {
        const parts = filtros.mes.split('-');
        if (parts.length === 2) {
          setViewYear(parseInt(parts[0], 10));
          setViewMonth(parseInt(parts[1], 10) - 1);
        }
      } else {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
      }
    }
  }, [isPopoverOpen, filtros.dataInicio, filtros.dataFim, filtros.mes]);

  // Click outside listener
  useEffect(() => {
    if (inline) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (onClose) onClose();
        else setInternalIsOpen(false);
      }
    };

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen, onClose, inline]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectShortcut = (shortcut: Shortcut) => {
    const range = shortcut.getRange(today);
    setTempStart(range.start);
    setTempEnd(range.end);
    setActiveShortcut(shortcut.key);

    // Also update view month to start date of shortcut
    const parts = range.start.split('-');
    if (parts.length === 3) {
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    }
  };

  const handleDayClick = (isoDate: string) => {
    setActiveShortcut(null);

    if (!tempStart || (tempStart && tempEnd)) {
      // Start a new range
      setTempStart(isoDate);
      setTempEnd('');
    } else if (tempStart && !tempEnd) {
      // Selecting end date
      if (isoDate < tempStart) {
        setTempEnd(tempStart);
        setTempStart(isoDate);
      } else {
        setTempEnd(isoDate);
      }
    }
  };

  const handleClear = () => {
    setTempStart('');
    setTempEnd('');
    setActiveShortcut(null);
    setFiltros((prev) => ({
      ...prev,
      dataInicio: '',
      dataFim: '',
      mes: '',
    }));
    if (onClose) onClose();
    else setInternalIsOpen(false);
  };

  const handleApply = () => {
    setFiltros((prev) => {
      const finalEnd = tempEnd || tempStart;
      const updated = {
        ...prev,
        dataInicio: tempStart,
        dataFim: finalEnd,
      };

      // If user selected an exact month range (e.g. 2026-08-01 to 2026-08-31), sync mes
      if (tempStart && finalEnd) {
        const sParts = tempStart.split('-');
        const eParts = finalEnd.split('-');
        if (sParts[0] === eParts[0] && sParts[1] === eParts[1]) {
          updated.mes = `${sParts[0]}-${sParts[1]}`;
        }
      }

      return updated;
    });

    if (onClose) onClose();
    else setInternalIsOpen(false);
  };

  // Generate calendar days for current viewMonth/viewYear
  const calendarDays = React.useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    const firstDayWeekday = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = lastDayOfMonth.getDate();

    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();

    const days: {
      dayNumber: number;
      isoDate: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month padding days
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const iso = formatDateToISO(prevDate);
      days.push({
        dayNumber: dayNum,
        isoDate: iso,
        isCurrentMonth: false,
        isToday: iso === todayISO,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const curDate = new Date(viewYear, viewMonth, i);
      const iso = formatDateToISO(curDate);
      days.push({
        dayNumber: i,
        isoDate: iso,
        isCurrentMonth: true,
        isToday: iso === todayISO,
      });
    }

    // Next month padding days to complete full grid
    const remainingCells = (7 - (days.length % 7)) % 7;
    const totalToPad = remainingCells < 7 && days.length < 35 ? remainingCells + 7 : remainingCells;
    for (let i = 1; i <= totalToPad; i++) {
      const nextDate = new Date(viewYear, viewMonth + 1, i);
      const iso = formatDateToISO(nextDate);
      days.push({
        dayNumber: i,
        isoDate: iso,
        isCurrentMonth: false,
        isToday: iso === todayISO,
      });
    }

    return days;
  }, [viewYear, viewMonth, todayISO]);

  const isInRange = (isoDate: string) => {
    if (!tempStart) return false;
    const end = tempEnd || hoverDate;
    if (!end) return false;
    const s = tempStart < end ? tempStart : end;
    const e = tempStart < end ? end : tempStart;
    return isoDate >= s && isoDate <= e;
  };

  const isRangeStart = (isoDate: string) => {
    if (!tempStart) return false;
    const end = tempEnd || hoverDate;
    if (!end) return isoDate === tempStart;
    const s = tempStart < end ? tempStart : end;
    return isoDate === s;
  };

  const isRangeEnd = (isoDate: string) => {
    if (!tempStart) return false;
    const end = tempEnd || hoverDate;
    if (!end) return isoDate === tempStart;
    const e = tempStart < end ? end : tempStart;
    return isoDate === e;
  };

  // Label text for trigger
  const getTriggerText = () => {
    if (buttonLabel) return buttonLabel;
    if (filtros.dataInicio && filtros.dataFim) {
      if (filtros.dataInicio === filtros.dataFim) {
        return formatDateToBR(filtros.dataInicio);
      }
      return `${formatDateToBR(filtros.dataInicio)} - ${formatDateToBR(filtros.dataFim)}`;
    }
    if (filtros.mes) {
      const parts = filtros.mes.split('-');
      if (parts.length === 2) {
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${ALL_MONTHS[mIdx] || parts[1]} / ${parts[0]}`;
      }
    }
    return 'Filtrar por Período';
  };

  const hasActiveDateFilter = Boolean(filtros.dataInicio || filtros.dataFim);

  return (
    <div className={`relative inline-block ${inline ? 'w-full' : ''}`} ref={containerRef}>
      {/* Trigger Button (if not inline) */}
      {!inline && (
        <button
          type="button"
          onClick={() => setInternalIsOpen(!internalIsOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
            hasActiveDateFilter || isPopoverOpen
              ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
          } ${triggerClassName}`}
          title="Filtro de Data & Período (Atalhos e Calendário)"
        >
          <CalendarIcon className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate font-medium">{getTriggerText()}</span>
          {hasActiveDateFilter && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-0.5 hover:bg-amber-500/20 rounded text-amber-400 ml-0.5"
              title="Limpar Período"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </button>
      )}

      {/* Popover Content */}
      {(isPopoverOpen || inline) && (
        <div
          className={`${
            inline
              ? 'w-full'
              : 'absolute right-0 mt-2 z-50 animate-in fade-in zoom-in-95 duration-150'
          } bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row w-[330px] sm:w-[540px] max-w-[96vw] select-none`}
        >
          {/* LEFT SIDEBAR: ATALHOS */}
          <div className="w-full sm:w-[150px] bg-white border-b sm:border-b-0 sm:border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
            <div>
              <div className="text-[12px] font-black text-slate-400 tracking-wider uppercase mb-3">
                ATALHOS
              </div>

              <div className="space-y-1.5">
                {SHORTCUTS.map((shortcut) => {
                  const isCurActive = activeShortcut === shortcut.key;
                  return (
                    <button
                      key={shortcut.key}
                      type="button"
                      onClick={() => handleSelectShortcut(shortcut)}
                      className={`w-full text-left py-1 text-[13px] font-medium transition-colors cursor-pointer block ${
                        isCurActive
                          ? 'text-slate-950 font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {shortcut.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LIMPAR FILTRO (RED BUTTON) */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClear}
                className="w-full text-left py-1 text-[12px] font-black text-[#ff1744] hover:text-rose-700 transition-colors uppercase tracking-wider cursor-pointer leading-tight"
              >
                LIMPAR<br />FILTRO
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: CALENDAR AREA */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between bg-white">
            <div>
              {/* Header: Month & Year Navigator */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Mês Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-xs sm:text-sm font-black text-[#0f2b48] uppercase tracking-wider">
                  {ALL_MONTHS[viewMonth]} {viewYear}
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Próximo Mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {WEEKDAY_NAMES.map((w) => (
                  <div
                    key={w}
                    className="text-[11px] font-black text-slate-400 tracking-wider py-0.5"
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {calendarDays.map((item, index) => {
                  const inRange = isInRange(item.isoDate);
                  const isStart = isRangeStart(item.isoDate);
                  const isEnd = isRangeEnd(item.isoDate);
                  const isSingleSelected =
                    (item.isoDate === tempStart && !tempEnd) ||
                    (item.isoDate === tempStart && tempStart === tempEnd);

                  // Styling
                  let textStyle = item.isCurrentMonth
                    ? 'text-slate-800 font-bold'
                    : 'text-slate-300 font-normal';

                  let btnBg = 'hover:bg-slate-100';
                  if (isSingleSelected || isStart || isEnd) {
                    btnBg = 'bg-[#0f2b48] text-white font-black rounded-lg shadow-sm';
                    textStyle = 'text-white font-black';
                  } else if (inRange) {
                    btnBg = 'bg-blue-50 text-[#0f2b48] font-bold';
                  }

                  return (
                    <div
                      key={`${item.isoDate}-${index}`}
                      className={`relative flex items-center justify-center py-0.5 ${
                        inRange && !isStart && !isEnd ? 'bg-blue-50/70' : ''
                      } ${isStart && tempEnd ? 'bg-gradient-to-r from-transparent to-blue-50/70' : ''} ${
                        isEnd && tempStart ? 'bg-gradient-to-l from-transparent to-blue-50/70' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleDayClick(item.isoDate)}
                        onMouseEnter={() => {
                          if (tempStart && !tempEnd) {
                            setHoverDate(item.isoDate);
                          }
                        }}
                        onMouseLeave={() => setHoverDate(null)}
                        className={`w-8 h-8 sm:w-9 sm:h-8 flex flex-col items-center justify-center text-xs transition-all cursor-pointer relative rounded-md ${textStyle} ${btnBg}`}
                      >
                        <span>{item.dayNumber}</span>
                        {/* Blue dot for today (as in screenshot) */}
                        {item.isToday && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full absolute -bottom-0.5 ${
                              isStart || isEnd || isSingleSelected
                                ? 'bg-amber-300'
                                : 'bg-blue-600'
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM FOOTER BAR */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {/* Left: Custom Range Label */}
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  CUSTOMIZADO
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 leading-tight">
                  {tempStart
                    ? `${formatDateToBR(tempStart)} ${tempEnd ? `- ${formatDateToBR(tempEnd)}` : ''}`
                    : '-'}
                </span>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-md text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  LIMPAR
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#0f2b48] hover:bg-[#091a2c] text-white text-[11px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>APLICAR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

