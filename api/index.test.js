import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.MP_ACCESS_TOKEN = "";
process.env.PORT = "0";

const { app } = await import("./index.js");

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const address = server.address();

      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

test("POST /pago/preferencia informa cuando falta MP_ACCESS_TOKEN", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/pago/preferencia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: 1 }),
    });
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.deepEqual(body, {
      ok: false,
      error: "Falta MP_ACCESS_TOKEN en api/.env",
    });
  } finally {
    await stopServer(server);
  }
});
