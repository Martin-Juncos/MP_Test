import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";
import productos from "./db/productos.js";

dotenv.config();

const currentFilePath = fileURLToPath(import.meta.url);
const isDirectRun = process.argv[1]
  ? path.resolve(process.argv[1]) === currentFilePath
  : false;

const app = express();
const puerto = Number(process.env.PORT) || 3000;
const tokenMP = process.env.MP_ACCESS_TOKEN;
const clienteMP = tokenMP ? new MercadoPagoConfig({ accessToken: tokenMP }) : null;

function obtenerDiagnosticoMercadoPago(error) {
  const rawMessage = typeof error?.message === "string" ? error.message : "";
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("invalid access token")) {
    return {
      status: 500,
      publicMessage: "Credenciales de Mercado Pago invalidas o vencidas",
      logMessage: rawMessage,
    };
  }

  const causeSummary = Array.isArray(error?.cause)
    ? error.cause
        .map((cause) =>
          [cause?.code, cause?.description].filter(Boolean).join(": "),
        )
        .filter(Boolean)
        .join(" | ")
    : "";

  return {
    status: 502,
    publicMessage: "Mercado Pago rechazo la creacion de la preferencia",
    logMessage: causeSummary || rawMessage || "Error desconocido",
  };
}

app.use(cors());
app.use(express.json());

// Verifica que el backend este activo.
app.get("/salud", (_req, res) => {
  res.json({ ok: true, mensaje: "Servidor activo" });
});

// Devuelve productos basicos para el frontend.
app.get("/productos", (_req, res) => {
  res.json({ ok: true, productos });
});

// Crea una preferencia simple a partir de un producto del servidor.
app.post("/pago/preferencia", async (req, res) => {
  if (!clienteMP) {
    return res.status(500).json({
      ok: false,
      error: "Falta MP_ACCESS_TOKEN en api/.env",
    });
  }

  const productId = Number(req.body?.productId);
  const producto = productos.find((item) => item.id === productId);

  if (!producto) {
    return res.status(404).json({
      ok: false,
      error: "Producto no encontrado",
    });
  }

  try {
    const servicioPreferencia = new Preference(clienteMP);
    const respuesta = await servicioPreferencia.create({
      body: {
        items: [
          {
            title: producto.title,
            quantity: 1,
            unit_price: producto.price,
            currency_id: "ARS",
          },
        ],
        external_reference: `producto_${producto.id}_${Date.now()}`,
      },
    });

    return res.json({
      ok: true,
      preferenciaId: respuesta.id,
    });
  } catch (error) {
    const diagnostico = obtenerDiagnosticoMercadoPago(error);

    console.error(
      `[mercadopago] Error al crear preferencia: ${diagnostico.logMessage}`,
    );

    return res.status(diagnostico.status).json({
      ok: false,
      error: diagnostico.publicMessage,
    });
  }
});

if (isDirectRun) {
  app.listen(puerto, () => {
    console.log(`Servidor API en http://localhost:${puerto}`);
  });
}

export { app };
