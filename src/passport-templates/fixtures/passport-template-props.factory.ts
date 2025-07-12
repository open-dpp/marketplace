import { randomUUID } from 'crypto';
import { PassportTemplateProps, Sector } from '../domain/passport-template';
import { Factory } from 'fishery';

export const nowDate = new Date('2025-01-01T12:00:00Z');

export const passportTemplatePropsFactory =
  Factory.define<PassportTemplateProps>(() => ({
    id: randomUUID(),
    name: 'test',
    description: 'test description',
    version: '1.0.0',
    isOfficial: true,
    sectors: [Sector.BATTERY],
    website: 'https://open-dpp.de',
    contactEmail: 'test@example.com',
    organizationName: 'open-dpp',
    ownedByOrganizationId: 'organizationId',
    templateData: {
      id: randomUUID(),
      name: 'my name',
      version: '1.0.0',
      createdByUserId: randomUUID(),
      ownedByOrganizationId: 'organizationId',
      sections: [],
    },
    createdAt: nowDate,
    updatedAt: nowDate,
  }));
