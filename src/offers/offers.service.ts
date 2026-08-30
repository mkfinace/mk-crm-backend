import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  async createOffer(
    data: {
      title: string;
      description?: string;
      discountType: string;
      discountValue: number;
      brandId?: string;
      modelId?: string;
      variantId?: string;
      validFrom: string;
      validTo: string;
    },
    createdBy?: string,
  ) {
    if (new Date(data.validTo) <= new Date(data.validFrom)) {
      throw new BadRequestException('Valid-to date must be after valid-from date.');
    }
    return this.prisma.offer.create({
      data: {
        title: data.title,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        brandId: data.brandId,
        modelId: data.modelId,
        variantId: data.variantId,
        validFrom: new Date(data.validFrom),
        validTo: new Date(data.validTo),
        createdBy,
      },
    });
  }

  // scope filters which offers are relevant to a given brand/model/variant
  // (storewide offers with no scope always included); activeOnly filters to
  // today's date window + ACTIVE status, for customer-facing display.
  async listOffers(params?: { brandId?: string; modelId?: string; variantId?: string; activeOnly?: boolean }) {
    const now = new Date();
    const scopeOr = params?.brandId || params?.modelId || params?.variantId
      ? [
          { brandId: null, modelId: null, variantId: null }, // storewide
          ...(params.brandId ? [{ brandId: params.brandId, modelId: null, variantId: null }] : []),
          ...(params.modelId ? [{ modelId: params.modelId, variantId: null }] : []),
          ...(params.variantId ? [{ variantId: params.variantId }] : []),
        ]
      : undefined;

    return this.prisma.offer.findMany({
      where: {
        ...(scopeOr ? { OR: scopeOr } : {}),
        ...(params?.activeOnly ? { status: 'ACTIVE', validFrom: { lte: now }, validTo: { gte: now } } : {}),
      },
      include: { brand: true, model: true, variant: true },
      orderBy: { validFrom: 'desc' },
    });
  }

  async updateOffer(id: string, data: { title?: string; description?: string; discountType?: string; discountValue?: number; validFrom?: string; validTo?: string; status?: string }) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found.');
    const validFrom = data.validFrom ? new Date(data.validFrom) : offer.validFrom;
    const validTo = data.validTo ? new Date(data.validTo) : offer.validTo;
    if (validTo <= validFrom) throw new BadRequestException('Valid-to date must be after valid-from date.');
    return this.prisma.offer.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        validFrom: data.validFrom ? validFrom : undefined,
        validTo: data.validTo ? validTo : undefined,
        status: data.status,
      },
    });
  }

  async deleteOffer(id: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found.');
    return this.prisma.offer.delete({ where: { id } });
  }
}
