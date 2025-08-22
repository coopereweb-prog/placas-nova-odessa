// src/App.jsx
import React, { useState } from 'react';
import MapaComSupabase from './components/MapaComSupabase'; // Componente que criaremos a seguir
import { MapPointPopup } from './components/MapPointPopup'; // Seu componente de popup existente
// import { CartItem } from './types/cart'; // Verifique o caminho correto para o seu tipo CartItem

// Definição temporária de CartItem se você não tiver o arquivo types/cart.ts
// Ou ajuste o import acima para o seu arquivo de tipos
interface CartItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  value: number;
}

function App() {
  const center = { lat: -22.9068, lng: -43.1729 }; // Centro padrão para Nova Odessa
  const zoom = 15;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const handleAddToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart; // Já está no carrinho, não adiciona novamente
      } else {
        return [...prevCart, item];
      }
    });
    // Manter o popup aberto para permitir adicionar mais
    // setSelectedPoint(null); // Comentei para permitir adicionar mais
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const handleViewCart = () => {
    // Implementar lógica para exibir o carrinho completo
    console.log("Visualizar carrinho:", cart);
    alert("Funcionalidade de carrinho em desenvolvimento. Itens no carrinho: " + cart.length);
  };

  const handleGoToCheckout = () => {
    // Implementar lógica para ir para o checkout
    console.log("Ir para o checkout:", cart);
    alert("Funcionalidade de checkout em desenvolvimento.");
  };

  const handleClosePopup = () => {
    setSelectedPoint(null);
  };

  return (
    <div className="App">
      <h1>Placas Nova Odessa</h1>
      <p>Sistema de Gestão de Placas de Identificação de Logradouros</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
        <button onClick={handleViewCart}>Ver Carrinho ({cart.length})</button>
        {cart.length > 0 && (
          <button onClick={handleGoToCheckout}>Finalizar Pedido</button>
        )}
      </div>

      <MapaComSupabase
        center={center}
        zoom={zoom}
        onPointClick={(point) => setSelectedPoint(point)} // Passa a função para setar o ponto selecionado
      />

      {selectedPoint && (
        <MapPointPopup
          point={selectedPoint}
          onReservePoint={handleAddToCart}
          onContinueReserving={handleClosePopup} // Fecha o popup após adicionar ao carrinho
          onGoToCheckout={handleGoToCheckout}
          onClose={handleClosePopup}
        />
      )}

      {/* Aqui você pode adicionar a interface do carrinho de compras */}
      {/* Por enquanto, um placeholder simples */}
      {cart.length > 0 && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
          <h2>Seu Carrinho de Compras</h2>
          <ul>
            {cart.map((item) => (
              <li key={item.id}>
                {item.name} - R$ {item.value.toFixed(2)}
                <button onClick={() => handleRemoveFromCart(item.id)} style={{ marginLeft: '10px' }}>Remover</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
