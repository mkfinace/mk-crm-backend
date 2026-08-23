import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogueService {
  constructor(private prisma: PrismaService) {}

  // ---- Brands ----
  listBrands() {
    return this.prisma.brand.findMany({ where: { status: 'ACTIVE' }, include: { models: true } });
  }

  createBrand(data: { name: string; logoUrl?: string }) {
    return this.prisma.brand.create({ data });
  }

  async updateBrand(id: string, data: { name?: string; logoUrl?: string }) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found.');
    return this.prisma.brand.update({ where: { id }, data });
  }

  async deleteBrand(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found.');
    try {
      return await this.prisma.brand.delete({ where: { id } });
    } catch (e) {
      throw new BadRequestException('Cannot delete this brand — it still has models or leads linked to it. Delete those first.');
    }
  }

  // ---- Models ----
  listModels(brandId?: string) {
    return this.prisma.model.findMany({
      where: { status: 'ACTIVE', ...(brandId ? { brandId } : {}) },
      include: { variants: true, brand: true },
    });
  }

  createModel(data: { brandId: string; name: string }) {
    return this.prisma.model.create({ data });
  }

  async updateModel(id: string, data: { brandId?: string; name?: string }) {
    const model = await this.prisma.model.findUnique({ where: { id } });
    if (!model) throw new NotFoundException('Model not found.');
    return this.prisma.model.update({ where: { id }, data });
  }

  async deleteModel(id: string) {
    const model = await this.prisma.model.findUnique({ where: { id } });
    if (!model) throw new NotFoundException('Model not found.');
    try {
      return await this.prisma.model.delete({ where: { id } });
    } catch (e) {
      throw new BadRequestException('Cannot delete this model — it still has variants or leads linked to it. Delete those first.');
    }
  }

  // ---- Variants ----
  listVariants(modelId?: string) {
    return this.prisma.variant.findMany({
      where: modelId ? { modelId } : {},
      include: { model: { include: { brand: true } }, vehicles: true },
    });
  }

  createVariant(data: {
    modelId: string;
    name: string;
    fuelType: string;
    transmission: string;
    exShowroomPrice: number;
    featuresJson?: string;
    specsJson?: string;
  }) {
    return this.prisma.variant.create({ data });
  }

  async updateVariant(id: string, data: {
    modelId?: string;
    name?: string;
    fuelType?: string;
    transmission?: string;
    exShowroomPrice?: number;
    featuresJson?: string;
    specsJson?: string;
  }) {
    const variant = await this.prisma.variant.findUnique({ where: { id } });
    if (!variant) throw new NotFoundException('Variant not found.');
    return this.prisma.variant.update({ where: { id }, data });
  }

  async deleteVariant(id: string) {
    const variant = await this.prisma.variant.findUnique({ where: { id } });
    if (!variant) throw new NotFoundException('Variant not found.');
    try {
      return await this.prisma.variant.delete({ where: { id } });
    } catch (e) {
      throw new BadRequestException('Cannot delete this variant — it still has vehicles or leads linked to it. Delete those first.');
    }
  }

  // ---- Public catalogue view (full tree, for the website) ----
  async fullCatalogue() {
    return this.prisma.brand.findMany({
      where: { status: 'ACTIVE' },
      include: {
        models: {
          where: { status: 'ACTIVE' },
          include: { variants: { include: { vehicles: true } } },
        },
      },
    });
  }
}
