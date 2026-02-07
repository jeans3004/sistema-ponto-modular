// Configurações do sistema de ponto

export const SYSTEM_CONFIG = {
  // Configurações de almoço
  LUNCH_BREAK: {
    DEFAULT_DURATION_HOURS: 1, // 1 hora padrão
    DEFAULT_DURATION_MINUTES: 0,
    MIN_DURATION_MINUTES: 30, // Mínimo 30 minutos
    MAX_DURATION_HOURS: 2, // Máximo 2 horas
  },
  
  // Configurações de ausência
  ABSENCE: {
    JUSTIFICATION_REQUIRED: true,
    ACCEPTED_FILE_TYPES: ['pdf', 'jpg', 'jpeg', 'png'],
    GOOGLE_DRIVE_FOLDER_URL: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_JUSTIFICATIVAS_FOLDER || '',
  },

  // Configurações do Google Drive (Shared Drive)
  GOOGLE_DRIVE: {
    SHARED_DRIVE_ID: process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID || '',
    PARENT_FOLDER_ID: process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || '', // Pasta raiz: SistemaDePontoModular
    AUSENCIAS_FOLDER_ID: process.env.GOOGLE_DRIVE_AUSENCIAS_FOLDER_ID || '',
  },
  
  // Configurações de jornada
  WORKDAY: {
    DEFAULT_HOURS: 8, // 8 horas padrão
    MAX_HOURS_PER_DAY: 12,
  },

  // Fuso horário do local de trabalho
  TIMEZONE: process.env.NEXT_PUBLIC_TIMEZONE || 'America/Manaus',

  // Configurações de geolocalização
  GEOLOCATION: {
    ENABLED: process.env.NEXT_PUBLIC_GEOLOCATION_ENABLED === 'true' || false,
    WORKPLACE_LATITUDE: parseFloat(process.env.NEXT_PUBLIC_WORKPLACE_LATITUDE || '0'),
    WORKPLACE_LONGITUDE: parseFloat(process.env.NEXT_PUBLIC_WORKPLACE_LONGITUDE || '0'),
    ALLOWED_RADIUS_METERS: parseInt(process.env.NEXT_PUBLIC_ALLOWED_RADIUS_METERS || '100'), // 100 metros padrão
    TIMEOUT_MS: 10000, // 10 segundos timeout
    HIGH_ACCURACY: true,
    MAX_AGE_MS: 60000, // Cache de 1 minuto
  }
} as const

export type SystemConfig = typeof SYSTEM_CONFIG