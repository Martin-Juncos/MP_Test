# Plantilla Base: Integracion Mercado Pago (Desarrollo)

Este repositorio es una plantilla minima para integrar Mercado Pago en entorno local:

- `api/`: backend Node + Express que crea la preferencia.
- `client/`: frontend React (Vite) que renderiza `Wallet Brick`.

La integracion sigue el flujo recomendado por Mercado Pago: el **backend crea la preferencia** y el **frontend solo consume el `preferenceId`** para mostrar el boton/brick.

## 1. Referencias oficiales (Mercado Pago)

Documentacion y repos oficiales usados como base:

- Checkout Bricks (overview): https://www.mercadopago.com/developers/es/docs/checkout-bricks/overview
- Wallet Brick (render por defecto): https://www.mercadopago.com/developers/es/docs/checkout-bricks/wallet-brick/default-rendering
- Crear preferencia (Checkout Pro/Bricks): https://www.mercadopago.com/developers/es/docs/checkout-pro/create-payment-preference
- API Preferences (`POST /checkout/preferences`): https://www.mercadopago.com/developers/es/reference/preferences/_checkout_preferences/post
- Cuentas de prueba / credenciales de test: https://www.mercadopago.com/developers/es/docs/your-integrations/test/accounts
- SDK React oficial: https://github.com/mercadopago/sdk-react
- SDK Node oficial: https://github.com/mercadopago/sdk-nodejs

Fecha de verificacion de enlaces: **2026-03-04**.

## 2. Flujo funcional (resumen)

1. Frontend solicita al backend crear una preferencia (`POST /pago/preferencia`).
2. Backend usa `MP_ACCESS_TOKEN` para llamar a Mercado Pago y crear la preferencia.
3. Backend devuelve `preferenciaId`.
4. Frontend inicializa SDK con `VITE_MP_PUBLIC_KEY` y renderiza `<Wallet />` con ese `preferenciaId`.
5. Usuario hace clic y Mercado Pago continua el checkout.

## 3. Variables de entorno

### Backend (`api/.env`)

```env
PORT=3000
MP_ACCESS_TOKEN=APP_USR-...   # Access Token (cuenta vendedor de prueba)
```

### Frontend (`client/.env`)

```env
VITE_MP_PUBLIC_KEY=APP_USR-... # Public Key (misma cuenta de prueba del vendedor)
VITE_API_URL=http://localhost:3000
```

## 4. Backend: como funciona

Archivo principal: `api/index.js`.

Puntos clave:

- Carga variables con `dotenv`.
- Crea cliente MP con `MercadoPagoConfig`.
- Expone `POST /pago/preferencia`.
- Define el item y monto **en servidor** (no confiar montos enviados por cliente).
- Retorna solo lo necesario para frontend (`preferenciaId`).

Ejemplo de respuesta:

```json
{
  "ok": true,
  "preferenciaId": "2120330536-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

## 5. Frontend: como funciona

Componente principal: `client/src/AplicacionPago.jsx`.

Puntos clave:

- Inicializa SDK con `initMercadoPago(VITE_MP_PUBLIC_KEY)`.
- Hace `fetch` a `POST ${VITE_API_URL}/pago/preferencia`.
- Guarda el `preferenciaId` en estado.
- Renderiza:

```jsx
<Wallet initialization={{ preferenceId: preferenciaId }} />
```

## 6. Arranque local paso a paso

### 6.1 Levantar backend

```bash
cd api
npm install
npm run dev
```

### 6.2 Levantar frontend

```bash
cd client
npm install
npm run dev
```

## 7. Prueba manual de punta a punta

1. Abrir frontend (`http://localhost:5173` o puerto que indique Vite).
2. Confirmar que aparece el boton de Mercado Pago.
3. Hacer clic y validar redireccion/flujo de pago.
4. Verificar que el backend responde `ok: true` en creacion de preferencia.

Tip rapido para validar backend:

```bash
curl -X POST http://localhost:3000/pago/preferencia
```

## 8. Errores comunes y solucion

### Error: `get_preference_details_failed` + `404`

Causa habitual:

- Se esta enviando una credencial (`APP_USR...`) como si fuera `preferenceId`.

Solucion:

- El `preferenceId` debe venir del backend luego de crear la preferencia.
- No hardcodear `preferenceId` en `.env` frontend.

### Error: `Failed to resolve import "@mercadopago/sdk-react"`

Causa:

- Falta dependencia en frontend.

Solucion:

```bash
cd client
npm install @mercadopago/sdk-react
```

### El boton aparece con error en rojo

Checklist:

- `MP_ACCESS_TOKEN` correcto en `api/.env`.
- `VITE_MP_PUBLIC_KEY` correcto en `client/.env`.
- Ambas credenciales de la misma cuenta (idealmente de prueba).
- Backend corriendo y accesible desde frontend (`VITE_API_URL`).

## 9. Reutilizar esta plantilla en otro proyecto

1. Copiar carpetas `api/` y `client/`.
2. Ajustar item/monto en `POST /pago/preferencia`.
3. Configurar nuevas credenciales de test en ambos `.env`.
4. Probar flujo local.
5. Recien despues avanzar a webhook/confirmacion de pagos para produccion.

---

Si vas a usarla en produccion, agrega como siguiente paso:

- webhook de notificaciones,
- validacion de firma,
- reconciliacion de estado de pago en base de datos,
- idempotencia por `payment_id` / `notification_id`.
