const CACHE_NAME = 'ponto-digital-v2'
const OFFLINE_URL = '/offline'

// Recursos para cache inicial (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Instalar e fazer precache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell')
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  self.skipWaiting()
})

// Ativar e limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// Escutar mensagem de skip waiting (para atualização forçada)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Estratégia: Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requisições que não são GET
  if (request.method !== 'GET') return

  // Ignorar APIs e autenticação (sempre network)
  if (url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/_next/') ||
      url.pathname.includes('auth')) {
    return
  }

  // Para navegação: Network first, fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear páginas visitadas
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL)
          })
        })
    )
    return
  }

  // Para assets estáticos: Cache first
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|woff2?|ttf|css|js)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
      })
    )
    return
  }
})

// Sincronização em background (quando voltar online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pontos') {
    console.log('[SW] Syncing pending pontos...')
    // Implementar sincronização de pontos pendentes
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})
