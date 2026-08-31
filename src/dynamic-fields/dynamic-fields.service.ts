import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FieldOptionInput } from './dynamic-fields.dto';

@Injectable()
export class DynamicFieldsService {
  constructor(private prisma: PrismaService) {}

  // ---- Categories ----

  createCategory(data: { name: string; displayOrder?: number }) {
    return this.prisma.fieldCategory.create({ data });
  }

  listCategories() {
    return this.prisma.fieldCategory.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' },
      include: { fields: { where: { status: 'ACTIVE' }, orderBy: { displayOrder: 'asc' }, include: { options: true } } },
    });
  }

  async updateCategory(id: string, data: { name?: string; displayOrder?: number; status?: string }) {
    const cat = await this.prisma.fieldCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found.');
    return this.prisma.fieldCategory.update({ where: { id }, data });
  }

  // ---- Field definitions ----

  async createField(data: {
    categoryId: string;
    name: string;
    key: string;
    alias?: string;
    dataType: string;
    unit?: string;
    customerVisible?: boolean;
    filterEnabled?: boolean;
    comparisonEnabled?: boolean;
    required?: boolean;
    displayOrder?: number;
    options?: FieldOptionInput[];
  }) {
    const category = await this.prisma.fieldCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new NotFoundException('Category not found.');

    const existing = await this.prisma.fieldDefinition.findUnique({ where: { key: data.key } });
    if (existing) {
      if (existing.status === 'ARCHIVED') {
        throw new BadRequestException(`Key "${data.key}" belongs to an archived field ("${existing.name}"). Restore or permanently delete it first, or pick a different key.`);
      }
      throw new BadRequestException(`A field with key "${data.key}" already exists.`);
    }

    if ((data.dataType === 'SELECT' || data.dataType === 'MULTI_SELECT') && (!data.options || data.options.length === 0)) {
      throw new BadRequestException('SELECT and MULTI_SELECT fields need at least one option.');
    }

    return this.prisma.fieldDefinition.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        key: data.key,
        alias: data.alias,
        dataType: data.dataType,
        unit: data.unit,
        customerVisible: data.customerVisible ?? true,
        filterEnabled: data.filterEnabled ?? false,
        comparisonEnabled: data.comparisonEnabled ?? false,
        required: data.required ?? false,
        displayOrder: data.displayOrder ?? 0,
        options: data.options
          ? { create: data.options.map((o, i) => ({ label: o.label, value: o.value, displayOrder: i })) }
          : undefined,
      },
      include: { options: true, category: true },
    });
  }

  listFields(categoryId?: string) {
    return this.prisma.fieldDefinition.findMany({
      where: { status: 'ACTIVE', ...(categoryId ? { categoryId } : {}) },
      orderBy: { displayOrder: 'asc' },
      include: { options: true, category: true },
    });
  }

  // Public — the website's listing page uses this to build its filter
  // sidebar from whatever fields the admin has flagged as filterable,
  // instead of a hardcoded set of columns.
  listFilterableFields() {
    return this.prisma.fieldDefinition.findMany({
      where: { status: 'ACTIVE', filterEnabled: true },
      orderBy: { displayOrder: 'asc' },
      include: { options: true, category: true },
    });
  }

  listArchivedFields() {
    return this.prisma.fieldDefinition.findMany({
      where: { status: 'ARCHIVED' },
      orderBy: { updatedAt: 'desc' },
      include: { options: true, category: true },
    });
  }

  async updateField(id: string, data: {
    name?: string; alias?: string; unit?: string; customerVisible?: boolean;
    filterEnabled?: boolean; comparisonEnabled?: boolean; required?: boolean;
    displayOrder?: number; status?: string;
  }) {
    const field = await this.prisma.fieldDefinition.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Field not found.');
    return this.prisma.fieldDefinition.update({ where: { id }, data, include: { options: true } });
  }

  async archiveField(id: string) {
    const field = await this.prisma.fieldDefinition.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Field not found.');
    return this.prisma.fieldDefinition.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }

  async restoreField(id: string) {
    const field = await this.prisma.fieldDefinition.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Field not found.');
    return this.prisma.fieldDefinition.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async deleteField(id: string) {
    const field = await this.prisma.fieldDefinition.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Field not found.');
    // Permanently removes the field, its options, and any values entered
    // against variants — this cannot be undone (unlike archive).
    await this.prisma.fieldValue.deleteMany({ where: { fieldId: id } });
    await this.prisma.fieldOption.deleteMany({ where: { fieldId: id } });
    return this.prisma.fieldDefinition.delete({ where: { id } });
  }

  // ---- Field values (per variant) ----

  async setValue(data: {
    fieldId: string;
    variantId: string;
    valueText?: string;
    valueNumber?: number;
    valueBoolean?: boolean;
    applicability?: string;
  }) {
    const field = await this.prisma.fieldDefinition.findUnique({ where: { id: data.fieldId } });
    if (!field) throw new NotFoundException('Field not found.');
    const variant = await this.prisma.variant.findUnique({ where: { id: data.variantId } });
    if (!variant) throw new NotFoundException('Variant not found.');

    return this.prisma.fieldValue.upsert({
      where: { fieldId_variantId: { fieldId: data.fieldId, variantId: data.variantId } },
      create: {
        fieldId: data.fieldId,
        variantId: data.variantId,
        valueText: data.valueText,
        valueNumber: data.valueNumber,
        valueBoolean: data.valueBoolean,
        applicability: data.applicability || 'STANDARD',
      },
      update: {
        valueText: data.valueText,
        valueNumber: data.valueNumber,
        valueBoolean: data.valueBoolean,
        applicability: data.applicability || 'STANDARD',
      },
    });
  }

  listValuesForVariant(variantId: string) {
    return this.prisma.fieldValue.findMany({
      where: { variantId },
      include: { field: { include: { category: true, options: true } } },
    });
  }
}
