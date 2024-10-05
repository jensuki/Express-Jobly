"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies with optional filtering by name, minEmployees, maxEmployees
   *
   * - If `name` is provided, filter by company name (case-insensitive).
   * - If `minEmployees` is provided, filter to companies that have at least that number of employees.
   * - If `maxEmployees` is provided, filter to companies that have no more than that number of employees.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(optionalFilters = {}) {
    const { name, minEmployees, maxEmployees } = optionalFilters;

    // base query
    let query = `
    SELECT handle,
           name,
           description,
           num_employees AS "numEmployees",
           logo_url AS "logoUrl"
    FROM companies`;

    let whereConditions = [];
    let queryValues = [];

    // if 'name' filter provided, use ILIKE for case-insensitive partial match
    if (name) {
      queryValues.push(`%${name}%`); // queryValues[0] = %name%
      whereConditions.push(`name ILIKE $${queryValues.length}`); // $1
    }

    // if 'minEmployees' filter provided, ensure num employees >= provided value
    if (minEmployees !== undefined) {
      queryValues.push(minEmployees); // queryValues[1] = minEmployees
      whereConditions.push(`num_employees >= $${queryValues.length}`); // $2
    }

    // if 'maxEmployeees filter provided, ensure # of employees <= provided value
    if (maxEmployees !== undefined) {
      queryValues.push(maxEmployees); // queryValues[2] = maxEmployees
      whereConditions.push(`num_employees <= $${queryValues.length}`); // $3
    }

    // throw error if minEmployees > maxEmployees
    if (minEmployees > maxEmployees) {
      throw new BadRequestError(`minEmployees cannot be greater than maxEmployees`)
    }
    // append WHERE clause to the query if filters were applied
    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ");
    }
    query += " ORDER BY name";

    // execute final SQLquery with dynamic queryValues
    const companiesRes = await db.query(query, queryValues);
    // return resulting rows, which are filtered or all companies if no filters were applied
    return companiesRes.rows;

  }


  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    // also fetch associated jobs
    const jobsResult = await db.query(`
      SELECT id, title, salary, equity
      FROM jobs
      WHERE company_handle = $1`, [handle]);

    company.jobs = jobsResult.rows;
    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies
                      SET ${setCols}
                      WHERE handle = ${handleVarIdx}
                      RETURNING handle,
                                name,
                                description,
                                num_employees AS "numEmployees",
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
