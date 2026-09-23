import { RpcException } from '@nestjs/microservices';
import { lastValueFrom, toArray } from 'rxjs';
import { AppController } from './app.controller.js';

describe('AppController (gRPC)', () => {
  const controller = new AppController();

  it('obtenerProducto devuelve el producto pedido', () => {
    expect(controller.obtenerProducto({ id: 2 })).toMatchObject({ id: 2, nombre: 'Mouse inalámbrico' });
  });

  it('obtenerProducto lanza NOT_FOUND (5) si el id no existe', () => {
    try {
      controller.obtenerProducto({ id: 999 });
      expect.unreachable('debía lanzar una RpcException');
    } catch (error) {
      expect(error).toBeInstanceOf(RpcException);
      expect((error as RpcException).getError()).toMatchObject({ code: 5, message: 'Producto 999 no existe' });
    }
  });

  it('listarProductos emite los 3 productos y termina', async () => {
    const productos = await lastValueFrom(controller.listarProductos().pipe(toArray()));
    expect(productos.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it('buscarPorPrecioMaximo filtra por precio y admite resultados vacíos', async () => {
    const hasta50 = await lastValueFrom(controller.buscarPorPrecioMaximo({ precioMaximo: 50 }).pipe(toArray()));
    expect(hasta50.map((p) => p.id)).toEqual([1, 2]);
    const ninguno = await lastValueFrom(controller.buscarPorPrecioMaximo({ precioMaximo: 1 }).pipe(toArray()), { defaultValue: [] });
    expect(ninguno).toEqual([]);
  });
});
