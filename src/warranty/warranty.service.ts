import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarrantyService {
  constructor(private prisma: PrismaService) {}

  async getByVariant(variantId: string) {
    const variant = await this.prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found.');
    const warranty = await this.prisma.warranty.findUnique({ where: { variantId } });
    if (!warranty) return null;
    return {
      ...warranty,
      extendedOptions: warranty.extendedOptionsJson ? JSON.parse(warranty.extendedOptionsJson) : [],
    };
  }

  async upsertByVariant(variantId: string, data: { standardYears: number; standardKm: number; extendedOptions?: { label: string; price: number }[] }) {
    const variant = await this.prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found.');
    const extendedOptionsJson = data.extendedOptions ? JSON.stringify(data.extendedOptions) : undefined;
    const warranty = await this.prisma.warranty.upsert({
      where: { variantId },
      update: { standardYears: data.standardYears, standardKm: data.standardKm, extendedOptionsJson },
      create: { variantId, standardYears: data.standardYears, standardKm: data.standardKm, extendedOptionsJson },
    });
    return { ...warranty, extendedOptions: data.extendedOptions || [] };
  }
}
