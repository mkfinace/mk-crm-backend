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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CatalogueModule,
    LeadsModule,
    DealersModule,
    BanksModule,
    QuotationsModule,
    TestDrivesModule,
    DocumentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
