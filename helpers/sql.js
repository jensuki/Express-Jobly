const { BadRequestError } = require("../expressError");

/**
 * Creates part of an SQL UPDATE query to update data in the database.
 *
 * This function helps you update only the fields you need in the database
 * by building the correct SQL query for you.
 *
 * It takes two things:
 * 1. `dataToUpdate`: An object with the data you want to update.
 *    Example: { firstName: 'Aliya', age: 32 }
 * 2. `jsToSql`: (optional) An object that maps JavaScript keys to database column names.
 *    Example: { firstName: 'first_name' }
 *
 * It returns:
 * - `setCols`: The part of the SQL query that sets the columns.
 *   Example: '"first_name"=$1, "age"=$2'
 * - `values`: An array of the actual values to update in the database.
 *   Example: ['Aliya', 32]
 *
 * Example usage:
 * If you want to update the first name and age of a user:
 *
 *   sqlForPartialUpdate({ firstName: 'Aliya', age: 32 }, { firstName: 'first_name' });
 *
 * This returns:
 *   {
 *     setCols: '"first_name"=$1, "age"=$2',
 *     values: ['Aliya', 32]
 *   }
 *
 * If no data is provided, the function will throw an error.
 */


function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
