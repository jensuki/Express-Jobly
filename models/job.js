'use strict';

const db = require('../db');
const { sqlForPartialUpdate } = require('../helpers/sql')
const { NotFoundError, BadRequestError } = require('../expressError');
/**
 *
 * GET /jobs: Fetch a list of all jobs (open to anyone).
POST /jobs: Admin-only route to create a new job.
GET /jobs/:id: Get details of a single job by ID.
PATCH /jobs/:id: Admin-only route to update a job.
DELETE /jobs/:id: Admin-only route to delete a job.

 */

class Job {
    /**
     * create job (from data), update db, return new job data
     *
     * Data: { title, salary, equity, companyHandle}
     * Returns: { id, title, salary, equity, companyHandle}
     */

    static async create({ title, salary, equity, companyHandle }) {
        const result = await db.query(`
            INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [title, salary, equity, companyHandle]);

        return result.rows[0] // return newly created job
    }

    /**
     * Find all jobs with optional filtering
     *
     *   * Filters:
     *  - title: case-insensitive, matches-any-part-of-string search
     *  - minSalary: filter jobs that have at least this salary
     *  - hasEquity: true means only return jobs with non-zero equity
     *
     *
     * Returns: [{ id, title, salary, equity, companyHandle}]
     */
    static async findAll(optionalFilters = {}) {
        const { title, minSalary, hasEquity } = optionalFilters;

        // base query
        let query = `
        SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs`;

        let whereConditions = [];
        let queryValues = [];

        // if filtering by 'title'
        if (title) {
            queryValues.push(`%${title}%`); // queryValues[0] = %name%
            whereConditions.push(`title ILIKE $${queryValues.length}`);
        }
        //if filtering by 'minSalary'
        if (minSalary !== undefined) {
            queryValues.push(minSalary); // queryValues[1] = minSalary
            whereConditions.push(`salary >= $${queryValues.length}`);
        }
        // if filtering by 'hasEquity'
        if (hasEquity === true) {
            whereConditions.push(`equity > 0`)
        }

        if (whereConditions.length > 0) {
            query += " WHERE " + whereConditions.join(" AND ");
        }

        // finalize and run the query
        query += " ORDER BY title";
        const jobsResults = await db.query(query, queryValues);
        return jobsResults.rows;
    }
    /**
     * Get job by id
     *
     * Returns { id, title, salary, equity, companyHandle }
     * if not found -> throws NotFoundError
     */
    static async get(id) {
        const result = await db.query(`
            SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
            [id]);

        const job = result.rows[0];
        if (!job) throw new NotFoundError(`No job with id: ${id}`)
        return job;
    }

    /**
     * Update job with 'data'
     * Partial update. Expects { title, salary, equity}
     *
     * Cannot change companyHandle or id
     *=
     * Returns: { id, title, salary, equity, companyHandle}
     *
     */
    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {
            title: "title",
            salary: "salary",
            equity: "equity"
        })
        const idVarIdx = "$" + (values.length + 1) // id comes last in query

        const query = `UPDATE jobs
                       SET ${setCols}
                       WHERE id = ${idVarIdx}
                       RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;

        const result = await db.query(query, [...values, id]);

        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id: ${id}`)
        return job;
    }

    /**
     * Delete a job by id
     */
    static async remove(id) {
        const result = await db.query(`
            DELETE FROM jobs
            WHERE id = $1
            RETURNING id`, [id])

        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id: ${id}`)
        return job;
    }
}

module.exports = Job;