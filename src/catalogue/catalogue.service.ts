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

  // ---- One-off demo data: Tata Ace Gold (commercial pickup), full specs ----
  // Triggered via GET /catalogue/admin/seed-commercial?key=... — see controller.
  // Idempotent: safe to call more than once.
  async seedCommercialDemo() {
    const upsertCategory = (name: string, displayOrder: number) =>
      this.prisma.fieldCategory.upsert({ where: { name }, update: {}, create: { name, displayOrder } });

    const upsertField = (
      categoryId: string,
      f: { name: string; key: string; dataType: string; unit?: string; displayOrder: number }
    ) =>
      this.prisma.fieldDefinition.upsert({
        where: { key: f.key },
        update: {},
        create: { categoryId, name: f.name, key: f.key, dataType: f.dataType, unit: f.unit || null, displayOrder: f.displayOrder, customerVisible: true },
      });

    const setValue = (
      fieldId: string,
      variantId: string,
      v: { valueText?: string; valueNumber?: number; valueBoolean?: boolean; applicability?: string }
    ) =>
      this.prisma.fieldValue.upsert({
        where: { fieldId_variantId: { fieldId, variantId } },
        update: { ...v, applicability: v.applicability || 'STANDARD' },
        create: { fieldId, variantId, ...v, applicability: v.applicability || 'STANDARD' },
      });

    const brand = await this.prisma.brand.upsert({ where: { name: 'Tata Motors' }, update: {}, create: { name: 'Tata Motors' } });

    let model = await this.prisma.model.findFirst({ where: { brandId: brand.id, name: 'Ace Gold' } });
    if (!model) {
      model = await this.prisma.model.create({ data: { brandId: brand.id, name: 'Ace Gold', category: 'PICKUP' } });
    } else if (model.category !== 'PICKUP') {
      model = await this.prisma.model.update({ where: { id: model.id }, data: { category: 'PICKUP' } });
    }

    const upsertVariant = async (name: string, fuelType: string, transmission: string, exShowroomPrice: number) => {
      const existing = await this.prisma.variant.findFirst({ where: { modelId: model!.id, name } });
      if (existing) return existing;
      return this.prisma.variant.create({ data: { modelId: model!.id, name, fuelType, transmission, exShowroomPrice } });
    };

    const std = await upsertVariant('STD', 'Diesel', 'Manual', 519000);
    const cx = await upsertVariant('CX', 'Diesel', 'Manual', 559000);

    const catEngine = await upsertCategory('Engine & Transmission', 1);
    const catPayload = await upsertCategory('Payload & Load Body', 2);
    const catFuel = await upsertCategory('Fuel & Performance', 3);
    const catDimensions = await upsertCategory('Dimensions & Capacity', 4);
    const catSafety = await upsertCategory('Safety', 5);
    const catComfort = await upsertCategory('Comfort & Convenience', 6);

    const fEngineType = await upsertField(catEngine.id, { name: 'Engine Type', key: 'ca_engine_type', dataType: 'TEXT', displayOrder: 1 });
    const fDisplacement = await upsertField(catEngine.id, { name: 'Displacement', key: 'ca_displacement', dataType: 'VALUE_UNIT', unit: 'cc', displayOrder: 2 });
    const fCylinders = await upsertField(catEngine.id, { name: 'No. of Cylinders', key: 'ca_cylinders', dataType: 'INTEGER', displayOrder: 3 });
    const fMaxPower = await upsertField(catEngine.id, { name: 'Max Power', key: 'ca_max_power', dataType: 'TEXT', displayOrder: 4 });
    const fMaxTorque = await upsertField(catEngine.id, { name: 'Max Torque', key: 'ca_max_torque', dataType: 'TEXT', displayOrder: 5 });
    const fTransType = await upsertField(catEngine.id, { name: 'Transmission Type', key: 'ca_trans_type', dataType: 'TEXT', displayOrder: 6 });
    const fGearbox = await upsertField(catEngine.id, { name: 'Gearbox', key: 'ca_gearbox', dataType: 'TEXT', displayOrder: 7 });

    const fPayload = await upsertField(catPayload.id, { name: 'Payload Capacity', key: 'ca_payload', dataType: 'VALUE_UNIT', unit: 'kg', displayOrder: 1 });
    const fGVW = await upsertField(catPayload.id, { name: 'Gross Vehicle Weight (GVW)', key: 'ca_gvw', dataType: 'VALUE_UNIT', unit: 'kg', displayOrder: 2 });
    const fDeckLength = await upsertField(catPayload.id, { name: 'Deck Length', key: 'ca_deck_length', dataType: 'VALUE_UNIT', unit: 'mm', displayOrder: 3 });
    const fDeckWidth = await upsertField(catPayload.id, { name: 'Deck Width', key: 'ca_deck_width', dataType: 'VALUE_UNIT', unit: 'mm', displayOrder: 4 });
    const fLoadBody = await upsertField(catPayload.id, { name: 'Load Body Type', key: 'ca_load_body', dataType: 'TEXT', displayOrder: 5 });

    const fMileage = await upsertField(catFuel.id, { name: 'Mileage (Claimed)', key: 'ca_mileage', dataType: 'VALUE_UNIT', unit: 'kmpl', displayOrder: 1 });
    const fFuelTank = await upsertField(catFuel.id, { name: 'Fuel Tank Capacity', key: 'ca_fuel_tank', dataType: 'VALUE_UNIT', unit: 'Litres', displayOrder: 2 });
    const fEmissionNorm = await upsertField(catFuel.id, { name: 'Emission Norm', key: 'ca_emission', dataType: 'TEXT', displayOrder: 3 });

    const fWheelbase = await upsertField(catDimensions.id, { name: 'Wheelbase', key: 'ca_wheelbase', dataType: 'VALUE_UNIT', unit: 'mm', displayOrder: 1 });
    const fGroundClearance = await upsertField(catDimensions.id, { name: 'Ground Clearance', key: 'ca_ground_clearance', dataType: 'VALUE_UNIT', unit: 'mm', displayOrder: 2 });
    const fTyres = await upsertField(catDimensions.id, { name: 'Tyre Size', key: 'ca_tyres', dataType: 'TEXT', displayOrder: 3 });
    const fSeating = await upsertField(catDimensions.id, { name: 'Seating Capacity', key: 'ca_seating', dataType: 'INTEGER', displayOrder: 4 });

    const fBrakes = await upsertField(catSafety.id, { name: 'Braking System (F/R)', key: 'ca_brakes', dataType: 'TEXT', displayOrder: 1 });
    const fDualHorn = await upsertField(catSafety.id, { name: 'Dual Horn', key: 'ca_dual_horn', dataType: 'BOOLEAN', displayOrder: 2 });
    const fParkingSensor = await upsertField(catSafety.id, { name: 'Reverse Parking Sensor', key: 'ca_parking_sensor', dataType: 'BOOLEAN', displayOrder: 3 });

    const fPowerSteering = await upsertField(catComfort.id, { name: 'Power Steering', key: 'ca_power_steering', dataType: 'BOOLEAN', displayOrder: 1 });
    const fACCabin = await upsertField(catComfort.id, { name: 'AC Cabin', key: 'ca_ac_cabin', dataType: 'BOOLEAN', displayOrder: 2 });
    const fWarranty = await upsertField(catComfort.id, { name: 'Warranty', key: 'ca_warranty', dataType: 'TEXT', displayOrder: 3 });

    for (const v of [std, cx]) {
      await setValue(fEngineType.id, v.id, { valueText: 'DICOR, 2-cylinder, Direct Injection Diesel' });
      await setValue(fDisplacement.id, v.id, { valueNumber: 694 });
      await setValue(fCylinders.id, v.id, { valueNumber: 2 });
      await setValue(fMaxPower.id, v.id, { valueText: '22.7 PS @ 3200 rpm' });
      await setValue(fMaxTorque.id, v.id, { valueText: '55 Nm @ 1400-2200 rpm' });
      await setValue(fTransType.id, v.id, { valueText: 'Manual' });
      await setValue(fGearbox.id, v.id, { valueText: '4-Speed' });

      await setValue(fPayload.id, v.id, { valueNumber: 750 });
      await setValue(fGVW.id, v.id, { valueNumber: 1500 });
      await setValue(fDeckLength.id, v.id, { valueNumber: 2050 });
      await setValue(fDeckWidth.id, v.id, { valueNumber: 1510 });
      await setValue(fLoadBody.id, v.id, { valueText: 'Open Deck (Half Body)' });

      await setValue(fMileage.id, v.id, { valueNumber: 28 });
      await setValue(fFuelTank.id, v.id, { valueNumber: 15 });
      await setValue(fEmissionNorm.id, v.id, { valueText: 'BS6 Phase 2' });

      await setValue(fWheelbase.id, v.id, { valueNumber: 2150 });
      await setValue(fGroundClearance.id, v.id, { valueNumber: 179 });
      await setValue(fTyres.id, v.id, { valueText: '145 R12 LT' });
      await setValue(fSeating.id, v.id, { valueNumber: 2 });

      await setValue(fBrakes.id, v.id, { valueText: 'Drum / Drum' });
      await setValue(fDualHorn.id, v.id, { valueBoolean: true });
      await setValue(fPowerSteering.id, v.id, { valueBoolean: true });
      await setValue(fWarranty.id, v.id, { valueText: '2 Years / 72,000 km' });
    }

    await setValue(fParkingSensor.id, std.id, { valueBoolean: false, applicability: 'NOT_AVAILABLE' });
    await setValue(fACCabin.id, std.id, { valueBoolean: false, applicability: 'NOT_AVAILABLE' });
    await setValue(fParkingSensor.id, cx.id, { valueBoolean: true });
    await setValue(fACCabin.id, cx.id, { valueBoolean: true });

    const colours = JSON.stringify([
      { name: 'Arctic White', hex: '#F2F2F2' },
      { name: 'Cherry Red', hex: '#B4232E' },
      { name: 'Deep Blue', hex: '#1F3B73' },
    ]);

    for (const v of [std, cx]) {
      const existingVehicle = await this.prisma.vehicle.findFirst({ where: { variantId: v.id } });
      if (existingVehicle) {
        await this.prisma.vehicle.update({ where: { id: existingVehicle.id }, data: { colourOptionsJson: colours, imagesJson: '[]' } });
      } else {
        await this.prisma.vehicle.create({ data: { variantId: v.id, colourOptionsJson: colours, imagesJson: '[]', isActive: true } });
      }
    }

    return { message: 'Done. Tata Motors → Ace Gold (STD, CX) added under Commercial → Pickup with full specs.' };
  }
}
