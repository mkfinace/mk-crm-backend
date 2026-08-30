import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CatalogueModule } from './catalogue/catalogue.module';
import { LeadsModule } from './leads/leads.module';
import { DealersModule } from './dealers/dealers.module';
import { BanksModule } from './banks/banks.module';
import { QuotationsModule } from './quotations/quotations.module';
import { TestDrivesModule } from './testdrives/testdrives.module';
import { DocumentsModule } from './documents/documents.module';
import { FinanceCasesModule } from './financecases/financecases.module';
import { BookingsModule } from './bookings/bookings.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { AuditLogsModule } from './auditlogs/auditlogs.module';
import { DynamicFieldsModule } from './dynamic-fields/dynamic-fields.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { ReportsModule } from './reports/reports.module';
import { NegotiationsModule } from './negotiations/negotiations.module';
import { FinanceApplicationsModule } from './financeapplications/financeapplications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { PermissionsModule } from './permissions/permissions.module';
import { FeaturesModule } from './features/features.module';
import { ColoursModule } from './colours/colours.module';
import { PricingModule } from './pricing/pricing.module';
import { OffersModule } from './offers/offers.module';
import { WarrantyModule } from './warranty/warranty.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RealtimeModule,
    PermissionsModule,
    AuthModule,
    UsersModule,
    CatalogueModule,
    LeadsModule,
    DealersModule,
    BanksModule,
    QuotationsModule,
    TestDrivesModule,
    DocumentsModule,
    FinanceCasesModule,
    BookingsModule,
    DeliveriesModule,
    NotificationsModule,
    MessagesModule,
    AuditLogsModule,
    DynamicFieldsModule,
    VehiclesModule,
    FeaturesModule,
    ColoursModule,
    PricingModule,
    OffersModule,
    WarrantyModule,
    SiteSettingsModule,
    ReportsModule,
    NegotiationsModule,
    FinanceApplicationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
