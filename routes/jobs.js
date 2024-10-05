"use strict";

const express = require('express');
const jsonschema = require('jsonschema');
const { BadRequestError } = require('../expressError');
const Job = require('../models/job');
const { ensureAdmin } = require('../middleware/auth');
const jobNewSchema = require('../schemas/jobNew.json');
const jobUpdateSchema = require('../schemas/jobUpdate.json');

const router = new express.Router();


/**
 * POST /jobs
 *
 * Authorization: admin
 *
 * returns: { id, title, salary, equity, companyHandle}
 */
router.post('/', ensureAdmin, async (req, resp, next) => {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errors = validator.errors.map(err => err.stack);
            throw new BadRequestError(errors);
        }
        const job = await Job.create(req.body);
        return resp.status(201).json({ job })
    } catch (err) {
        return next(err);
    }
})

/**
 * GET /jobs => { jobs: [{ id, title, salary, equity, companyHandle}]}
 *
 * Can filter on provided search filters:
 * - title - ILIKE case insensitive
 * - minSalary = filter to jobs with >= provided salary
 * - hasEquity = if true, filter to job that provide a > 0 equity. if false or not included
 *   in filter, list all jobs regardless of equity
 *
 * Authorization: anyone
 */
router.get('/', async (req, resp, next) => {
    try {
        // Extract query parameters
        const { title, minSalary, hasEquity } = req.query;

        // Pass filters to the model method
        const jobs = await Job.findAll({ title, minSalary, hasEquity });
        return resp.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /jobs/:id => { job }
 *
 * Anyone can get details of a specific job by id.
 */
router.get('/:id', async (req, resp, next) => {
    try {
        const job = await Job.get(req.params.id);
        return resp.json({ job });
    } catch (err) {
        return next(err);
    }
})

/** PATCH /jobs/:id { job } => { job }
 *
 * Admin only: Updates a job.
 *
 * Data can include: { title, salary, equity }
 *
 * Returns: { id, title, salary, equity, companyHandle }
 *
 * Authorization required: Admin
 */
router.patch('/:id', ensureAdmin, async (req, resp, next) => {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errors = validator.errors.map(err => err.stack);
            throw new BadRequestError(errors);
        }
        const job = await Job.update(req.params.id, req.body);
        return resp.json({ job });
    } catch (err) {
        return next(err);
    }
})

/** DELETE /jobs/:id => { deleted: id }
 *
 * Admin only: Deletes a job by id.
 *
 * Authorization required: Admin
 */
router.delete('/:id', ensureAdmin, async (req, resp, next) => {
    try {
        await Job.remove(req.params.id);
        return resp.json({ deleted: req.params.id });
    } catch (err) {
        return next(err);
    }
})


module.exports = router;