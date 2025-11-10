import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({ example: 'PROD-001', description: 'SKU único do produto', required: false })
  sku?: string;

  @ApiProperty({ example: 'Notebook Dell Inspiron 15', description: 'Nome do produto', required: false })
  name?: string;
}
