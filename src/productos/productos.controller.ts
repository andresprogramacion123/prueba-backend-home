import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiBody({ type: CreateProductoDto })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
    type: Producto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - El producto ya existe',
  })
  async create(
    @Body(ValidationPipe) createProductoDto: CreateProductoDto,
  ): Promise<Producto> {
    return await this.productosService.create(createProductoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente',
    type: [Producto],
  })
  async findAll(): Promise<Producto[]> {
    return await this.productosService.findAll();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Obtener productos con stock bajo' })
  @ApiQuery({
    name: 'minStock',
    required: false,
    description: 'Stock mínimo para considerar como bajo',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos con stock bajo',
    type: [Producto],
  })
  async findLowStock(@Query('minStock') minStock?: number): Promise<Producto[]> {
    return await this.productosService.findLowStock(minStock);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar productos por nombre' })
  @ApiQuery({
    name: 'nombre',
    required: true,
    description: 'Nombre del producto a buscar',
    example: 'Laptop',
  })
  @ApiResponse({
    status: 200,
    description: 'Productos encontrados',
    type: [Producto],
  })
  async findByName(@Query('nombre') nombre: string): Promise<Producto[]> {
    return await this.productosService.findByName(nombre);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID único del producto (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    type: Producto,
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido (debe ser UUID)',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Producto> {
    return await this.productosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiParam({
    name: 'id',
    description: 'ID único del producto (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateProductoDto })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
    type: Producto,
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto al actualizar',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateProductoDto: UpdateProductoDto,
  ): Promise<Producto> {
    return await this.productosService.update(id, updateProductoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiParam({
    name: 'id',
    description: 'ID único del producto (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Producto eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto al eliminar',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.productosService.remove(id);
  }
}