/**
 * Domain types planned for Vazon. They mirror the Prisma enums in
 * backend/prisma/schema.prisma. No screen uses them yet; they are here so that
 * frontend and backend share one vocabulary from day one.
 */

export type LightCondition = 'LOW' | 'MEDIUM' | 'BRIGHT_INDIRECT' | 'DIRECT'

export type PotSize = 'SMALL' | 'MEDIUM' | 'LARGE'

export type RadiatorDistance = 'NEAR' | 'MEDIUM' | 'FAR' | 'NONE'

export type CareTaskType = 'WATER' | 'FEED' | 'REPOT'

export type CareTaskStatus = 'PENDING' | 'DONE' | 'SKIPPED'

export type CareActionType = 'DONE' | 'SOIL_WET' | 'WATERED' | 'FED' | 'REPOTTED'
