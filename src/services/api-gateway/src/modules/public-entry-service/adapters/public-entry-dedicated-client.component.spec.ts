import { GatewayPublicEntryGrpcClient } from '../../../common/grpc/gateway-public-entry-grpc.client';
import { Test } from '@nestjs/testing';
import { GatewayMachineTrustedGrpcExecutionProducer, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc';
import { PublicEntryBusinessCardGrpcAdapter } from './public-entry-business-card-grpc.adapter';
import { PublicEntryShortLinkGrpcAdapter } from './public-entry-short-link-grpc.adapter';
/** Prevents Public Entry adapters from reconnecting to the legacy generic Gateway transport registry. */
describe('Public Entry dedicated mTLS client wiring', () => {
    const client = { getClient: jest.fn(() => ({ getService: jest.fn() })) } as unknown as GatewayPublicEntryGrpcClient;
    const human = {} as any;
    const machine = {} as any;
    it('injects the exact dedicated client into both adapter constructors', () => {
        expect(new PublicEntryShortLinkGrpcAdapter(client, human, machine)).toBeInstanceOf(PublicEntryShortLinkGrpcAdapter);
        expect(new PublicEntryBusinessCardGrpcAdapter(client, human, machine)).toBeInstanceOf(PublicEntryBusinessCardGrpcAdapter);
    });
    it('resolves both adapters through Nest DI with the dedicated client token', async () => {
        const module = await Test.createTestingModule({
            providers: [
                PublicEntryShortLinkGrpcAdapter,
                PublicEntryBusinessCardGrpcAdapter,
                GatewayPublicEntryGrpcClient,
                { provide: GatewayTrustedGrpcExecutionProducer, useValue: human },
                { provide: GatewayMachineTrustedGrpcExecutionProducer, useValue: machine }
            ]
        }).overrideProvider(GatewayPublicEntryGrpcClient).useValue(client).compile();
        expect(module.get(PublicEntryShortLinkGrpcAdapter)).toBeInstanceOf(PublicEntryShortLinkGrpcAdapter);
        expect(module.get(PublicEntryBusinessCardGrpcAdapter)).toBeInstanceOf(PublicEntryBusinessCardGrpcAdapter);
    });
});
