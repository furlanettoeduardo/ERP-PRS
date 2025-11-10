import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateMovementDto, MovementType } from './dto/create-movement.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== PRODUCTS ====================

  async createProduct(data: CreateProductDto) {
    // Verificar se SKU já existe
    const existing = await this.prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      throw new ConflictException('SKU já existe');
    }

    return this.prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        price: data.price,
        cost: data.cost,
        currentStock: data.currentStock || 0,
        minStock: data.minStock || 0,
        active: data.active !== undefined ? data.active : true,
      },
    });
  }

  async findAllProducts(query: QueryProductsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async updateProduct(id: string, data: UpdateProductDto) {
    await this.findProductById(id);

    // Se tentando alterar SKU, verificar se não existe outro produto com esse SKU
    if (data.sku) {
      const existing = await this.prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('SKU já existe em outro produto');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async deleteProduct(id: string) {
    await this.findProductById(id);

    return this.prisma.product.delete({
      where: { id },
    });
  }

  // ==================== STOCK MOVEMENTS ====================

  async createMovement(data: CreateMovementDto, userId: string) {
    // Buscar produto
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const previousStock = product.currentStock;
    let newStock = previousStock;

    // Calcular novo estoque baseado no tipo
    switch (data.type) {
      case MovementType.ENTRY:
        newStock = previousStock + data.quantity;
        break;
      case MovementType.EXIT:
        newStock = previousStock - data.quantity;
        if (newStock < 0) {
          throw new BadRequestException(
            'Estoque insuficiente. Estoque atual: ' + previousStock,
          );
        }
        break;
      case MovementType.ADJUSTMENT:
        // Para ajuste, a quantidade representa o novo estoque absoluto
        newStock = data.quantity;
        break;
    }

    // Criar movimentação e atualizar estoque em transação
    const movement = await this.prisma.$transaction(async (tx) => {
      // Criar registro de movimentação
      const mov = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          type: data.type,
          quantity: data.quantity,
          previousStock,
          newStock,
          userId,
          origin: data.origin || 'MANUAL',
          note: data.note,
        },
        include: {
          product: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Atualizar estoque do produto
      await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: newStock },
      });

      return mov;
    });

    return movement;
  }

  async findAllMovements(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, sku: true, name: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.stockMovement.count(),
    ]);

    return {
      movements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMovementById(id: string) {
    const movement = await this.prisma.stockMovement.findUnique({
      where: { id },
      include: {
        product: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!movement) {
      throw new NotFoundException('Movimentação não encontrada');
    }

    return movement;
  }

  // ==================== DASHBOARD ====================

  async getDashboardStats() {
    const [totalProducts, totalStockAggregate, lowStockProducts, recentMovements] = await Promise.all([
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.product.aggregate({
        _sum: { currentStock: true },
      }),
      this.prisma.product.count({
        where: {
          active: true,
          currentStock: {
            lte: this.prisma.product.fields.minStock,
          },
        },
      }),
      this.prisma.stockMovement.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 dias
          },
        },
      }),
    ]);

    return {
      totalProducts,
      totalStock: totalStockAggregate._sum.currentStock || 0,
      lowStockProducts,
      recentMovements,
    };
  }
}
