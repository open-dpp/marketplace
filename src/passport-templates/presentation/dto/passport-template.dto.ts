import { PassportTemplate, Sector } from '../../domain/passport-template';
import { z } from 'zod';

export const PassportTemplateCreateSchema = z.object({
  version: z.string(),
  name: z.string(),
  description: z.string(),
  sectors: z.enum(Sector).array(),
  website: z.string().nullable(),
  contactEmail: z.string(),
  organizationName: z.string(),
  ownedByOrganizationId: z.string(),
  templateData: z.record(z.string(), z.unknown()),
});

export type PassportTemplateCreate = z.infer<
  typeof PassportTemplateCreateSchema
>;

export const PassportTemplateSchema = PassportTemplateCreateSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PassportTemplateDto = z.infer<typeof PassportTemplateSchema>;

export function passportTemplateToDto(
  passportTemplate: PassportTemplate,
): PassportTemplateDto {
  return PassportTemplateSchema.parse({
    id: passportTemplate.id,
    version: passportTemplate.version,
    name: passportTemplate.name,
    description: passportTemplate.description,
    sectors: passportTemplate.sectors,
    website: passportTemplate.website,
    contactEmail: passportTemplate.contactEmail,
    organizationName: passportTemplate.organizationName,
    ownedByOrganizationId: passportTemplate.ownedByOrganizationId,
    templateData: passportTemplate.templateData,
    createdAt: passportTemplate.createdAt,
    updatedAt: passportTemplate.updatedAt,
  });
}
