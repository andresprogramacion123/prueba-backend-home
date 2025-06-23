import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './entities/producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
  ) {}

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    try {
      // Verificar si ya existe un producto con el mismo nombre
      const existingProduct = await this.productoRepository.findOne({
        where: { nombre: createProductoDto.nombre }
      });

      if (existingProduct) {
        throw new ConflictException('Ya existe un producto con este nombre');
      }

      const producto = this.productoRepository.create(createProductoDto);
      return await this.productoRepository.save(producto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Error al crear el producto');
    }
  }

  async findAll(): Promise<Producto[]> {
    return await this.productoRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id }
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return producto;
  }

  async update(id: string, updateProductoDto: UpdateProductoDto): Promise<Producto> {
    // Verificar que el producto existe
    const producto = await this.findOne(id);

    // Si se está actualizando el nombre, verificar que no exista otro producto con ese nombre
    if (updateProductoDto.nombre && updateProductoDto.nombre !== producto.nombre) {
      const existingProduct = await this.productoRepository.findOne({
        where: { nombre: updateProductoDto.nombre }
      });

      if (existingProduct) {
        throw new ConflictException('Ya existe un producto con este nombre');
      }
    }

    try {
      await this.productoRepository.update(id, updateProductoDto);
      return await this.findOne(id);
    } catch (error) {
      throw new ConflictException('Error al actualizar el producto');
    }
  }

  async remove(id: string): Promise<void> {
    const producto = await this.findOne(id);
    
    try {
      await this.productoRepository.remove(producto);
    } catch (error) {
      throw new ConflictException('Error al eliminar el producto');
    }
  }

  async findByName(nombre: string): Promise<Producto[]> {
    return await this.productoRepository.find({
      where: { nombre: nombre }
    });
  }

  async findLowStock(minStock: number = 5): Promise<Producto[]> {
    return await this.productoRepository
      .createQueryBuilder('producto')
      .where('producto.stock <= :minStock', { minStock })
      .orderBy('producto.stock', 'ASC')
      .getMany();
  }
}