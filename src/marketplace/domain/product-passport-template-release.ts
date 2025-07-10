export enum Sector {
  BATTERY = 'battery',
  TEXTILE = 'textile',
}

type JsonObject = Record<string, any>;

export class ProductPassportTemplateRelease {
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
    public readonly productPassportTemplate: JsonObject,
  ) {}
}
