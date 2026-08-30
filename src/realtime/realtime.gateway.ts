import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Powers real-time sync for the Lead Detail page: when two people (e.g.
// Dealer Executive and Finance Executive) have the same lead open at once,
// any change either of them saves is pushed to the other within a second —
// no manual refresh needed. Clients join a room named `lead:<id>` for
// whichever lead they currently have open, and every mutating leads-related
// service call broadcasts to that room after it writes to the DB.
//
// Deliberately dumb on purpose: the event carries only the leadId, never a
// payload. The frontend just refetches GET /leads/:id on receipt — this
// avoids ever pushing a stale/partial shape over the wire and keeps every
// producer-side call to a single one-line `notifyLeadUpdated(leadId)`.
@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  @SubscribeMessage('joinLead')
  handleJoinLead(@ConnectedSocket() client: Socket, @MessageBody() leadId: string) {
    if (!leadId) return;
    client.join(`lead:${leadId}`);
  }

  @SubscribeMessage('leaveLead')
  handleLeaveLead(@ConnectedSocket() client: Socket, @MessageBody() leadId: string) {
    if (!leadId) return;
    client.leave(`lead:${leadId}`);
  }

  // Called by leads/negotiations/quotations/documents/financecases/
  // financeapplications/testdrives/bookings/deliveries/messages services
  // after any write that changes what the Lead Detail page shows.
  notifyLeadUpdated(leadId: string) {
    if (!leadId || !this.server) return;
    try {
      this.server.to(`lead:${leadId}`).emit('lead:updated', { leadId });
    } catch (e) {
      // Never let a broadcast failure break the actual business operation.
      this.logger.error('Failed to broadcast lead:updated', e as Error);
    }
  }
}
