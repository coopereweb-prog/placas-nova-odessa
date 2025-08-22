// src/components/MapaComSupabase.jsx
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../integrations/supabase/client'; // Ajuste o caminho conforme necessário

declare global {
  interface Window {
    google: typeof google;
    initGoogleMap?: () => void;
  }
}

const MapaComSupabase = ({ center, zoom, onPointClick }) => {
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [points, setPoints] = useState([]);
  const mapInstanceRef = useRef(null);

  // Buscar pontos do Supabase
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const { data, error } = await supabase
          .from('points')
          .select('*');
          
        if (error) {
          console.error('❌ Erro ao buscar pontos:', error);
          return;
        }
        
        console.log('📍 Pontos carregados:', data);
        setPoints(data || []);
      } catch (err) {
        console.error('❌ Erro ao carregar pontos:', err);
      }
    };
    
    fetchPoints();
  }, []);

  // Função para obter cor do marcador baseado no status
  const getMarkerColor = (status) => {
    const colors = {
      green: '#22c55e',
      yellow: '#eab308', 
      red: '#ef4444'
    };
    return colors[status];
  };

  // Função para criar marcadores coloridos
  const createColoredMarker = (point, map) => {
    const markerColor = getMarkerColor(point.status);
    
    const svgMarker = `
      <svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12z" 
              fill="${markerColor}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="12" r="6" fill="#ffffff"/>
      </svg>
    `;
    
    const marker = new window.google.maps.Marker({
      position: { lat: point.latitude, lng: point.longitude },
      map,
      title: point.name,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarker )}`,
        scaledSize: new window.google.maps.Size(24, 36),
        anchor: new window.google.maps.Point(12, 36)
      }
    });

    marker.addListener('click', () => {
      onPointClick(point);
    });

    return marker;
  };

  useEffect(() => {
    let mounted = true;

    const initializeMap = async () => {
      try {
        console.log('🗺️ Iniciando carregamento do mapa...');
        
        const { data: secrets, error: secretsError } = await supabase.functions.invoke('get-secrets');
        
        if (secretsError) {
          console.error('❌ Erro ao buscar secrets:', secretsError);
          if (mounted) {
            setError('Erro ao buscar configurações');
            setIsLoading(false);
          }
          return;
        }
        
        const apiKey = secrets?.GOOGLE_MAPS_API_KEY;
        console.log('🔑 API Key encontrada:', !!apiKey);

        if (!apiKey || apiKey.trim() === '') {
          console.error('❌ API Key não encontrada');
          if (mounted) {
            setError('Google Maps API key não configurada');
            setIsLoading(false);
          }
          return;
        }

        window.initGoogleMap = () => {
          console.log('🚀 Callback do Google Maps executado');
          if (!mounted) return;
          
          setTimeout(() => {
            if (!mounted || !mapRef.current) return;
            
            try {
              console.log('⚙️ Criando instância do mapa...');
              const mapInstance = new window.google.maps.Map(mapRef.current, {
                center,
                zoom,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
              });
              
              points.forEach(point => {
                createColoredMarker(point, mapInstance);
              });

              mapInstanceRef.current = mapInstance;
              console.log('✅ Mapa inicializado com sucesso!');
              
              if (mounted) {
                setIsLoading(false);
              }
            } catch (mapError) {
              console.error('❌ Erro ao criar mapa:', mapError);
              if (mounted) {
                setError(`Erro ao criar o mapa: ${mapError.message}`);
                setIsLoading(false);
              }
            }
          }, 100);
        };

        if (!window.google) {
          console.log('📥 Carregando script do Google Maps...');
          
          const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
          if (existingScript) {
            existingScript.remove();
          }
          
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&callback=initGoogleMap`;
          script.async = true;
          script.defer = true;

          script.onload = ( ) => {
            console.log('✅ Script do Google Maps carregado (onload)');
            window.initGoogleMap?.();
          };
          
          script.onerror = () => {
            console.error('❌ Erro ao carregar script do Google Maps');
            if (mounted) {
              setError('Erro ao carregar Google Maps API');
              setIsLoading(false);
            }
          };
          
          document.head.appendChild(script);
          console.log('📎 Script adicionado');
        } else {
          console.log('✅ Google Maps já carregado, inicializando...');
          window.initGoogleMap();
        }

      } catch (err) {
        console.error('❌ Erro geral:', err);
        if (mounted) {
          setError('Erro ao inicializar o mapa');
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (window.initGoogleMap) {
        delete window.initGoogleMap;
      }
    };
  }, [center.lat, center.lng, zoom, points]);

  return (
    <div className="w-full h-96 rounded-lg relative">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg bg-muted/20"
        style={{ minHeight: '200px' }}
      />

      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg border">
          <div className="text-center p-4">
            <p className="text-destructive mb-2">⚠️ Erro no Google Maps</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaComSupabase;
