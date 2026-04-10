import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateCheckoutDto {
  // nuevo campo preferido
  @IsOptional()
  @IsString()
  @IsIn(['monthly', 'annual'])
  planType?: 'monthly' | 'annual';

  // campo legacy del frontend — se ignora si viene planType
  @IsOptional()
  @IsString()
  priceId?: string;
}
