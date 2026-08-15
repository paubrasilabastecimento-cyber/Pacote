export const formatCurrency = (val: number, precision: number = 2): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(val || 0);
};

export const formatHL = (val: number, maxDecimals: number = 4): string => {
  const num = val || 0;
  // If it is a very small non-zero value, display up to 4 decimal places so it doesn't display as 0,00 HL
  const minDecimals = Math.abs(num) > 0 && Math.abs(num) < 0.01 ? 4 : 2;
  return (
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(num) + ' HL'
  );
};

export const formatPercent = (val: number): string => {
  return (
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(val || 0) + '%'
  );
};

export const formatNumber = (val: number): string => {
  return new Intl.NumberFormat('pt-BR').format(val || 0);
};

export const formatDateBR = (dateStr: string, includeTime: boolean = false): string => {
  if (!dateStr) return '-';
  
  // Check if string contains both date and time (e.g. "2026-01-01 11:59:15" or "2026-01-01T11:59:15")
  const isISO = dateStr.includes('T');
  const [datePart, timePart] = isISO ? dateStr.split('T') : dateStr.split(' ');
  const parts = (datePart || '').split('-');
  
  let formattedDate = dateStr;
  if (parts.length === 3) {
    formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  if (includeTime && timePart) {
    return `${formattedDate} às ${timePart.slice(0, 8)}`;
  }
  return formattedDate;
};

export const formatMesAno = (mesRef: string): string => {
  if (!mesRef) return '';
  const [ano, mes] = mesRef.split('-');
  const nomesMeses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const idx = parseInt(mes, 10) - 1;
  if (idx >= 0 && idx < 12) {
    return `${nomesMeses[idx]}/${ano}`;
  }
  return mesRef;
};

export const formatMesCurto = (mesRef: string): string => {
  if (!mesRef) return '';
  const [ano, mes] = mesRef.split('-');
  const nomesCurto = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  const idx = parseInt(mes, 10) - 1;
  if (idx >= 0 && idx < 12) {
    return `${nomesCurto[idx]}/${ano ? ano.slice(2) : ''}`;
  }
  return mesRef;
};

export type KPIStatus = 'DENTRO' | 'ATENCAO' | 'FORA';

export const getStatusKPI = (
  kpiKey: 'fgli' | 'scl' | 'rshl' | 'vlchl',
  atual: number,
  meta: number
): KPIStatus => {
  // For losses, lower is better
  if (atual <= meta) return 'DENTRO';
  if (atual <= meta * 1.12) return 'ATENCAO';
  return 'FORA';
};

export const getStatusBadgeConfig = (status: KPIStatus) => {
  switch (status) {
    case 'DENTRO':
      return {
        label: 'Dentro da meta',
        colorClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        dotColor: 'bg-emerald-500',
        icon: '🟢',
      };
    case 'ATENCAO':
      return {
        label: 'Atenção',
        colorClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
        dotColor: 'bg-amber-500',
        icon: '🟡',
      };
    case 'FORA':
      return {
        label: 'Fora da meta',
        colorClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
        dotColor: 'bg-rose-500',
        icon: '🔴',
      };
  }
};
