'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/dashboard/Header'
import DevelopmentModal from '@/components/ui/DevelopmentModal'
import SuccessModal from '@/components/ui/SuccessModal'
import InfoModal from '@/components/ui/InfoModal'
import { formatDate } from '@/lib/utils'
import { useGeolocation } from '@/hooks/useGeolocation'
import { SYSTEM_CONFIG } from '@/lib/config'
import { useUsuario } from '@/hooks/useUsuario'
import { 
  FaPlay, 
  FaStop, 
  FaSpinner, 
  FaClock, 
  FaCalendarAlt,
  FaChartLine,
  FaHistory,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaUser,
  FaArrowRight,
  FaEdit,
  FaEye,
  FaUtensils,
  FaPause,
  FaFileAlt,
  FaExclamationTriangle,
  FaGraduationCap,
  FaBuilding
} from 'react-icons/fa'

interface TimeRecord {
  id: string
  funcionarioEmail: string
  data: string
  horaEntrada?: string
  horaSaida?: string
  inicioAlmoco?: string
  fimAlmoco?: string
  inicioHtp?: string
  fimHtp?: string
  tempoAlmoco?: string
  totalHoras: string
}

export default function ColaboradorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { usuario, isLoading: isLoadingUser } = useUsuario()
  
  // Estados originais do componente
  const [isWorking, setIsWorking] = useState(false)
  const [todayRecord, setTodayRecord] = useState<TimeRecord | null>(null)
  const [lastEntry, setLastEntry] = useState<Date | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Estados para almoço
  const [isOnLunch, setIsOnLunch] = useState(false)
  const [canStartLunch, setCanStartLunch] = useState(false)
  const [canEndLunch, setCanEndLunch] = useState(false)
  
  // Estados para HTP
  const [canStartHTP, setCanStartHTP] = useState(false)
  const [canEndHTP, setCanEndHTP] = useState(false)
  const [isOnHTP, setIsOnHTP] = useState(false)
  
  // Estado para submissão de pontos
  const [isSubmittingPonto, setIsSubmittingPonto] = useState(false)
  
  // Novos estados para os modais - organizados junto com os outros estados
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  
  // Estados para geolocalização
  const { location, isLoading: isLoadingLocation, error: locationError, refresh: refreshLocation, status: locationStatus } = useGeolocation(SYSTEM_CONFIG.GEOLOCATION.ENABLED)
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  
  // Estados para modal de sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalData, setSuccessModalData] = useState<{
    type: 'entrada' | 'saida' | 'inicio-almoco' | 'fim-almoco' | 'inicio-htp' | 'fim-htp'
    time: string
    distance?: number
    message?: string
  } | null>(null)
  
  // Estados para modal de informação
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoModalData, setInfoModalData] = useState<{
    type: 'warning' | 'info' | 'error'
    title: string
    message: string
    details?: string
  } | null>(null)

  // Verificar se o usuário tem acesso a este dashboard
  useEffect(() => {
    if (!isLoadingUser && usuario && !usuario.niveisHierarquicos.includes('colaborador')) {
      router.push('/dashboard')
      return
    }
  }, [usuario, isLoadingUser, router])

  // Atualizar relógio - mantém a funcionalidade existente
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.email) {
      loadTodayData()
    }
  }, [session])

  // Solicitar permissão de localização automaticamente se geolocalização estiver habilitada
  useEffect(() => {
    if (SYSTEM_CONFIG.GEOLOCATION.ENABLED && !location && !isLoadingLocation && !locationError) {
      // Pequeno delay para não interferir com o carregamento inicial
      const timer = setTimeout(() => {
        setShowLocationPermissionModal(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [SYSTEM_CONFIG.GEOLOCATION.ENABLED, location, isLoadingLocation, locationError])

  const loadTodayData = async () => {
    try {
      const response = await fetch('/api/pontos/historico')
      const data = await response.json()
      
      if (data.pontos) {
        const hoje = new Date().toLocaleDateString('en-CA', { timeZone: SYSTEM_CONFIG.TIMEZONE })
        const registroHoje = data.pontos.find((p: TimeRecord) => p.data === hoje)
        
        if (registroHoje) {
          setTodayRecord(registroHoje)
          setIsWorking(!!registroHoje.horaEntrada && !registroHoje.horaSaida)
          
          // Lógica do almoço
          const hasEntry = !!registroHoje.horaEntrada
          const hasLunchStart = !!registroHoje.inicioAlmoco
          const hasLunchEnd = !!registroHoje.fimAlmoco
          const hasExit = !!registroHoje.horaSaida
          
          setCanStartLunch(hasEntry && !hasLunchStart && !hasExit)
          setCanEndLunch(hasLunchStart && !hasLunchEnd && !hasExit)
          setIsOnLunch(hasLunchStart && !hasLunchEnd)
          
          // Lógica do HTP - só pode usar após ter entrada registrada
          const hasHTPStart = !!registroHoje.inicioHtp
          const hasHTPEnd = !!registroHoje.fimHtp
          
          setCanStartHTP(hasEntry && !hasHTPStart && !hasExit)
          setCanEndHTP(hasHTPStart && !hasHTPEnd && !hasExit)
          setIsOnHTP(hasHTPStart && !hasHTPEnd)
          
          if (registroHoje.horaEntrada) {
            const [hora, minuto] = registroHoje.horaEntrada.split(':')
            const entryDate = new Date()
            entryDate.setHours(parseInt(hora), parseInt(minuto), 0, 0)
            setLastEntry(entryDate)
          }
        } else {
          // Resetar estados se não há registro hoje
          setCanStartLunch(false)
          setCanEndLunch(false)
          setIsOnLunch(false)
          setCanStartHTP(false)
          setCanEndHTP(false)
          setIsOnHTP(false)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleClockIn = async () => {
    try {
      let requestBody = {}
      
      // Verificar se geolocalização é obrigatória
      if (SYSTEM_CONFIG.GEOLOCATION.ENABLED) {
        if (!location?.success) {
          alert('Localização é obrigatória para registrar o ponto. Por favor, permita o acesso à sua localização.')
          setShowLocationPermissionModal(true)
          return
        }

        // Verificar se está dentro da área permitida
        if (!location.isWithinAllowedRadius) {
          alert(`Você deve estar no local de trabalho para registrar o ponto. ${locationStatus.message}`)
          return
        }
        
        // Verificar se as coordenadas são válidas
        if (!location.coordinates?.latitude || !location.coordinates?.longitude) {
          alert('Erro: Coordenadas de localização inválidas. Tente novamente.')
          refreshLocation()
          return
        }
        
        requestBody = {
          location: {
            latitude: location.coordinates.latitude,
            longitude: location.coordinates.longitude,
            accuracy: location.coordinates.accuracy
          }
        }
      }
      
      const response = await fetch('/api/pontos/entrada', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadTodayData()
        showSuccessMessage(
          'entrada',
          data.horaEntrada,
          data.location?.distance,
          data.location?.validated ? 'Localização validada com sucesso!' : undefined
        )
      } else {
        // Tratar diferentes tipos de erro
        if (data.error?.includes('Já existe')) {
          showInfoMessage(
            'warning',
            'Entrada Já Registrada',
            'Você já registrou sua entrada hoje.',
            `Entrada registrada: ${todayRecord?.horaEntrada || 'Não disponível'}`
          )
        } else {
          alert(data.error || 'Erro ao registrar entrada')
        }
      }
    } catch (error) {
      console.error('Erro ao registrar entrada:', error)
      alert('Erro ao registrar entrada')
    }
  }

  const handleClockOut = async () => {
    try {
      let requestBody = {}
      
      // Verificar se geolocalização é obrigatória
      if (SYSTEM_CONFIG.GEOLOCATION.ENABLED) {
        if (!location?.success) {
          alert('Localização é obrigatória para registrar o ponto. Por favor, permita o acesso à sua localização.')
          setShowLocationPermissionModal(true)
          return
        }

        // Verificar se está dentro da área permitida
        if (!location.isWithinAllowedRadius) {
          alert(`Você deve estar no local de trabalho para registrar o ponto. ${locationStatus.message}`)
          return
        }
        
        // Verificar se as coordenadas são válidas
        if (!location.coordinates?.latitude || !location.coordinates?.longitude) {
          alert('Erro: Coordenadas de localização inválidas. Tente novamente.')
          refreshLocation()
          return
        }
        
        requestBody = {
          location: {
            latitude: location.coordinates.latitude,
            longitude: location.coordinates.longitude,
            accuracy: location.coordinates.accuracy
          }
        }
      }
      
      const response = await fetch('/api/pontos/saida', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadTodayData()
        showSuccessMessage(
          'saida',
          data.horaSaida,
          data.location?.distance,
          data.location?.validated ? 'Localização validada com sucesso!' : undefined
        )
      } else {
        // Tratar diferentes tipos de erro
        if (data.error?.includes('Não foi encontrado registro')) {
          showInfoMessage(
            'warning',
            'Entrada Não Encontrada',
            'Para registrar a saída, primeiro você precisa registrar a entrada.',
            'Registre sua entrada antes de tentar registrar a saída.'
          )
        } else if (data.error?.includes('Já existe')) {
          showInfoMessage(
            'warning',
            'Saída Já Registrada',
            'Você já registrou sua saída hoje.',
            `Saída registrada: ${todayRecord?.horaSaida || 'Não disponível'}`
          )
        } else {
          alert(data.error || 'Erro ao registrar saída')
        }
      }
    } catch (error) {
      console.error('Erro ao registrar saída:', error)
      alert('Erro ao registrar saída')
    }
  }

  const handleStartLunch = async () => {
    try {
      let requestBody = {}
      
      // Verificar se geolocalização é obrigatória
      if (SYSTEM_CONFIG.GEOLOCATION.ENABLED) {
        if (!location?.success) {
          alert('Localização é obrigatória para registrar o ponto. Por favor, permita o acesso à sua localização.')
          setShowLocationPermissionModal(true)
          return
        }

        // Verificar se está dentro da área permitida
        if (!location.isWithinAllowedRadius) {
          alert(`Você deve estar no local de trabalho para registrar o ponto. ${locationStatus.message}`)
          return
        }
        
        // Verificar se as coordenadas são válidas
        if (!location.coordinates?.latitude || !location.coordinates?.longitude) {
          alert('Erro: Coordenadas de localização inválidas. Tente novamente.')
          refreshLocation()
          return
        }
        
        requestBody = {
          location: {
            latitude: location.coordinates.latitude,
            longitude: location.coordinates.longitude,
            accuracy: location.coordinates.accuracy
          }
        }
      }
      
      const response = await fetch('/api/pontos/inicio-almoco', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadTodayData()
        showSuccessMessage(
          'inicio-almoco',
          data.horaInicioAlmoco,
          data.location?.distance,
          data.location?.validated ? 'Localização validada com sucesso!' : undefined
        )
      } else {
        // Tratar diferentes tipos de erro
        if (data.error?.includes('Não foi encontrado registro')) {
          showInfoMessage(
            'warning',
            'Entrada Não Encontrada',
            'Para iniciar o almoço, primeiro você precisa registrar a entrada.',
            'Registre sua entrada antes de tentar iniciar o almoço.'
          )
        } else if (data.error?.includes('Já existe')) {
          showInfoMessage(
            'warning',
            'Almoço Já Iniciado',
            'Você já iniciou o almoço hoje.',
            `Início do almoço: ${todayRecord?.inicioAlmoco || 'Não disponível'}`
          )
        } else {
          alert(data.error || 'Erro ao registrar início do almoço')
        }
      }
    } catch (error) {
      console.error('Erro ao registrar início do almoço:', error)
      alert('Erro ao registrar início do almoço')
    }
  }

  const handleEndLunch = async () => {
    try {
      let requestBody = {}
      
      // Verificar se geolocalização é obrigatória
      if (SYSTEM_CONFIG.GEOLOCATION.ENABLED) {
        if (!location?.success) {
          alert('Localização é obrigatória para registrar o ponto. Por favor, permita o acesso à sua localização.')
          setShowLocationPermissionModal(true)
          return
        }

        // Verificar se está dentro da área permitida
        if (!location.isWithinAllowedRadius) {
          alert(`Você deve estar no local de trabalho para registrar o ponto. ${locationStatus.message}`)
          return
        }
        
        // Verificar se as coordenadas são válidas
        if (!location.coordinates?.latitude || !location.coordinates?.longitude) {
          alert('Erro: Coordenadas de localização inválidas. Tente novamente.')
          refreshLocation()
          return
        }
        
        requestBody = {
          location: {
            latitude: location.coordinates.latitude,
            longitude: location.coordinates.longitude,
            accuracy: location.coordinates.accuracy
          }
        }
      }
      
      const response = await fetch('/api/pontos/fim-almoco', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadTodayData()
        showSuccessMessage(
          'fim-almoco',
          data.horaFimAlmoco,
          data.location?.distance,
          data.location?.validated ? 'Localização validada com sucesso!' : undefined
        )
      } else {
        // Tratar diferentes tipos de erro
        if (data.error?.includes('Não foi encontrado registro')) {
          showInfoMessage(
            'warning',
            'Almoço Não Iniciado',
            'Para encerrar o almoço, primeiro você precisa iniciá-lo.',
            'Inicie o almoço antes de tentar encerrá-lo.'
          )
        } else if (data.error?.includes('Já existe')) {
          showInfoMessage(
            'warning',
            'Almoço Já Encerrado',
            'Você já encerrou o almoço hoje.',
            `Fim do almoço: ${todayRecord?.fimAlmoco || 'Não disponível'}`
          )
        } else {
          alert(data.error || 'Erro ao registrar fim do almoço')
        }
      }
    } catch (error) {
      console.error('Erro ao registrar fim do almoço:', error)
      alert('Erro ao registrar fim do almoço')
    }
  }

  // Função para registrar HTP (Hora Trabalho Pedagógico)
  const handleHTPAction = async (tipo: 'inicio-htp' | 'fim-htp') => {
    try {
      setIsSubmittingPonto(true)
      let requestBody = {}
      
      // Verificar se geolocalização é obrigatória
      if (SYSTEM_CONFIG.GEOLOCATION.ENABLED) {
        if (!location?.success) {
          alert('Localização é obrigatória para registrar HTP. Por favor, permita o acesso à sua localização.')
          setShowLocationPermissionModal(true)
          return
        }

        // Verificar se está dentro da área permitida
        if (!location.isWithinAllowedRadius) {
          alert(`Você deve estar no local de trabalho para registrar HTP. ${locationStatus.message}`)
          return
        }
        
        // Verificar se as coordenadas são válidas
        if (!location.coordinates?.latitude || !location.coordinates?.longitude) {
          alert('Erro: Coordenadas de localização inválidas. Tente novamente.')
          refreshLocation()
          return
        }
        
        requestBody = {
          location: {
            latitude: location.coordinates.latitude,
            longitude: location.coordinates.longitude,
            accuracy: location.coordinates.accuracy
          }
        }
      }

      const response = await fetch(`/api/pontos/${tipo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        await loadTodayData()
        const action = tipo === 'inicio-htp' ? 'Início do HTP' : 'Fim do HTP'
        showSuccessMessage(
          tipo as any,
          data.horaInicioHtp || data.horaFimHtp,
          data.location?.distance,
          data.location?.validated ? 'Localização validada com sucesso!' : undefined
        )
      } else {
        // Tratar diferentes tipos de erro
        if (data.error?.includes('Não foi encontrado registro') && tipo === 'fim-htp') {
          showInfoMessage(
            'warning',
            'HTP Não Iniciado',
            'Para encerrar o HTP, primeiro você precisa iniciá-lo.',
            'Inicie o HTP antes de tentar encerrá-lo.'
          )
        } else if (data.error?.includes('Já existe')) {
          const action = tipo === 'inicio-htp' ? 'Início do HTP' : 'Fim do HTP'
          showInfoMessage(
            'warning',
            `${action} Já Registrado`,
            `Você já registrou o ${action.toLowerCase()} hoje.`,
            `${action}: ${tipo === 'inicio-htp' ? (todayRecord as any)?.inicioHtp : (todayRecord as any)?.fimHtp || 'Não disponível'}`
          )
        } else {
          alert(data.error || `Erro ao registrar ${tipo === 'inicio-htp' ? 'início' : 'fim'} do HTP`)
        }
      }
    } catch (error) {
      console.error(`Erro ao registrar ${tipo}:`, error)
      alert(`Erro ao registrar ${tipo === 'inicio-htp' ? 'início' : 'fim'} do HTP`)
    } finally {
      setIsSubmittingPonto(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const handleRequestLocation = async () => {
    setIsRequestingLocation(true)
    try {
      await refreshLocation()
      setShowLocationPermissionModal(false)
    } catch (error) {
      console.error('Erro ao solicitar localização:', error)
    } finally {
      setIsRequestingLocation(false)
    }
  }

  const showSuccessMessage = (
    type: 'entrada' | 'saida' | 'inicio-almoco' | 'fim-almoco' | 'inicio-htp' | 'fim-htp',
    time: string,
    distance?: number,
    customMessage?: string
  ) => {
    setSuccessModalData({
      type,
      time,
      distance,
      message: customMessage
    })
    setShowSuccessModal(true)
  }

  const showInfoMessage = (
    type: 'warning' | 'info' | 'error',
    title: string,
    message: string,
    details?: string
  ) => {
    setInfoModalData({
      type,
      title,
      message,
      details
    })
    setShowInfoModal(true)
  }

  if (status === 'loading' || isLoadingData || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-white text-lg">Carregando dashboard do colaborador...</p>
          </div>
        </div>
      </div>
    )
  }

  const entryTime = todayRecord?.horaEntrada ? 
    new Date(`${todayRecord.data}T${todayRecord.horaEntrada}:00`) : undefined
  const exitTime = todayRecord?.horaSaida ? 
    new Date(`${todayRecord.data}T${todayRecord.horaSaida}:00`) : undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 relative overflow-hidden">
      {/* Padrão de fundo decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/3 to-transparent"></div>
      </div>

      <Header />
      
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho do Dashboard */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {getGreeting()}, {session?.user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-green-200 text-lg">
                  Dashboard do Colaborador • {formatDate(new Date())}
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {formatTime(currentTime)}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isOnLunch ? 'bg-orange-400' : 
                    isWorking ? 'bg-green-400' : 
                    'bg-gray-400'
                  }`}></div>
                  <span className="text-green-200">
                    {isOnLunch ? 'No almoço' : 
                     isWorking ? 'Trabalhando' : 
                     'Fora do trabalho'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal - Registro de Ponto */}
          <div className="lg:col-span-2 space-y-8">
            {/* Card Principal de Ponto */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-4">
                  <FaClock className="text-white text-3xl" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Registro de Ponto
                </h2>
                <p className="text-gray-600 text-lg">
                  {lastEntry && `Último registro: ${lastEntry.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>

              {/* Botão Principal */}
              <div className="space-y-6">
                <button
                  onClick={isWorking ? handleClockOut : handleClockIn}
                  disabled={SYSTEM_CONFIG.GEOLOCATION.ENABLED && (!location?.success || !location?.isWithinAllowedRadius)}
                  className={`w-full py-6 px-8 rounded-xl font-bold text-2xl flex items-center justify-center space-x-4 transition-all duration-300 transform hover:scale-105 shadow-2xl ${
                    SYSTEM_CONFIG.GEOLOCATION.ENABLED && (!location?.success || !location?.isWithinAllowedRadius)
                      ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                      : isWorking
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                  }`}
                >
                  {isWorking ? (
                    <>
                      <FaStop className="text-2xl" />
                      <span>Registrar Saída</span>
                    </>
                  ) : (
                    <>
                      <FaPlay className="text-2xl" />
                      <span>Registrar Entrada</span>
                    </>
                  )}
                </button>
                
                {/* Alerta de Localização Obrigatória */}
                {SYSTEM_CONFIG.GEOLOCATION.ENABLED && (!location?.success || !location?.isWithinAllowedRadius) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <FaExclamationTriangle className="text-red-600 mr-3 text-xl" />
                      <div>
                        <h4 className="font-semibold text-red-900">Localização Obrigatória</h4>
                        <p className="text-sm text-red-700">
                          {!location?.success 
                            ? 'Permita o acesso à sua localização para registrar o ponto'
                            : 'Você deve estar no local de trabalho para registrar o ponto'
                          }
                        </p>
                        {!location?.success && (
                          <button 
                            onClick={() => setShowLocationPermissionModal(true)}
                            className="text-sm text-red-600 hover:text-red-800 underline mt-1"
                          >
                            Solicitar permissão
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões de Almoço */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleStartLunch}
                    disabled={!canStartLunch || (SYSTEM_CONFIG.GEOLOCATION.ENABLED && (!location?.success || !location?.isWithinAllowedRadius))}
                    className={`py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 transition-all duration-300 ${
                      canStartLunch && (!SYSTEM_CONFIG.GEOLOCATION.ENABLED || (location?.success && location?.isWithinAllowedRadius))
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FaUtensils className="text-xl" />
                    <span>Iniciar Almoço</span>
                  </button>

                  <button
                    onClick={handleEndLunch}
                    disabled={!canEndLunch || (SYSTEM_CONFIG.GEOLOCATION.ENABLED && (!location?.success || !location?.isWithinAllowedRadius))}
                    className={`py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 transition-all duration-300 ${
                      canEndLunch && (!SYSTEM_CONFIG.GEOLOCATION.ENABLED || (location?.success && location?.isWithinAllowedRadius))
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FaPlay className="text-xl" />
                    <span>Finalizar Almoço</span>
                  </button>
                </div>

                {/* Botões HTP - Apenas para Docentes */}
                {usuario?.tipoColaborador === 'docente' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleHTPAction('inicio-htp')}
                      disabled={!canStartHTP || isSubmittingPonto || (SYSTEM_CONFIG.GEOLOCATION.ENABLED && (!location?.success || !location?.isWithinAllowedRadius))}
                      className={`py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 transition-all duration-300 ${
                        canStartHTP && !isSubmittingPonto && (!SYSTEM_CONFIG.GEOLOCATION.ENABLED || (location?.success && location?.isWithinAllowedRadius))
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isSubmittingPonto ? (
                        <FaSpinner className="animate-spin text-xl" />
                      ) : (
                        <FaGraduationCap className="text-xl" />
                      )}
                      <span>Iniciar HTP</span>
                    </button>

                    <button
                      onClick={() => handleHTPAction('fim-htp')}
                      disabled={!canEndHTP || isSubmittingPonto || (SYSTEM_CONFIG.GEOLOCATION.ENABLED && (!location?.success || !location?.isWithinAllowedRadius))}
                      className={`py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 transition-all duration-300 ${
                        canEndHTP && !isSubmittingPonto && (!SYSTEM_CONFIG.GEOLOCATION.ENABLED || (location?.success && location?.isWithinAllowedRadius))
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isSubmittingPonto ? (
                        <FaSpinner className="animate-spin text-xl" />
                      ) : (
                        <FaPause className="text-xl" />
                      )}
                      <span>Finalizar HTP</span>
                    </button>
                  </div>
                )}

                {/* Informações de Segurança */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`rounded-lg p-4 border ${
                    SYSTEM_CONFIG.GEOLOCATION.ENABLED ? (
                      location?.success && location?.isWithinAllowedRadius ? 
                        'bg-green-50 border-green-200' :
                      isLoadingLocation ? 
                        'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                    ) : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center">
                      {isLoadingLocation ? (
                        <FaSpinner className="animate-spin text-yellow-600 mr-3 text-xl" />
                      ) : (
                        <FaMapMarkerAlt className={`mr-3 text-xl ${
                          SYSTEM_CONFIG.GEOLOCATION.ENABLED ? (
                            location?.success && location?.isWithinAllowedRadius ? 
                              'text-green-600' :
                            isLoadingLocation ? 
                              'text-yellow-600' :
                              'text-red-600'
                          ) : 'text-gray-600'
                        }`} />
                      )}
                      <div>
                        <h3 className={`font-semibold ${
                          SYSTEM_CONFIG.GEOLOCATION.ENABLED ? (
                            location?.success && location?.isWithinAllowedRadius ? 
                              'text-green-900' :
                            isLoadingLocation ? 
                              'text-yellow-900' :
                              'text-red-900'
                          ) : 'text-gray-900'
                        }`}>
                          {SYSTEM_CONFIG.GEOLOCATION.ENABLED ? 'GPS' : 'GPS Desabilitado'}
                        </h3>
                        <p className={`text-sm ${
                          SYSTEM_CONFIG.GEOLOCATION.ENABLED ? (
                            location?.success && location?.isWithinAllowedRadius ? 
                              'text-green-700' :
                            isLoadingLocation ? 
                              'text-yellow-700' :
                              'text-red-700'
                          ) : 'text-gray-700'
                        }`}>
                          {SYSTEM_CONFIG.GEOLOCATION.ENABLED ? locationStatus.message : 'Validação de localização desabilitada'}
                        </p>
                        {locationError && SYSTEM_CONFIG.GEOLOCATION.ENABLED && (
                          <button 
                            onClick={refreshLocation}
                            className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                          >
                            Tentar novamente
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center">
                      <FaCheckCircle className="text-green-600 mr-3 text-xl" />
                      <div>
                        <h3 className="font-semibold text-green-900">Autenticado</h3>
                        <p className="text-sm text-green-700">Sistema verificado</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo do Dia */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Resumo de Hoje
              </h3>
              
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                usuario?.tipoColaborador === 'docente' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
              }`}>
                {/* Entrada */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center mb-3">
                    <FaPlay className="text-green-600 text-xl mr-2" />
                    <h4 className="font-bold text-green-900">Entrada</h4>
                  </div>
                  <div className="text-2xl font-bold text-green-800 mb-1">
                    {entryTime ? entryTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </div>
                  <p className="text-green-700 text-xs">
                    {entryTime ? 'Registrado' : 'Aguardando'}
                  </p>
                </div>

                {/* Início Almoço */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center mb-3">
                    <FaUtensils className="text-orange-600 text-xl mr-2" />
                    <h4 className="font-bold text-orange-900">Almoço</h4>
                  </div>
                  <div className="text-2xl font-bold text-orange-800 mb-1">
                    {todayRecord?.inicioAlmoco || '--:--'}
                  </div>
                  <p className="text-orange-700 text-xs">
                    {todayRecord?.inicioAlmoco ? 'Iniciado' : 'Não iniciado'}
                  </p>
                </div>

                {/* Fim Almoço */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center mb-3">
                    <FaPlay className="text-blue-600 text-xl mr-2" />
                    <h4 className="font-bold text-blue-900">Retorno</h4>
                  </div>
                  <div className="text-2xl font-bold text-blue-800 mb-1">
                    {todayRecord?.fimAlmoco || '--:--'}
                  </div>
                  <p className="text-blue-700 text-xs">
                    {todayRecord?.fimAlmoco ? 'Finalizado' : 'Pendente'}
                  </p>
                </div>

                {/* HTP - Apenas para Docentes */}
                {usuario?.tipoColaborador === 'docente' && (
                  <>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center mb-3">
                        <FaGraduationCap className="text-purple-600 text-xl mr-2" />
                        <h4 className="font-bold text-purple-900">Início HTP</h4>
                      </div>
                      <div className="text-2xl font-bold text-purple-800 mb-1">
                        {todayRecord?.inicioHtp || '--:--'}
                      </div>
                      <p className="text-purple-700 text-xs">
                        {todayRecord?.inicioHtp ? 'Registrado' : 'Não iniciado'}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                      <div className="flex items-center mb-3">
                        <FaPause className="text-indigo-600 text-xl mr-2" />
                        <h4 className="font-bold text-indigo-900">Fim HTP</h4>
                      </div>
                      <div className="text-2xl font-bold text-indigo-800 mb-1">
                        {todayRecord?.fimHtp || '--:--'}
                      </div>
                      <p className="text-indigo-700 text-xs">
                        {todayRecord?.fimHtp ? 'Finalizado' : 'Pendente'}
                      </p>
                    </div>
                  </>
                )}

                {/* Saída */}
                <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center mb-3">
                    <FaStop className="text-red-600 text-xl mr-2" />
                    <h4 className="font-bold text-red-900">Saída</h4>
                  </div>
                  <div className="text-2xl font-bold text-red-800 mb-1">
                    {exitTime ? exitTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </div>
                  <p className="text-red-700 text-xs">
                    {exitTime ? 'Registrado' : 'Aguardando'}
                  </p>
                </div>
              </div>

              {/* Total de Horas e Tempo de Almoço */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaClock className="text-green-600 text-2xl mr-3" />
                      <div>
                        <h4 className="font-bold text-green-900 text-lg">Total Trabalhado</h4>
                        <p className="text-green-700 text-sm">Horas efetivas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-800">
                        {todayRecord?.totalHoras || '0h 0m'}
                      </div>
                      <div className="text-sm text-green-600">
                        Meta: 8h 0m
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaUtensils className="text-orange-600 text-2xl mr-3" />
                      <div>
                        <h4 className="font-bold text-orange-900 text-lg">Tempo de Almoço</h4>
                        <p className="text-orange-700 text-sm">Pausa registrada</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-800">
                        {todayRecord?.tempoAlmoco || '0h 0m'}
                      </div>
                      <div className="text-sm text-orange-600">
                        Padrão: 1h 0m
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Informações do Usuário */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
              <div className="text-center mb-6">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-green-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaUser className="text-white text-2xl" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">
                  {session?.user?.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {session?.user?.email}
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Colaborador
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cargo:</span>
                  <span className="font-semibold text-gray-900">Funcionário</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Horário:</span>
                  <span className="font-semibold text-gray-900">8:00 - 17:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold ${isWorking ? 'text-green-600' : 'text-gray-500'}`}>
                    {isWorking ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Ações Rápidas
              </h3>
              <div className="space-y-3">
                <Link
                  href="/historico"
                  className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 transform hover:scale-105 border border-green-200"
                >
                  <FaHistory className="text-green-600 mr-3 text-xl" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">Ver Histórico</p>
                    <p className="text-sm text-green-700">Seus registros de ponto</p>
                  </div>
                  <FaArrowRight className="text-green-600" />
                </Link>

                <Link
                  href="/ausencia"
                  className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-orange-100 rounded-xl hover:from-yellow-100 hover:to-orange-200 transition-all duration-200 transform hover:scale-105 border border-yellow-200"
                >
                  <FaFileAlt className="text-orange-600 mr-3 text-xl" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-orange-900">Ausência Justificada</p>
                    <p className="text-sm text-orange-700">Registrar faltas e atestados</p>
                  </div>
                  <FaArrowRight className="text-orange-600" />
                </Link>
              </div>
            </div>

            {/* Informações do Colaborador */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Minhas Informações
              </h3>
              <div className="space-y-4">
                {/* Tipo de Colaborador */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {usuario?.tipoColaborador === 'docente' ? (
                      <FaGraduationCap className="text-purple-600 mr-3 text-lg" />
                    ) : usuario?.tipoColaborador === 'administrativo' ? (
                      <FaUser className="text-gray-600 mr-3 text-lg" />
                    ) : (
                      <FaExclamationTriangle className="text-orange-500 mr-3 text-lg" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">Tipo de Colaborador</p>
                      <p className="text-sm text-gray-600">
                        {usuario?.tipoColaborador === 'docente' && '👨‍🏫 Docente - Acesso ao HTP'}
                        {usuario?.tipoColaborador === 'administrativo' && '👨‍💼 Administrativo'}
                        {!usuario?.tipoColaborador && '⚠️ Não definido - Entre em contato com o administrador'}
                      </p>
                    </div>
                  </div>
                  {usuario?.tipoColaborador && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      usuario.tipoColaborador === 'docente' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {usuario.tipoColaborador === 'docente' ? 'Docente' : 'Administrativo'}
                    </div>
                  )}
                </div>

                {/* Coordenação */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaBuilding className="text-blue-600 mr-3 text-lg" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Coordenações</p>
                      {usuario?.coordenacoes && usuario.coordenacoes.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {usuario.coordenacoes.map(coord => (
                            <div key={coord.id} className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {coord.nome}
                            </div>
                          ))}
                        </div>
                      ) : usuario?.coordenacaoNome ? (
                        /* Fallback para formato legado */
                        <div className="flex flex-wrap gap-2 mt-1">
                          <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {usuario.coordenacaoNome}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Não atribuído a uma coordenação
                        </p>
                      )}
                    </div>
                  </div>
                  {((usuario?.coordenacoes && usuario.coordenacoes.length > 0) || usuario?.coordenacaoNome) && (
                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Vinculado
                    </div>
                  )}
                </div>

                {/* Níveis Hierárquicos */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaUser className="text-green-600 mr-3 text-lg" />
                    <div>
                      <p className="font-medium text-gray-900">Níveis de Acesso</p>
                      <p className="text-sm text-gray-600">
                        Permissões do sistema
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {usuario?.niveisHierarquicos.map((nivel) => (
                      <span
                        key={nivel}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          nivel === 'administrador' ? 'bg-red-100 text-red-800' :
                          nivel === 'coordenador' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {nivel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Status do Sistema */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Status do Sistema
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Firebase conectado</span>
                </div>
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Dados sincronizados</span>
                </div>
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Backup automático</span>
                </div>
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Sistema operacional</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Permissão de Localização */}
      {showLocationPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaMapMarkerAlt className="text-white text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Permissão de Localização Necessária
              </h2>
              <p className="text-gray-600 mb-6">
                Para garantir a segurança do sistema de ponto, precisamos acessar sua localização. 
                Isso garante que você esteja no local de trabalho durante o registro.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleRequestLocation}
                  disabled={isRequestingLocation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isRequestingLocation ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Solicitando...</span>
                    </>
                  ) : (
                    <>
                      <FaMapMarkerAlt />
                      <span>Permitir Localização</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowLocationPermissionModal(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Sua localização será usada apenas para validar o registro de ponto
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sucesso */}
      {showSuccessModal && successModalData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          type={successModalData.type}
          time={successModalData.time}
          distance={successModalData.distance}
          message={successModalData.message}
        />
      )}

      {/* Modal de Informação */}
      {showInfoModal && infoModalData && (
        <InfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          type={infoModalData.type}
          title={infoModalData.title}
          message={infoModalData.message}
          details={infoModalData.details}
        />
      )}
    </div>
  )
}