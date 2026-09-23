import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import grpc from '@grpc/grpc-js';
import { Observable } from 'rxjs';

const { status } = grpc;

interface ProductoRequest {
  id: number;
}
interface FiltroPrecioRequest {
  precioMaximo: number;
}
interface ProductoResponse {
  id: number;
  nombre: string;
  precio: number;
}

const INTERVALO_MS = 300;

@Controller()
export class AppController {
  private readonly productos: ProductoResponse[] = [
    { id: 1, nombre: 'Teclado mecánico', precio: 45.9 },
    { id: 2, nombre: 'Mouse inalámbrico', precio: 19.5 },
    { id: 3, nombre: 'Monitor 24"', precio: 129.99 },
  ];

  @GrpcMethod('ProductoService', 'ObtenerProducto')
  obtenerProducto(data: ProductoRequest): ProductoResponse {
    const producto = this.productos.find((p) => p.id === data.id);
    if (!producto) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Producto ${data.id} no existe` });
    }
    return producto;
  }

  @GrpcMethod('ProductoService', 'ListarProductos')
  listarProductos(): Observable<ProductoResponse> {
    return this.emitirUnoPorUno(this.productos);
  }

  @GrpcMethod('ProductoService', 'BuscarPorPrecioMaximo')
  buscarPorPrecioMaximo(data: FiltroPrecioRequest): Observable<ProductoResponse> {
    return this.emitirUnoPorUno(this.productos.filter((p) => p.precio <= data.precioMaximo));
  }

  private emitirUnoPorUno(lista: ProductoResponse[]): Observable<ProductoResponse> {
    return new Observable((subscriber) => {
      let i = 0;
      if (lista.length === 0) {
        subscriber.complete();
        return;
      }
      const interval = setInterval(() => {
        subscriber.next(lista[i]);
        i++;
        if (i >= lista.length) {
          clearInterval(interval);
          subscriber.complete();
        }
      }, INTERVALO_MS);
      return () => clearInterval(interval);
    });
  }
}
