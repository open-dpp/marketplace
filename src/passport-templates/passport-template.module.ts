import { Module } from '@nestjs/common';
import { PassportTemplateController } from './presentation/passport-template.controller';

@Module({
  imports: [],
  controllers: [PassportTemplateController],
  providers: [],
  exports: [],
})
export class PassportTemplateModule {}
