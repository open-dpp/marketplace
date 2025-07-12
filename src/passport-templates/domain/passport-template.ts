import { randomUUID } from 'crypto';

export enum Sector {
  BATTERY = 'battery',
  TEXTILE = 'textile',
}

type JsonObject = Record<string, unknown>;

type PassportTemplateCreationProps = {
  version: string;
  name: string;
  description: string;
  isOfficial: boolean;
  sectors: Sector[];
  website: string | null;
  contactEmail: string;
  organizationName: string;
  ownedByOrganizationId: string;
  templateData: JsonObject;
};
export type PassportTemplateProps = PassportTemplateCreationProps & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export class PassportTemplate {
  private constructor(
    public readonly id: string,
    public readonly version: string,
    public readonly name: string,
    public readonly description: string,
    public readonly isOfficial: boolean,
    public readonly sectors: Sector[],
    public readonly website: string | null,
    public readonly contactEmail: string,
    public readonly organizationName: string,
    public readonly ownedByOrganizationId: string,
    public readonly templateData: JsonObject,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static create(data: PassportTemplateCreationProps): PassportTemplate {
    return new PassportTemplate(
      randomUUID(),
      data.version,
      data.name,
      data.description,
      data.isOfficial,
      data.sectors,
      data.website,
      data.contactEmail,
      data.organizationName,
      data.ownedByOrganizationId,
      data.templateData,
      new Date(Date.now()),
    );
  }

  static loadFromDb(data: PassportTemplateProps): PassportTemplate {
    return new PassportTemplate(
      data.id,
      data.version,
      data.name,
      data.description,
      data.isOfficial,
      data.sectors,
      data.website,
      data.contactEmail,
      data.organizationName,
      data.ownedByOrganizationId,
      data.templateData,
      data.createdAt,
      data.updatedAt,
    );
  }
}
