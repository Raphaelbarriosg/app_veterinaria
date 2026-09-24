import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send clinic invitation in dry-run mode when SMTP is not configured', async () => {
    const success = await service.sendClinicInvitation('test@example.com', 'Clínica Demo', 'token-123');
    expect(success).toBe(true);
  });
});
