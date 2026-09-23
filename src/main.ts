import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const puerto = process.env.PORT ?? '5000';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'productos',
      protoPath: join(import.meta.dirname, 'productos.proto'),
      url: `0.0.0.0:${puerto}`,
    },
  });
  await app.listen();
  console.log(`Microservicio gRPC escuchando en 0.0.0.0:${puerto}`);
}
await bootstrap();
