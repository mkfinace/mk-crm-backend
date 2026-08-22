import { Injectable } from '@nestjs/common';
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
