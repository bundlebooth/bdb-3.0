/**
 * Backend Helper Utilities
 * Common utility functions for the API
 */

/**
 * Serialize a single record's Date objects to ISO strings for proper JSON serialization
 * SQL Server mssql driver returns Date objects which can serialize as empty {} in JSON
 * @param {Object} record - A database record object
 * @returns {Object} Record with Date fields converted to ISO strings
 */
const serializeDates = (record) => {
  if (!record || typeof record !== 'object') return record;
  const result = { ...record };
  for (const key in result) {
    if (result[key] instanceof Date) {
      result[key] = result[key].toISOString();
    }
  }
  return result;
};

/**
 * Serialize an array of records, converting all Date objects to ISO strings
 * @param {Array} records - Array of database record objects
 * @returns {Array} Records with Date fields converted to ISO strings
 */
const serializeRecords = (records) => {
  if (!Array.isArray(records)) return records;
  return records.map(serializeDates);
};

module.exports = {
  serializeDates,
  serializeRecords
};
