import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { PassportTemplateController } from './presentation/passport-template.controller';

@Module({
  imports: [PermissionsModule],
  controllers: [PassportTemplateController],
  providers: [],
  exports: [],
})
export class PassportTemplateModule {}
