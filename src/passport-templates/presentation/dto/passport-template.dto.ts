import { PassportTemplate, Sector } from '../../domain/passport-template';
import { z } from 'zod';

export const PassportTemplateCreateSchema = z.object({
  version: z.string(),
  name: z.string(),
  description: z.string(),
  sectors: z.enum(Sector).array(),
  website: z.string().optional().default(null),
  contactEmail: z.string(),
  organizationName: z.string(),
  templateData: z.record(z.string(), z.unknown()),
});

export type PassportTemplateCreateDto = z.infer<
  typeof PassportTemplateCreateSchema
>;

export const PassportTemplateSchema = PassportTemplateCreateSchema.extend({
  id: z.string(),
  vcDid: z.string(),
  isOfficial: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type PassportTemplateDto = z.infer<typeof PassportTemplateSchema>;

export function passportTemplateToDto(
  passportTemplate: PassportTemplate,
): PassportTemplateDto {
  return PassportTemplateSchema.parse({
    id: passportTemplate.id,
    vcDid: passportTemplate.vcDid,
    version: passportTemplate.version,
    name: passportTemplate.name,
    isOfficial: passportTemplate.isOfficial,
    description: passportTemplate.description,
    sectors: passportTemplate.sectors,
    website: passportTemplate.website,
    contactEmail: passportTemplate.contactEmail,
    organizationName: passportTemplate.organizationName,
    templateData: passportTemplate.templateData,
    createdAt: passportTemplate.createdAt.toISOString(),
    updatedAt: passportTemplate.updatedAt.toISOString(),
  });
}
