import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosModule } from './productos/productos.module';
import { Producto } from './productos/entities/producto.entity';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configuración de TypeORM con reintentos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: parseInt(configService.get('DATABASE_PORT', '5432')),
        username: configService.get('DATABASE_USER', 'admin'),
        password: configService.get('DATABASE_PASSWORD', 'password123'),
        database: configService.get('DATABASE_NAME', 'productos_db'),
        entities: [Producto],
        synchronize: true, // Cambia a true para crear las tablas automáticamente
        // synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        
        // Configuración de reintentos y conexión
        retryAttempts: 10,
        retryDelay: 3000, // 3 segundos entre intentos
        autoLoadEntities: true,
        
        // Configuración adicional para manejo de conexiones
        connectTimeoutMS: 60000, // 60 segundos de timeout
        acquireTimeoutMillis: 60000,
        timeout: 60000,
        
        // Pool de conexiones
        extra: {
          connectionLimit: 10,
          acquireTimeoutMillis: 60000,
          timeout: 60000,
          reconnect: true,
          reconnectTries: 10,
          reconnectInterval: 3000,
        },
        
        // Callback cuando se alcanzan los reintentos máximos
        onConnectionError: (error: Error) => {
          console.error('❌ Error de conexión a la base de datos:', error.message);
          console.log('🔄 Reintentando conexión...');
        },
      }),
      inject: [ConfigService],
    }),

    // Módulos de la aplicación
    ProductosModule,
  ],
})
export class AppModule {}