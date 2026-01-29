// Evento de instalação do PWA
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

// Estado do PWA
export interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isIOS: boolean
  isAndroid: boolean
  isStandalone: boolean
  deferredPrompt: BeforeInstallPromptEvent | null
}

// Configuração do banner
export interface InstallBannerConfig {
  showDelay: number // ms para mostrar após carregar
  dismissDuration: number // dias para não mostrar após dispensar
  storageKey: string
}

// Augmentação do Window para o evento
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}
