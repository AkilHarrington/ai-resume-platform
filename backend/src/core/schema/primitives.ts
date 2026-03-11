/**
 * =========================================================
 * PRIMITIVE TYPE DEFINITIONS
 * =========================================================
 *
 * These represent shared primitive aliases used across
 * the schema layer.
 *
 * Using aliases improves readability and helps ensure
 * consistency across the codebase.
 *
 * =========================================================
 */


/**
 * Universally Unique Identifier
 *
 * All core entities use UUID-style identifiers.
 */
export type UUID = string;


/**
 * ISO 8601 Date-Time String
 *
 * All timestamps should be stored in UTC.
 */
export type ISODateTime = string;


/**
 * Standardized scoring value
 *
 * Expected integer range: 0–100
 *
 * Used for:
 * - ATS score
 * - keyword score
 * - match score
 * - bullet strength score
 */
export type Score100 = number;