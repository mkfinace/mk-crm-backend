import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const VALID_APPLICABILITY = ['STANDARD', 'OPTIONAL', 'NOT_AVAILABLE'];

@Injectable()
export class FeaturesService {
  constructor(private prisma: PrismaService) {}

  // ---- Library CRUD ----

  async createFeature(data: { name: string; category?: string; icon?: string }) {
    const existing = await this.prisma.feature.findUnique({ where: { name: data.name } });
    if (existing) {
      if (existing.status === 'ARCHIVED') {
        throw new BadRequestException(`"${data.name}" already exists as an archived feature — restore it instead of creating a duplicate.`);
      }
      throw new BadRequestException(`A feature named "${data.name}" already exists.`);
    }
    return this.prisma.feature.create({ data });
  }

  listFeatures(includeArchived?: boolean) {
    return this.prisma.feature.findMany({
      where: includeArchived ? {} : { status: 'ACTIVE' },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async updateFeature(id: string, data: { name?: string; category?: string; icon?: string; status?: string }) {
    const feature = await this.prisma.feature.findUnique({ where: { id } });
    if (!feature) throw new NotFoundException('Feature not found.');
    if (data.name && data.name !== feature.name) {
      const clash = await this.prisma.feature.findUnique({ where: { name: data.name } });
      if (clash) throw new BadRequestException(`A feature named "${data.name}" already exists.`);
    }
    return this.prisma.feature.update({ where: { id }, data });
  }

  async deleteFeature(id: string) {
    const feature = await this.prisma.feature.findUnique({ where: { id } });
    if (!feature) throw new NotFoundException('Feature not found.');
    const inUse = await this.prisma.variantFeature.count({ where: { featureId: id } });
    if (inUse > 0) {
      throw new BadRequestException(`"${feature.name}" is assigned to ${inUse} variant(s) — archive it instead of deleting, or remove those assignments first.`);
    }
    return this.prisma.feature.delete({ where: { id } });
  }

  // ---- Variant assignment ----

  getVariantFeatures(variantId: string) {
    return this.prisma.variantFeature.findMany({
      where: { variantId },
      include: { feature: true },
      orderBy: { feature: { name: 'asc' } },
    });
  }

  // Bulk-replace — the admin UI sends the full current set each save, so a
  // delete-then-recreate inside one transaction is simpler and safer than
  // diffing, and there's never more than a few dozen rows per variant.
  async setVariantFeatures(variantId: string, items: { featureId: string; applicability: string }[]) {
    const variant = await this.prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found.');
    for (const item of items) {
      if (!VALID_APPLICABILITY.includes(item.applicability)) {
        throw new BadRequestException(`Invalid applicability "${item.applicability}" — must be one of ${VALID_APPLICABILITY.join(', ')}.`);
      }
    }
    await this.prisma.$transaction([
      this.prisma.variantFeature.deleteMany({ where: { variantId } }),
      ...items.map((item) =>
        this.prisma.variantFeature.create({ data: { variantId, featureId: item.featureId, applicability: item.applicability } }),
      ),
    ]);
    return this.getVariantFeatures(variantId);
  }
}
