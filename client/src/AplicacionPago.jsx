import React, { useEffect, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

const clavePublica = import.meta.env.VITE_MP_PUBLIC_KEY;
const urlApi = import.meta.env.VITE_API_URL || "http://localhost:3000";

if (clavePublica) {
  // Inicializa el SDK de Mercado Pago en el navegador.
  initMercadoPago(clavePublica);
}

function AplicacionPago() {
  const [producto, setProducto] = useState(null);
  const [preferenciaId, setPreferenciaId] = useState("");
  const [cargandoProducto, setCargandoProducto] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarProducto = async () => {
      setCargandoProducto(true);
      setError("");

      try {
        const respuesta = await fetch(`${urlApi}/productos`);
        const datos = await respuesta.json();

        if (!respuesta.ok || !datos?.ok || !Array.isArray(datos?.productos)) {
          throw new Error(datos?.error || "Error al cargar productos");
        }

        setProducto(datos.productos[0] || null);
      } catch (err) {
        setError(err.message || "Error inesperado");
      } finally {
        setCargandoProducto(false);
      }
    };

    cargarProducto();
  }, []);

  const crearPreferencia = async () => {
    if (!clavePublica) {
      setError("Falta VITE_MP_PUBLIC_KEY en client/.env");
      return;
    }

    if (!producto?.id) {
      setError("No hay producto disponible");
      return;
    }

    setCargando(true);
    setError("");
    setPreferenciaId("");

    try {
      const respuesta = await fetch(`${urlApi}/pago/preferencia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: producto.id }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok || !datos?.ok || !datos?.preferenciaId) {
        throw new Error(datos?.error || "Error al crear preferencia");
      }

      setPreferenciaId(datos.preferenciaId);
    } catch (err) {
      setError(err.message || "Error inesperado");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="contenedor">
      <h1>Demo minima Mercado Pago</h1>
      <p>Producto basico servido desde el backend.</p>

      {cargandoProducto && <p>Cargando producto...</p>}
      {!cargandoProducto && producto && (
        <section>
          <img src={producto.image} alt={producto.title} width="220" />
          <h2>{producto.title}</h2>
          <p>${producto.price}</p>
          <button onClick={crearPreferencia} disabled={cargando}>
            {cargando ? "Creando preferencia..." : "Comprar"}
          </button>
        </section>
      )}
      {!cargandoProducto && !producto && !error && <p>No hay productos.</p>}
      {error && <p className="error">{error}</p>}
      {!cargando && !error && preferenciaId && (
        <div className="wallet">
          <Wallet initialization={{ preferenceId: preferenciaId }} />
        </div>
      )}
    </main>
  );
}

export default AplicacionPago;
