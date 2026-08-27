import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Defaults matching what's currently hardcoded on the website — seeding
// these means the site keeps working exactly as-is until an admin edits
// something, and every edit takes effect immediately (no redeploy).
const DEFAULT_SETTINGS: { key: string; label: string; group: string; value: any }[] = [
  {
    key: 'loan_new_car',
    label: 'New Car Loan',
    group: 'loans',
    value: { icon: '🚗', name: 'New Car Loan', desc: 'Up to 90% financing on brand new vehicles.', rate: '7.5%' },
  },
  {
    key: 'loan_commercial',
    label: 'Commercial Vehicle Loan',
    group: 'loans',
    value: { icon: '🚛', name: 'Commercial Vehicle Loan', desc: 'Business loans on trucks, tempos, and tractors.', rate: '8.5%' },
  },
  {
    key: 'loan_refinance',
    label: 'Refinance Loan',
    group: 'loans',
    value: { icon: '🔄', name: 'Refinance Loan', desc: 'Switch to a better rate and close your old loan.', rate: '9%' },
  },
  {
    key: 'loan_topup',
    label: 'Top-Up Loan',
    group: 'loans',
    value: { icon: '📈', name: 'Top-Up Loan', desc: 'Additional loan on your existing vehicle loan.', rate: '10%' },
  },
];

@Injectable()
export class SiteSettingsService {
  constructor(private prisma: PrismaService) {}

  // Public — flat { key: value } map, one call, used by the website.
  async getAll() {
    const rows = await this.prisma.siteSetting.findMany();
    const map: Record<string, any> = {};
    for (const r of rows) {
      try {
        map[r.key] = JSON.parse(r.valueJson);
      } catch {
        map[r.key] = r.valueJson;
      }
    }
    return map;
  }

  // Admin editor — full rows with label/group, grouped for the UI.
  async getAllRaw() {
    const rows = await this.prisma.siteSetting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
    return rows.map((r) => ({ ...r, value: (() => { try { return JSON.parse(r.valueJson); } catch { return r.valueJson; } })() }));
  }

  async upsert(key: string, data: { label: string; group: string; value: any }) {
    return this.prisma.siteSetting.upsert({
      where: { key },
      update: { label: data.label, group: data.group, valueJson: JSON.stringify(data.value) },
      create: { key, label: data.label, group: data.group, valueJson: JSON.stringify(data.value) },
    });
  }

  // One-off — open the seed URL once in a browser (see controller). Only
  // creates rows that don't already exist, so it never overwrites an edit.
  async seedDefaults() {
    let created = 0;
    for (const d of DEFAULT_SETTINGS) {
      const existing = await this.prisma.siteSetting.findUnique({ where: { key: d.key } });
      if (!existing) {
        await this.prisma.siteSetting.create({ data: { key: d.key, label: d.label, group: d.group, valueJson: JSON.stringify(d.value) } });
        created++;
      }
    }
    return { message: `Done. ${created} default setting(s) created (skipped any that already existed).` };
  }
}
