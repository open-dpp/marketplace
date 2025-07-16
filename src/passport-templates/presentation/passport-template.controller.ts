import { Controller, Get, Request } from '@nestjs/common';
import { AuthRequest } from '../../auth/auth-request';

@Controller('templates/passports')
export class PassportTemplateController {
  constructor() {}

  @Get()
  async getTemplates(@Request() req: AuthRequest) {
    return { hello: req.authContext.verifiableCredential.sub };
  }
}
