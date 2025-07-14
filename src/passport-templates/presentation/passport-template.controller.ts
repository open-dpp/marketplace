import { Controller, Get, Param, Request } from '@nestjs/common';
import { AuthRequest } from '../../auth/auth-request';
import { PermissionsService } from '../../permissions/permissions.service';

@Controller('organizations/:orgaId/templates/passports')
export class PassportTemplateController {
  constructor(private permissionsService: PermissionsService) {}

  @Get()
  async getTemplates(
    @Param('orgaId') organizationId: string,
    @Request() req: AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    return { hello: 'world' };
  }
}
