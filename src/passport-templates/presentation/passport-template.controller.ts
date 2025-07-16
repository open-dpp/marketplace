import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { AuthRequest } from '../../auth/auth-request';
import { PassportTemplateService } from '../infrastructure/passport-template.service';
import {
  PassportTemplateCreateDto,
  PassportTemplateCreateSchema,
  passportTemplateToDto,
} from './dto/passport-template.dto';
import { PassportTemplate } from '../domain/passport-template';
import { Public } from '../../auth/public/public.decorator';
import { PermissionsService } from '../../permissions/permissions.service';

const templatesEndpoint = 'templates/passports';

@Controller()
export class PassportTemplateController {
  constructor(
    private passportTemplateService: PassportTemplateService,
    private permissionsService: PermissionsService,
  ) {}

  @Post('organizations/:organizationId/templates/passports')
  async createTemplate(
    @Param('organizationId') organizationId: string,
    @Request() req: AuthRequest,
    @Body() body: PassportTemplateCreateDto,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    const passportTemplateDto = PassportTemplateCreateSchema.parse(body);
    const passportTemplate = await this.passportTemplateService.save(
      PassportTemplate.create({
        ...passportTemplateDto,
        isOfficial: false,
        ownedByOrganizationId: organizationId,
        createdByUserId: req.authContext.keycloakUser.sub,
      }),
    );
    return passportTemplateToDto(passportTemplate);
  }

  @Public()
  @Get(`${templatesEndpoint}/:id`)
  async findTemplate(@Param('id') id: string) {
    return passportTemplateToDto(
      await this.passportTemplateService.findOneOrFail(id),
    );
  }

  @Public()
  @Get(templatesEndpoint)
  async getTemplates() {
    const passportTemplates = await this.passportTemplateService.findAll();
    return passportTemplates.map((pt) => passportTemplateToDto(pt));
  }
}
