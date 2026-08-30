import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async createPrice(
    data: { variantId: string; dealerId?: string; city?: string; exShowroomPrice: number; rtoCharges?: number; insuranceCharges?: number },
    createdBy?: string,
  ) {
    const variant = await this.prisma.variant.findUnique({ where: { id: data.variantId } });
    if (!variant) throw new NotFoundException('Variant not found.');
    if (data.dealerId) {
      const dealer = await this.prisma.dealer.findUnique({ where: { id: data.dealerId } });
      if (!dealer) throw new NotFoundException('Dealer not found.');
    }
    // A dealer-specific row shouldn't also carry a city — the dealer's own
    // city is implied by the dealer record itself.
    return this.prisma.variantPrice.create({
      data: {
        variantId: data.variantId,
        dealerId: data.dealerId,
        city: data.dealerId ? undefined : data.city,
        exShowroomPrice: data.exShowroomPrice,
        rtoCharges: data.rtoCharges,
        insuranceCharges: data.insuranceCharges,
        createdBy,
      },
    });
  }

  // Full history for a variant — optionally narrowed to one dealer or city,
  // otherwise every row (dealer-specific + city-level + global) so the
  // admin pricing page can show the whole picture at once.
  listHistory(variantId: string, dealerId?: string, city?: string) {
    return this.prisma.variantPrice.findMany({
      where: {
        variantId,
        ...(dealerId ? { dealerId } : {}),
        ...(city ? { city } : {}),
      },
      include: { dealer: { select: { id: true, name: true, city: true } } },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  // Resolves the single price that actually applies right now, in order of
  // specificity: dealer-specific → city-level → global override → the
  // variant's own base exShowroomPrice (always available as a last resort).
  async getCurrentPrice(variantId: string, dealerId?: string, city?: string) {
    const variant = await this.prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found.');

    let resolvedCity = city;
    if (dealerId && !resolvedCity) {
      const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
      resolvedCity = dealer?.city || undefined;
    }

    if (dealerId) {
      const dealerPrice = await this.prisma.variantPrice.findFirst({
        where: { variantId, dealerId },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (dealerPrice) return { ...dealerPrice, source: 'DEALER' as const };
    }

    if (resolvedCity) {
      const cityPrice = await this.prisma.variantPrice.findFirst({
        where: { variantId, dealerId: null, city: resolvedCity },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (cityPrice) return { ...cityPrice, source: 'CITY' as const };
    }

    const globalOverride = await this.prisma.variantPrice.findFirst({
      where: { variantId, dealerId: null, city: null },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (globalOverride) return { ...globalOverride, source: 'GLOBAL_OVERRIDE' as const };

    return {
      id: null,
      variantId,
      dealerId: null,
      city: null,
      exShowroomPrice: variant.exShowroomPrice,
      rtoCharges: null,
      insuranceCharges: null,
      effectiveFrom: null,
      source: 'BASE_CATALOGUE' as const,
    };
  }

  // Every distinct city that currently has a city-level price set, for any
  // variant — used to populate the city picker in the admin UI.
  async listCitiesWithPricing() {
    const rows = await this.prisma.variantPrice.findMany({
      where: { dealerId: null, city: { not: null } },
      select: { city: true },
      distinct: ['city'],
    });
    return rows.map((r) => r.city).filter(Boolean).sort();
  }
}
