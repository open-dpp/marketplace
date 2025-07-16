import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ChallengeSchemaVersion {
  v1_0_0 = '1.0.0',
}

@Schema({ collection: 'challenges' })
export class ChallengeDoc extends Document {
  @Prop({
    default: ChallengeSchemaVersion.v1_0_0,
    enum: ChallengeSchemaVersion,
  }) // Track schema version
  _schemaVersion: ChallengeSchemaVersion;

  @Prop({ required: true })
  _id: string;
  @Prop({ required: true })
  challenge: string;
}
export const ChallengeSchema = SchemaFactory.createForClass(ChallengeDoc);
