import { IsNotEmpty, IsString, IsNumber, IsPositive, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductoDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Laptop Dell Inspiron',
    maxLength: 255
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Precio del producto',
    example: 1299.99,
    minimum: 0.01
  })
  @IsNotEmpty({ message: 'El precio es obligatorio' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número con máximo 2 decimales' })
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  @Type(() => Number)
  precio: number;

  @ApiProperty({
    description: 'Cantidad en stock',
    example: 15,
    minimum: 0
  })
  @IsNotEmpty({ message: 'El stock es obligatorio' })
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Type(() => Number)
  stock: number;
}