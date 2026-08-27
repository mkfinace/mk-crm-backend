import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/slugify';

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

  createModel(data: { brandId: string; name: string; category?: string }) {
    return this.prisma.model.create({ data });
  }

  async updateModel(id: string, data: { brandId?: string; name?: string; category?: string }) {
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

  // ---- Public model detail page (for /[brand]/[model] on the website) ----
  // Brand/Model have no dedicated slug column, so we slugify the name and
  // match against the URL params. Returns every variant with its Field
  // Builder specs (grouped by category) and colours/images.
  async getModelBySlug(brandSlug: string, modelSlug: string) {
    const brands = await this.prisma.brand.findMany({
      where: { status: 'ACTIVE' },
      include: {
        models: {
          where: { status: 'ACTIVE' },
          include: {
            variants: {
              include: {
                fieldValues: { include: { field: { include: { category: true } } } },
                vehicles: true,
              },
            },
          },
        },
      },
    });

    const brand = brands.find((b) => slugify(b.name) === brandSlug);
    if (!brand) throw new NotFoundException('Brand not found.');

    const model = brand.models.find((m) => slugify(m.name) === modelSlug);
    if (!model) throw new NotFoundException('Model not found.');

    return {
      brand: { id: brand.id, name: brand.name, logoUrl: brand.logoUrl },
      model: { id: model.id, name: model.name, category: model.category },
      variants: model.variants.map((v) => ({
        id: v.id,
        name: v.name,
        fuelType: v.fuelType,
        transmission: v.transmission,
        exShowroomPrice: v.exShowroomPrice,
        featuresJson: v.featuresJson,
        specsJson: v.specsJson,
        specs: v.fieldValues
          .filter((fv) => fv.field.customerVisible)
          .map((fv) => ({
            categoryName: fv.field.category.name,
            categoryOrder: fv.field.category.displayOrder,
            fieldName: fv.field.name,
            fieldKey: fv.field.key,
            dataType: fv.field.dataType,
            unit: fv.field.unit,
            applicability: fv.applicability,
            valueText: fv.valueText,
            valueNumber: fv.valueNumber,
            valueBoolean: fv.valueBoolean,
            displayOrder: fv.field.displayOrder,
          })),
        vehicle: v.vehicles[0]
          ? {
              colours: v.vehicles[0].colourOptionsJson ? JSON.parse(v.vehicles[0].colourOptionsJson) : [],
              images: v.vehicles[0].imagesJson ? JSON.parse(v.vehicles[0].imagesJson) : [],
            }
          : { colours: [], images: [] },
      })),
    };
  }
}
