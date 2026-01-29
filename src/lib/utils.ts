// Utilitários para formatação de dados e tempo

/**
 * Formata uma data no formato brasileiro
 * @param date - Data a ser formatada
 * @returns String formatada como "DD/MM/AAAA"
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR')
}

/**
 * Formata um horário no formato 24h
 * @param date - Data/hora a ser formatada
 * @returns String formatada como "HH:MM"
 */
export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

/**
 * Calcula a diferença em horas entre dois horários
 * @param start - Horário de início
 * @param end - Horário de fim
 * @returns Diferença em horas formatada
 */
export function calculateWorkHours(start: Date | string, end: Date | string): string {
  const startTime = new Date(start)
  const endTime = new Date(end)
  const diffMs = endTime.getTime() - startTime.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  const hours = Math.floor(diffHours)
  const minutes = Math.round((diffHours - hours) * 60)
  
  return `${hours}h ${minutes}m`
}

/**
 * Verifica se uma data é hoje
 * @param date - Data a ser verificada
 * @returns true se for hoje, false caso contrário
 */
export function isToday(date: Date | string): boolean {
  const d = new Date(date)
  const today = new Date()
  
  return d.toDateString() === today.toDateString()
}

/**
 * Obtém a saudação apropriada baseada no horário
 * @returns Saudação (Bom dia, Boa tarde, Boa noite)
 */
export function getGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}
