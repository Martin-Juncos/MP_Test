import React, { useEffect, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

const clavePublica = import.meta.env.VITE_MP_PUBLIC_KEY;
const urlApi = import.meta.env.VITE_API_URL || "http://localhost:3000";

if (clavePublica) {
  // Inicializa el SDK de Mercado Pago en el navegador.
  initMercadoPago(clavePublica);
}

function AplicacionPago() {
  const [preferenciaId, setPreferenciaId] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Pide al backend una preferencia valida para renderizar Wallet.
    const crearPreferencia = async () => {
      if (!clavePublica) {
        setError("Falta VITE_MP_PUBLIC_KEY en MP-Test/.env");
        return;
      }

      setCargando(true);
      setError("");

      try {
        const respuesta = await fetch(`${urlApi}/pago/preferencia`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

    crearPreferencia();
  }, []);

  return (
    <main className="contenedor">
      <h1>Demo minima Mercado Pago</h1>
      <p>Boton de pago basico para pruebas.</p>

      {cargando && <p>Creando preferencia...</p>}
      {!cargando && error && <p className="error">{error}</p>}
      {!cargando && !error && preferenciaId && (
        <div className="wallet">
          <Wallet initialization={{ preferenceId: preferenciaId }} />
        </div>
      )}
    </main>
  );
}

export default AplicacionPago;
