import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { Producto } from './entities/producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

describe('ProductosService', () => {
  let service: ProductosService;
  let repository: Repository<Producto>;

  // Mock del repositorio
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  // Datos de prueba
  const mockProducto: Producto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nombre: 'Laptop Test',
    precio: 1299.99,
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createProductoDto: CreateProductoDto = {
    nombre: 'Laptop Test',
    precio: 1299.99,
    stock: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductosService,
        {
          provide: getRepositoryToken(Producto),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductosService>(ProductosService);
    repository = module.get<Repository<Producto>>(getRepositoryToken(Producto));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new producto successfully', async () => {
      mockRepository.findOne.mockResolvedValue(null); // No existe producto con el mismo nombre
      mockRepository.create.mockReturnValue(mockProducto);
      mockRepository.save.mockResolvedValue(mockProducto);

      const result = await service.create(createProductoDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { nombre: createProductoDto.nombre }
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createProductoDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockProducto);
      expect(result).toEqual(mockProducto);
    });

    it('should throw ConflictException if producto with same name exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockProducto); // Producto ya existe

      await expect(service.create(createProductoDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException on save error', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockProducto);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createProductoDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of productos', async () => {
      const productos = [mockProducto];
      mockRepository.find.mockResolvedValue(productos);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' }
      });
      expect(result).toEqual(productos);
    });

    it('should return empty array if no productos found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a producto if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockProducto);

      const result = await service.findOne(mockProducto.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProducto.id }
      });
      expect(result).toEqual(mockProducto);
    });

    it('should throw NotFoundException if producto not found', async () => {
      const id = 'non-existing-id';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id }
      });
    });
  });

  describe('update', () => {
    const updateProductoDto: UpdateProductoDto = {
      nombre: 'Laptop Actualizada',
      precio: 1399.99,
    };

    it('should update a producto successfully', async () => {
      const updatedProducto = { ...mockProducto, ...updateProductoDto };
      
      mockRepository.findOne
        .mockResolvedValueOnce(mockProducto) // Para findOne en update
        .mockResolvedValueOnce(null) // Para verificar nombre único
        .mockResolvedValueOnce(updatedProducto); // Para findOne final
      
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(mockProducto.id, updateProductoDto);

      expect(mockRepository.update).toHaveBeenCalledWith(mockProducto.id, updateProductoDto);
      expect(result).toEqual(updatedProducto);
    });

    it('should throw NotFoundException if producto not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existing-id', updateProductoDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if updating to existing name', async () => {
      const existingProducto = { ...mockProducto, id: 'different-id' };
      
      mockRepository.findOne
        .mockResolvedValueOnce(mockProducto) // Producto a actualizar existe
        .mockResolvedValueOnce(existingProducto); // Ya existe otro con ese nombre

      await expect(service.update(mockProducto.id, updateProductoDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a producto successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockProducto);
      mockRepository.remove.mockResolvedValue(mockProducto);

      await service.remove(mockProducto.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProducto.id }
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockProducto);
    });

    it('should throw NotFoundException if producto not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException on remove error', async () => {
      mockRepository.findOne.mockResolvedValue(mockProducto);
      mockRepository.remove.mockRejectedValue(new Error('Database error'));

      await expect(service.remove(mockProducto.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByName', () => {
    it('should return productos with matching name', async () => {
      const productos = [mockProducto];
      mockRepository.find.mockResolvedValue(productos);

      const result = await service.findByName('Laptop Test');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { nombre: 'Laptop Test' }
      });
      expect(result).toEqual(productos);
    });
  });

  describe('findLowStock', () => {
    it('should return productos with low stock', async () => {
      const lowStockProductos = [mockProducto];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(lowStockProductos),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findLowStock(5);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('producto');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'producto.stock <= :minStock',
        { minStock: 5 }
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('producto.stock', 'ASC');
      expect(result).toEqual(lowStockProductos);
    });

    it('should use default minStock value', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findLowStock();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'producto.stock <= :minStock',
        { minStock: 5 }
      );
    });
  });
});