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

@Controller('templates/passports')
export class PassportTemplateController {
  constructor(private passportTemplateService: PassportTemplateService) {}

  @Post()
  async createTemplate(
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

  @Public()
  @Get(':id')
  async findTemplate(@Param('id') id: string) {
    return passportTemplateToDto(
      await this.passportTemplateService.findOneOrFail(id),
    );
  }

  @Public()
  @Get()
  async getTemplates(@Param('id') id: string) {
    const passportTemplates = await this.passportTemplateService.findAll();
    return passportTemplates.map((pt) => passportTemplateToDto(pt));
  }
}
