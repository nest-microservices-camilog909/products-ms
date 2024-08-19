import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
	public readonly logger = new Logger('ProductsService');

	async onModuleInit() {
		await this.$connect();
		this.logger.log('Database is connected');
	}

	create(createProductDto: CreateProductDto) {
		return this.product.create({
			data: createProductDto,
		});
	}

	async findAll(paginationDto: PaginationDto) {
		const { page, limit } = paginationDto;

		const totalRows = await this.product.count({
			where: {
				available: true,
			},
		});

		return {
			data: await this.product.findMany({
				skip: (page - 1) * limit,
				take: limit,
				where: {
					available: true,
				},
			}),
			currentPage: page,
			total: totalRows,
			totalPages: Math.ceil(totalRows / limit),
		};
	}

	async findOne(id: number) {
		const foundProduct = await this.product.findFirst({
			where: {
				id,
				available: true,
			},
		});

		if (!foundProduct) {
			throw new RpcException({
				status: HttpStatus.NOT_FOUND,
				message: 'Product not found',
			});
		}

		return foundProduct;
	}

	async update(updateProductDto: UpdateProductDto) {
		const { id: _, ...data } = updateProductDto;

		await this.findOne(updateProductDto.id);

		return this.product.update({
			data,
			where: {
				id: updateProductDto.id,
			},
		});
	}

	async remove(id: number) {
		await this.findOne(id);

		return this.product.update({
			data: {
				available: false,
			},
			where: {
				id,
			},
		});
	}
}
