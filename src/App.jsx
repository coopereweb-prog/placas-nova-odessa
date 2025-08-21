import { useState, useCallback, useEffect } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { MapPin, Clock, Eye, Phone, Mail, User } from 'lucide-react'
import pontosData from './assets/pontos_instalacao.json'
import './App.css'

const mapContainerStyle = {
  width: '100%',
  height: '600px'
}

// Centro do mapa (Praça José Gazzetta - Nova Odessa)
const center = {
  lat: -22.7856,
  lng: -47.2975
}

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
}

// Ícones personalizados para os marcadores
const markerIcons = {
  disponivel: {
    url: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#22c55e">
        <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
        <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" fill="none"/>
      </svg>
    `),
    scaledSize: { width: 32, height: 32 }
  },
  reservado: {
    url: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#eab308">
        <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
        <path d="M12 6v6l4 2" stroke="white" stroke-width="2" fill="none"/>
      </svg>
    `),
    scaledSize: { width: 32, height: 32 }
  },
  vendido: {
    url: 'data:image/svg+xml;base64=' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ef4444">
        <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
        <path d="M8 12h8" stroke="white" stroke-width="2"/>
      </svg>
    `),
    scaledSize: { width: 32, height: 32 }
  }
}

function App() {
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [pontos, setPontos] = useState([])
  const [showReserveModal, setShowReserveModal] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [reserveData, setReserveData] = useState({
    nome: '',
    email: '',
    telefone: '',
    pontoId: null
  })

  useEffect(() => {
    // Carrega os pontos e adiciona status inicial (todos disponíveis)
    // Filtra apenas pontos com coordenadas válidas
    const pontosComStatus = pontosData
      .filter(ponto => {
        // Valida se as coordenadas são números válidos
        const lat = parseFloat(ponto.latitude)
        const lng = parseFloat(ponto.longitude)
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
      })
      .map((ponto, index) => ({
        ...ponto,
        id: index + 1,
        lat: parseFloat(ponto.latitude),
        lng: parseFloat(ponto.longitude),
        status: 'disponivel', // disponivel, reservado, vendido
        endereco: `${ponto.rua1} com ${ponto.rua2}`,
        rua_principal: ponto.rua1,
        rua_cruzamento: ponto.rua2,
        tipo: ponto.tipo_regra === 'Escola' ? 'escola' : 
              ponto.tipo_regra === 'Hospital' ? 'hospital' : 'padrao'
      }))
    
    console.log(`Carregados ${pontosComStatus.length} pontos válidos de ${pontosData.length} pontos totais`)
    setPontos(pontosComStatus)
  }, [])

  const onLoad = useCallback((map) => {
    console.log('Mapa carregado com sucesso')
    setMapLoaded(true)
    
    // Ajusta o zoom para mostrar todos os pontos
    if (pontos.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      pontos.forEach(ponto => {
        bounds.extend({ lat: ponto.lat, lng: ponto.lng })
      })
      map.fitBounds(bounds)
    }
  }, [pontos])

  const onError = useCallback((error) => {
    console.error('Erro ao carregar o mapa:', error)
  }, [])

  const handleMarkerClick = (ponto) => {
    setSelectedMarker(ponto)
  }

  const handleReservar = (ponto) => {
    setReserveData({ ...reserveData, pontoId: ponto.id })
    setShowReserveModal(true)
  }

  const handleReserveSubmit = (e) => {
    e.preventDefault()
    
    // Atualiza o status do ponto para reservado
    setPontos(pontos.map(ponto => 
      ponto.id === reserveData.pontoId 
        ? { ...ponto, status: 'reservado', reservadoEm: new Date(), dadosCliente: reserveData }
        : ponto
    ))
    
    // Fecha o modal e limpa os dados
    setShowReserveModal(false)
    setSelectedMarker(null)
    setReserveData({ nome: '', email: '', telefone: '', pontoId: null })
    
    alert('Ponto reservado com sucesso! Você tem 48 horas para confirmar o pagamento.')
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      disponivel: { label: 'Disponível', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
      reservado: { label: 'Reservado', variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-600' },
      vendido: { label: 'Vendido', variant: 'destructive', className: 'bg-red-500 hover:bg-red-600' }
    }
    
    const config = statusConfig[status] || statusConfig.disponivel
    return (
      <Badge variant={config.variant} className={`${config.className} text-white`}>
        {config.label}
      </Badge>
    )
  }

  const pontosDisponiveis = pontos.filter(p => p.status === 'disponivel').length
  const pontosReservados = pontos.filter(p => p.status === 'reservado').length
  const pontosVendidos = pontos.filter(p => p.status === 'vendido').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Placas Nova Odessa
              </h1>
              <p className="text-gray-600 mt-1">
                Sistema de Gestão de Placas de Identificação de Logradouros
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{pontosDisponiveis}</div>
                <div className="text-sm text-gray-500">Disponíveis</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{pontosReservados}</div>
                <div className="text-sm text-gray-500">Reservados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{pontosVendidos}</div>
                <div className="text-sm text-gray-500">Vendidos</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar com informações */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Bairro São Jorge
                </CardTitle>
                <CardDescription>
                  Prova de conceito do sistema de placas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total de pontos:</span>
                    <span className="font-semibold">{pontos.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Disponíveis:
                    </span>
                    <span className="font-semibold text-green-600">{pontosDisponiveis}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      Reservados:
                    </span>
                    <span className="font-semibold text-yellow-600">{pontosReservados}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      Vendidos:
                    </span>
                    <span className="font-semibold text-red-600">{pontosVendidos}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Como funciona:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Clique nos pontos verdes para ver detalhes</li>
                    <li>• Pontos verdes estão disponíveis para reserva</li>
                    <li>• Pontos amarelos estão reservados (48h)</li>
                    <li>• Pontos vermelhos já foram vendidos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mapa */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Mapa Interativo - Pontos de Instalação</CardTitle>
                <CardDescription>
                  Clique nos marcadores para ver detalhes e fazer reservas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoadScript 
                  googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                  onError={onError}
                >
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={15}
                    onLoad={onLoad}
                    options={mapOptions}
                  >
                    {mapLoaded && pontos.map((ponto) => (
                      <Marker
                        key={ponto.id}
                        position={{ lat: ponto.lat, lng: ponto.lng }}
                        icon={markerIcons[ponto.status]}
                        onClick={() => handleMarkerClick(ponto)}
                      />
                    ))}

                    {selectedMarker && (
                      <InfoWindow
                        position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                        onCloseClick={() => setSelectedMarker(null)}
                      >
                        <div className="p-4 max-w-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-lg">Ponto #{selectedMarker.id}</h3>
                            {getStatusBadge(selectedMarker.status)}
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <p className="text-sm">
                              <strong>Endereço:</strong> {selectedMarker.endereco}
                            </p>
                            <p className="text-sm">
                              <strong>Tipo:</strong> {selectedMarker.tipo === 'escola' ? 'Próximo à escola' : 
                                                      selectedMarker.tipo === 'hospital' ? 'Próximo ao hospital' : 
                                                      'Ponto padrão'}
                            </p>
                            <p className="text-sm">
                              <strong>Coordenadas:</strong> {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                            </p>
                          </div>

                          {selectedMarker.status === 'disponivel' && (
                            <div className="space-y-2">
                              <Button 
                                onClick={() => handleReservar(selectedMarker)}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                Reservar Este Ponto
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => {
                                  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedMarker.lat},${selectedMarker.lng}`
                                  window.open(streetViewUrl, '_blank')
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Street View
                              </Button>
                            </div>
                          )}

                          {selectedMarker.status === 'reservado' && (
                            <div className="text-center">
                              <p className="text-sm text-yellow-600 mb-2">
                                <Clock className="h-4 w-4 inline mr-1" />
                                Reservado - Aguardando pagamento
                              </p>
                              <p className="text-xs text-gray-500">
                                Reserva expira em 48 horas
                              </p>
                            </div>
                          )}

                          {selectedMarker.status === 'vendido' && (
                            <div className="text-center">
                              <p className="text-sm text-red-600 mb-2">
                                Este ponto já foi vendido
                              </p>
                              <p className="text-xs text-gray-500">
                                Disponível novamente em: [Data do término do contrato]
                              </p>
                            </div>
                          )}
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScript>

                {!mapLoaded && (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Carregando mapa...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Reserva */}
      {showReserveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Reservar Ponto de Publicidade</CardTitle>
              <CardDescription>
                Preencha seus dados para reservar este ponto por 48 horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReserveSubmit} className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <Clock className="h-4 w-4 inline mr-1" />
                    <strong>Atenção:</strong> Esta reserva é válida por 48 horas. Para garantir o ponto, 
                    o pagamento deve ser confirmado neste período. Após 48 horas, a reserva expira 
                    automaticamente e o ponto voltará a ficar disponível.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={reserveData.nome}
                    onChange={(e) => setReserveData({...reserveData, nome: e.target.value})}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={reserveData.email}
                    onChange={(e) => setReserveData({...reserveData, email: e.target.value})}
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={reserveData.telefone}
                    onChange={(e) => setReserveData({...reserveData, telefone: e.target.value})}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowReserveModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Confirmar Reserva
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default App

