/**
 * =========================================================
 * USER ENTITY
 * =========================================================
 *
 * This file defines the canonical User entity for the
 * platform.
 *
 * Even though the earliest MVP did not require login,
 * the User entity is part of the long-term schema because:
 *
 * - resumes belong to users
 * - job descriptions belong to users
 * - applications belong to users
 * - billing and saved history depend on users
 *
 * This is the root ownership entity for platform data.
 *
 * =========================================================
 */

import { UserPlan } from '../enums';
import { UUID, ISODateTime } from '../primitives';


/**
 * ---------------------------------------------------------
 * USER
 * ---------------------------------------------------------
 *
 * Canonical domain model for a platform user.
 */
export interface User {
  id: UUID;
  email: string;
  fullName?: string | null;
  plan: UserPlan;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}