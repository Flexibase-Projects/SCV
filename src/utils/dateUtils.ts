/**
 * Utilitários para manipulação de datas sem problemas de timezone
 * 
 * IMPORTANTE: Sempre use estas funções ao trabalhar com datas no formato YYYY-MM-DD
 * para evitar problemas de conversão de timezone que causam perda de um dia.
 */

/**
 * Formata data para YYYY-MM-DD usando métodos locais (sem conversão de timezone)
 * 
 * Esta função usa getFullYear(), getMonth() e getDate() que retornam valores
 * no timezone local, evitando problemas de conversão UTC que causam perda de um dia.
 * 
 * @param date - Objeto Date a ser formatado
 * @returns String no formato YYYY-MM-DD ou null se a data for inválida
 * 
 * @example
 * const date = new Date('2024-01-15T10:00:00');
 * formatDateLocal(date); // '2024-01-15'
 */
export function formatDateLocal(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return null as any;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte string de data (YYYY-MM-DD) para Date object sem problemas de timezone
 * 
 * Adiciona 'T12:00:00' para evitar que o JavaScript interprete como UTC midnight,
 * o que causaria problemas de timezone em alguns casos.
 * 
 * @param dateString - String no formato YYYY-MM-DD
 * @returns Date object ou null se a string for inválida
 * 
 * @example
 * parseDateLocal('2024-01-15'); // Date object representando 15/01/2024 12:00 local
 */
export function parseDateLocal(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Se já estiver no formato YYYY-MM-DD, adiciona hora do meio-dia para evitar timezone
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(dateString + 'T12:00:00');
  }

  // Fallback: tenta parsear normalmente
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Valida se uma string está no formato YYYY-MM-DD
 */
export function isValidDateString(dateString: string | null | undefined): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}
