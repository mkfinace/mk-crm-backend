import { Global, Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

// @Global() so every other module (Leads, Negotiations, Quotations,
// Documents, FinanceCases, FinanceApplications, TestDrives, Bookings,
// Deliveries, Messages) can inject RealtimeGateway straight into its
// service's constructor without each of those modules having to import
// RealtimeModule individually.
@Global()
@Module({
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
