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

  // ---- Hero section (homepage) ----
  { key: 'hero_tagline', label: 'Hero — Tagline', group: 'hero', value: 'Your Financial Partner' },
  { key: 'hero_subheading', label: 'Hero — Subheading', group: 'hero', value: 'Vehicle & Loan Solutions' },
  {
    key: 'hero_description',
    label: 'Hero — Description',
    group: 'hero',
    value: 'Buy new cars, commercial vehicles, trucks, tempos, and tractors — take a loan, get insurance. All at one place.',
  },
  { key: 'hero_trust_1', label: 'Hero — Trust Badge 1', group: 'hero', value: 'Fast Approval' },
  { key: 'hero_trust_2', label: 'Hero — Trust Badge 2', group: 'hero', value: 'Minimum Documents' },
  { key: 'hero_trust_3', label: 'Hero — Trust Badge 3', group: 'hero', value: 'No Hidden Charges' },
  { key: 'hero_rate_badge', label: 'Hero — "Best Rate" Badge', group: 'hero', value: '7.5% p.a.' },
  { key: 'hero_rating_badge', label: 'Hero — Customer Rating Badge', group: 'hero', value: '4.8 / 5' },
  {
    key: 'hero_slides',
    label: 'Hero — Slides',
    group: 'hero',
    value: [{ type: 'icon', url: '', animation: 'fade', showText: true, fit: 'cover' }],
  },

  // ---- Stats (homepage hero strip) ----
  { key: 'stat_approval_rate', label: 'Stat — Loan Approval Rate', group: 'stats', value: '98%' },
  { key: 'stat_approval_time', label: 'Stat — Approval Time', group: 'stats', value: '24-48hr' },

  // ---- Contact info (used across homepage + vehicle detail pages) ----
  { key: 'contact_phone', label: 'Phone Number', group: 'contact', value: '98247 42356' },
  { key: 'contact_email', label: 'Email Address', group: 'contact', value: 'mkfinance.guj@gmail.com' },
  { key: 'contact_city', label: 'City / Area (short)', group: 'contact', value: 'Valsad, Gujarat' },
  {
    key: 'contact_service_area',
    label: 'Service Area (footer)',
    group: 'contact',
    value: 'Based in Dharampur, Valsad — serving South Gujarat including Vapi, Surat, Navsari, Bharuch and Silvassa.',
  },

  // ---- Services section (homepage, 6 cards) ----
  { key: 'service_1', label: 'Service 1', group: 'services', value: { icon: '🚗', title: 'New Car Sales', desc: 'Maruti, Hyundai, Tata, Mahindra and more — best price guarantee.' } },
  { key: 'service_2', label: 'Service 2', group: 'services', value: { icon: '🚛', title: 'Commercial Vehicles', desc: 'Trucks, Tempos, Pickup, Tractors — full range of business vehicles.' } },
  { key: 'service_3', label: 'Service 3', group: 'services', value: { icon: '💰', title: 'Vehicle Loan', desc: 'Fast approval, minimum documents. Starting at 7.5% p.a.' } },
  { key: 'service_4', label: 'Service 4', group: 'services', value: { icon: '🔄', title: 'Refinance & Top-Up', desc: 'Switch to a better rate or get a fresh loan on your vehicle.' } },
  { key: 'service_5', label: 'Service 5', group: 'services', value: { icon: '🛡️', title: 'Vehicle Insurance', desc: 'Compare plans from every insurer for the best premium.' } },
  { key: 'service_6', label: 'Service 6', group: 'services', value: { icon: '📋', title: 'Document Assistance', desc: 'RC Transfer, NOC, Insurance renewal — full paperwork support.' } },

  // ---- Footer ----
  {
    key: 'footer_tagline',
    label: 'Footer — Tagline',
    group: 'footer',
    value: 'Your trusted financial partner for all vehicle needs — buying, financing, and insuring, all under one roof.',
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
