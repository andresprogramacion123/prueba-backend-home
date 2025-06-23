import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('productos')
export class Producto {
  @ApiProperty({
    description: 'ID único del producto',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Laptop Dell Inspiron'
  })
  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @ApiProperty({
    description: 'Precio del producto',
    example: 1299.99
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @ApiProperty({
    description: 'Cantidad en stock',
    example: 15
  })
  @Column({ type: 'int' })
  stock: number;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-15T10:30:00Z'
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-15T10:30:00Z'
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}