import { Injectable } from '@nestjs/common';
import {
  ProductDataModel,
  VisibilityLevel,
} from '../domain/product.data.model';
import { NotFoundInDatabaseException } from '../../exceptions/service.exceptions';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductDataModelDoc,
  ProductDataModelDocSchemaVersion,
} from './product-data-model.schema';
import {
  DataFieldDoc,
  SectionDoc,
} from '../../data-modelling/infrastructure/product-data-model-base.schema';
import {
  DataField,
  findDataFieldClassByTypeOrFail,
} from '../domain/data-field';
import {
  Layout,
  ResponsiveConfigSchema,
} from '../../data-modelling/domain/layout';
import { DataSection, findSectionClassByTypeOrFail } from '../domain/section';
import { z } from 'zod/v4';
import { SectionType } from '../../data-modelling/domain/section-base';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { DataFieldType } from '../../data-modelling/domain/data-field-base';
import { omitBy } from 'lodash';

const LayoutSerializationSchema = z.object({
  colStart: ResponsiveConfigSchema,
  colSpan: ResponsiveConfigSchema,
  rowStart: ResponsiveConfigSchema,
  rowSpan: ResponsiveConfigSchema,
});

const SectionLayoutSerializationSchema = LayoutSerializationSchema.extend({
  cols: ResponsiveConfigSchema,
});

const ProductDataModelSerializationSchema = z.object({
  _id: z.string(),
  name: z.string(),
  version: z.string(),
  visibility: z.enum(VisibilityLevel),
  _schemaVersion: z.enum(ProductDataModelDocSchemaVersion),
  sections: z
    .object({
      _id: z.string(),
      name: z.string(),
      type: z.enum(SectionType),
      granularityLevel: z.enum(GranularityLevel).optional(),
      dataFields: z
        .object({
          _id: z.string(),
          name: z.string(),
          type: z.enum(DataFieldType),
          options: z.record(z.string(), z.unknown()).optional(),
          layout: LayoutSerializationSchema,
          granularityLevel: z.enum(GranularityLevel),
        })
        .array(),
      layout: SectionLayoutSerializationSchema,
      subSections: z.string().array(),
      parentId: z.string().optional(),
    })
    .array(),
  createdByUserId: z.string(),
  ownedByOrganizationId: z.string(),
});

export function serializeProductDataModel(productDataModel: ProductDataModel) {
  return ProductDataModelSerializationSchema.parse({
    _id: productDataModel.id,
    name: productDataModel.name,
    version: productDataModel.version,
    visibility: productDataModel.visibility,
    _schemaVersion: ProductDataModelDocSchemaVersion.v1_0_1,
    sections: productDataModel.sections.map((s) => ({
      _id: s.id,
      name: s.name,
      type: s.type,
      granularityLevel: s.granularityLevel,
      dataFields: s.dataFields.map((d) => ({
        _id: d.id,
        name: d.name,
        type: d.type,
        options: d.options,
        layout: {
          cols: d.layout.cols,
          colStart: d.layout.colStart,
          colSpan: d.layout.colSpan,
          rowStart: d.layout.rowStart,
          rowSpan: d.layout.rowSpan,
        },
        granularityLevel: d.granularityLevel,
      })),
      layout: {
        cols: s.layout.cols,
        colStart: s.layout.colStart,
        colSpan: s.layout.colSpan,
        rowStart: s.layout.rowStart,
        rowSpan: s.layout.rowSpan,
      },
      subSections: s.subSections,
      parentId: s.parentId,
    })),
    createdByUserId: productDataModel.createdByUserId,
    ownedByOrganizationId: productDataModel.ownedByOrganizationId,
  });
}

@Injectable()
export class ProductDataModelService {
  constructor(
    @InjectModel(ProductDataModelDoc.name)
    private productDataModelDoc: Model<ProductDataModelDoc>,
  ) {}

  createDataField(dataFieldDoc: DataFieldDoc): DataField {
    const sharedProps = {
      id: dataFieldDoc._id,
      layout: Layout.create({
        colStart: dataFieldDoc.layout.colStart,
        colSpan: dataFieldDoc.layout.colSpan,
        rowStart: dataFieldDoc.layout.rowStart,
        rowSpan: dataFieldDoc.layout.rowSpan,
      }),
      granularityLevel: dataFieldDoc.granularityLevel,
      options: dataFieldDoc.options,
      name: dataFieldDoc.name,
    };
    const DataFieldClass = findDataFieldClassByTypeOrFail(dataFieldDoc.type);
    return DataFieldClass.loadFromDb(sharedProps);
  }

  createSection(sectionDoc: SectionDoc): DataSection {
    const sharedProps = {
      id: sectionDoc._id,
      name: sectionDoc.name,
      parentId: sectionDoc.parentId,
      subSections: sectionDoc.subSections,
      dataFields: sectionDoc.dataFields.map((df) => this.createDataField(df)),
      layout: Layout.create({
        cols: sectionDoc.layout.cols,
        colStart: sectionDoc.layout.colStart,
        colSpan: sectionDoc.layout.colSpan,
        rowStart: sectionDoc.layout.rowStart,
        rowSpan: sectionDoc.layout.rowSpan,
      }),
      granularityLevel: sectionDoc.granularityLevel,
    };
    const SectionClass = findSectionClassByTypeOrFail(sectionDoc.type);
    return SectionClass.loadFromDb(sharedProps);
  }

  convertToDomain(productDataModelDoc: ProductDataModelDoc): ProductDataModel {
    const plain = productDataModelDoc.toObject();
    return ProductDataModel.loadFromDb({
      id: plain._id,
      name: plain.name,
      version: plain.version,
      createdByUserId: plain.createdByUserId,
      ownedByOrganizationId: plain.ownedByOrganizationId,
      visibility: plain.visibility,
      sections: plain.sections.map((s: SectionDoc) => this.createSection(s)),
    });
  }

  async save(productDataModel: ProductDataModel) {
    const serialized = serializeProductDataModel(productDataModel);
    const dataModelDoc = await this.productDataModelDoc.findOneAndUpdate(
      { _id: serialized._id },
      {
        ...omitBy(serialized, 'id'),
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if none found
        runValidators: true,
      },
    );

    return this.convertToDomain(dataModelDoc);
  }

  async findByName(name: string) {
    const foundDataModelDocs = await this.productDataModelDoc
      .find({ name: name }, '_id name version')
      .sort({ name: 1 })
      .exec();
    return foundDataModelDocs.map((dm) => ({
      id: dm._id,
      name: dm.name,
      version: dm.version,
    }));
  }

  async findAllAccessibleByOrganization(organizationId: string) {
    const foundDataModelDocs = await this.productDataModelDoc
      .find(
        {
          $or: [
            { ownedByOrganizationId: organizationId },
            { visibility: VisibilityLevel.PUBLIC },
          ],
        },
        '_id name version',
      )
      .sort({ name: 1 })
      .exec();
    return foundDataModelDocs.map((dm) => ({
      id: dm._id,
      name: dm.name,
      version: dm.version,
    }));
  }

  async findOneOrFail(id: string) {
    const productEntity = await this.productDataModelDoc.findById(id);
    if (!productEntity) {
      throw new NotFoundInDatabaseException(ProductDataModel.name);
    }
    return this.convertToDomain(productEntity);
  }
}
