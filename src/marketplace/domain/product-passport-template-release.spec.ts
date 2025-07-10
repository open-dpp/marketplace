import { ProductPassportTemplateRelease } from './product-passport-template-release';
import { ProductDataModel } from '../../product-data-model/domain/product.data.model';
import { Prop } from '@nestjs/mongoose';
import { SectionDoc } from '../../data-modelling/infrastructure/product-data-model-base.schema';

describe('ProductPassportTemplateRelease', () => {
  it('is created', () => {
    const productPassportTemplate = {
      id: 'test',
      name: 'name',
      version: '1.0.0',
      sections: SectionDoc[],
      createdByUserId: string,
      ownedByOrganizationId: string;
    const productPassportTemplateRelease =
      ProductPassportTemplateRelease.create({
        name: 'test',
        description: 'test description',
        version: '1.0.0',
        productPassportTemplate: ,
      });
  });
});
