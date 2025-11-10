import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@ApiTags('inventory-movements')
@Controller('inventory/movements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MovementsController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Criar movimentação de estoque' })
  @ApiResponse({ status: 201, description: 'Movimentação criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou estoque insuficiente' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  create(@Body() createMovementDto: CreateMovementDto, @Request() req) {
    return this.inventoryService.createMovement(createMovementDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar movimentações de estoque' })
  @ApiResponse({ status: 200, description: 'Lista de movimentações retornada com sucesso' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.inventoryService.findAllMovements(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar movimentação por ID' })
  @ApiResponse({ status: 200, description: 'Movimentação encontrada' })
  @ApiResponse({ status: 404, description: 'Movimentação não encontrada' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findMovementById(id);
  }
}
