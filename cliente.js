import path from 'node:path';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const PROTO_PATH = path.join(import.meta.dirname, 'src', 'productos.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true });
const proto = grpc.loadPackageDefinition(packageDef).productos;

const client = new proto.ProductoService('localhost:5000', grpc.credentials.createInsecure());

const unary = (id) =>
  new Promise((resolve) => {
    client.obtenerProducto({ id }, (err, producto) => resolve({ err, producto }));
  });

const streaming = (metodo, peticion) =>
  new Promise((resolve) => {
    const inicio = Date.now();
    const call = client[metodo](peticion);
    call.on('data', (p) => {
      console.log(`${p.id} - ${p.nombre} - $${p.precio}  (llegó en streaming, +${Date.now() - inicio} ms)`);
    });
    call.on('end', () => {
      console.log('Streaming finalizado.');
      resolve();
    });
    call.on('error', (err) => {
      console.error('Error en el stream:', err.code, err.details);
      resolve();
    });
  });

console.log('== ObtenerProducto (unary) ==');
const { err, producto } = await unary(1);
if (err) {
  console.error('Error gRPC:', err.code, err.details);
} else {
  console.log(`${producto.id} - ${producto.nombre} - $${producto.precio}`);
}

console.log('\n== ListarProductos (server streaming) ==');
await streaming('listarProductos', {});

console.log('\n== Prueba de error (id inexistente) ==');
const prueba = await unary(999);
if (prueba.err) {
  console.log(`Error gRPC: ${prueba.err.code} - ${prueba.err.details}`);
} else {
  console.log('No debería llegar aquí:', prueba.producto);
}

console.log('\n== BuscarPorPrecioMaximo(50) (server streaming, reto) ==');
await streaming('buscarPorPrecioMaximo', { precioMaximo: 50 });

client.close();
