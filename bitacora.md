# Bitácora — Práctica 3: microservicio gRPC (NestJS)

## Qué se construyó

Un microservicio gRPC con NestJS (`Transport.GRPC`, puerto 5000) que expone `ProductoService`, definido en `src/productos.proto`:

| RPC | Tipo | Qué hace |
|---|---|---|
| `ObtenerProducto` | unary | Devuelve un producto por id; si no existe, lanza `RpcException` con `NOT_FOUND` (5). |
| `ListarProductos` | server streaming | Envía los 3 productos uno por uno, con 300 ms entre cada uno. |
| `BuscarPorPrecioMaximo` (reto) | server streaming | Envía solo los productos con `precio <= precioMaximo`. |

`cliente.js` es un cliente en Node.js puro (sin Nest, con `@grpc/grpc-js` y `@grpc/proto-loader`) que prueba los cuatro casos. Salida real:

```
== ObtenerProducto (unary) ==
1 - Teclado mecánico - $45.9
== ListarProductos (server streaming) ==
1 - Teclado mecánico - $45.9  (llegó en streaming, +326 ms)
2 - Mouse inalámbrico - $19.5  (llegó en streaming, +633 ms)
3 - Monitor 24" - $129.99  (llegó en streaming, +944 ms)
Streaming finalizado.
== Prueba de error (id inexistente) ==
Error gRPC: 5 - Producto 999 no existe
== BuscarPorPrecioMaximo(50) (server streaming, reto) ==
1 - Teclado mecánico - $45.9  (llegó en streaming, +316 ms)
2 - Mouse inalámbrico - $19.5  (llegó en streaming, +626 ms)
Streaming finalizado.
```

## Reto: ¿por qué `BuscarPorPrecioMaximo` debe ser server streaming y no unary?

Porque el número de resultados no se conoce de antemano: con `precioMaximo = 1` no hay ninguno, con 50 hay 2 y con 500 podrían ser miles. Un método unary devuelve **un solo** mensaje de respuesta, así que habría que empaquetar todos los resultados en un mensaje con un campo `repeated`, y el cliente no vería nada hasta que el servidor terminara de armar y enviar todo. Con server streaming el servidor envía cada producto en cuanto lo tiene y el cliente lo procesa al recibirlo, sin cargar la lista completa en memoria. Si el resultado fuera siempre exactamente uno (como buscar por id), unary sería lo correcto.

## gRPC (esta práctica) frente a REST (semana 2)

- **Más rápido de escribir en REST:** un controlador con decoradores y ya se prueba en el navegador o en Swagger. En gRPC hay que escribir primero el `.proto`, configurar el transporte y escribir un cliente aparte para poder probar.
- **Más difícil de depurar en gRPC:** no se puede abrir la URL en un navegador ni ver el cuerpo en texto legible; los errores llegan como códigos (`5 NOT_FOUND`) y un mensaje corto, y un descuido en el `.proto` o en el nombre del método (`@GrpcMethod('ProductoService', 'ObtenerProducto')`) falla en tiempo de ejecución.
- **Lo que gana gRPC:** el contrato (`.proto`) es fuente única y tipada para cliente y servidor, y el streaming viene incluido, algo que en REST habría que resolver con paginación o WebSockets.
- **Detalle técnico de esta versión:** el CLI actual de Nest genera un proyecto con módulos ES (`"type": "module"`). Por eso `__dirname` y `require` de la guía no existen: se usó `import.meta.dirname` en `main.ts` y `cliente.js`, y `@grpc/grpc-js` se importa como `import grpc from '@grpc/grpc-js'` (es un paquete CommonJS).

## Declaración de uso de IA

### Declaración de uso de IA
- Herramienta(s): Claude (Anthropic)
- Nivel de uso: 2-3 (borrador/revisor)
- Qué se le pidió: montar el proyecto siguiendo la guía paso a paso (dependencias, `.proto`, `main.ts`, controlador, cliente), implementar el reto y redactar esta bitácora.
- Qué se modificó/verificó manualmente: se adaptó el código de la guía a módulos ES; se ejecutó el servidor y `cliente.js` de punta a punta viendo el streaming con pausa entre productos y el error `NOT_FOUND`; se agregaron pruebas unitarias del controlador (`npm test`, 4 en verde).
