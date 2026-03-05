import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";

dotenv.config();

const app = express();
const puerto = Number(process.env.PORT) || 3000;
const tokenMP = process.env.MP_ACCESS_TOKEN;
const clienteMP = tokenMP ? new MercadoPagoConfig({ accessToken: tokenMP }) : null;

app.use(cors());
app.use(express.json());

// Verifica que el backend este activo.
app.get("/salud", (_req, res) => {
  res.json({ ok: true, mensaje: "Servidor activo" });
});

// Crea una preferencia simple para probar Mercado Pago.
app.post("/pago/preferencia", async (_req, res) => {
  if (!clienteMP) {
    return res.status(500).json({
      ok: false,
      error: "Falta MP_ACCESS_TOKEN en api/.env",
    });
  }

  try {
    const servicioPreferencia = new Preference(clienteMP);
    const respuesta = await servicioPreferencia.create({
      body: {
        items: [
          {
            title: "Producto de prueba",
            quantity: 1,
            unit_price: 2000,
            currency_id: "ARS",
          },
        ],
        external_reference: `demo_${Date.now()}`,
      },
    });

    return res.json({
      ok: true,
      preferenciaId: respuesta.id,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      error: "No se pudo crear la preferencia",
    });
  }
});

app.listen(puerto, () => {
  console.log(`Servidor API en http://localhost:${puerto}`);
});
