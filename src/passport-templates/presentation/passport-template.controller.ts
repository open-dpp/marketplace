import { Body, Controller, Post, Request } from '@nestjs/common';
import { AuthRequest } from '../../auth/auth-request';
import { PassportTemplateService } from '../infrastructure/passport-template.service';
import {
  PassportTemplateCreateDto,
  PassportTemplateCreateSchema,
  passportTemplateToDto,
} from './dto/passport-template.dto';
import { PassportTemplate } from '../domain/passport-template';

@Controller('templates/passports')
export class PassportTemplateController {
  constructor(private passportTemplateService: PassportTemplateService) {}

  @Post()
  async getTemplates(
    @Request() req: AuthRequest,
    @Body() body: PassportTemplateCreateDto,
  ) {
    const passportTemplateDto = PassportTemplateCreateSchema.parse(body);
    const passportTemplate = await this.passportTemplateService.save(
      PassportTemplate.create({
        ...passportTemplateDto,
        isOfficial: false,
        vcDid: req.authContext.verifiableCredential.sub,
      }),
    );
    return passportTemplateToDto(passportTemplate);
  }
}
