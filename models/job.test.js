"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require('./job.js');
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("create", () => {
    // Define newJob here
    const newJob = {
        title: "Data Scientist",
        salary: 100000,
        equity: "0.5",
        companyHandle: "c1",
    };

    test("works", async () => {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            id: expect.any(Number),
            title: "Data Scientist",
            salary: 100000,
            equity: "0.5",
            companyHandle: "c1",
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE title = 'Data Scientist'`);

        expect(result.rows).toEqual([
            {
                id: expect.any(Number),
                title: "Data Scientist",
                salary: 100000,
                equity: "0.5",
                companyHandle: "c1",
            },
        ]);
    });
});

// test finding all jobs

describe("findAll", () => {
    test("works: returns all jobs", async () => {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "Botanist",
                salary: 100000,
                equity: "0.5",
                companyHandle: "c1"  // Correct companyHandle for Botanist
            },
            {
                id: expect.any(Number),
                title: "Software Engineer",
                salary: 120000,
                equity: "0.1",
                companyHandle: "c2"  // Correct companyHandle for Software Engineer
            }
        ]);
    });
});

// test get job by id
describe('get', () => {
    test('works: get job by id', async () => {
        let job = await Job.create({
            title: "Astronomer",
            salary: 110000,
            equity: "0.3",
            companyHandle: "c1"
        });

        let foundJob = await Job.get(job.id);
        expect(foundJob).toEqual({
            id: job.id,
            title: "Astronomer",
            salary: 110000,
            equity: "0.3",
            companyHandle: "c1"
        });
    })
    test('not found if no job with id', async () => {
        try {
            await Job.get(9999);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
})

// update

describe('update', () => {
    test('works: update job', async () => {
        let job = await Job.create({
            title: "Marine Biologist",
            salary: 90000,
            equity: "0.2",
            companyHandle: "c2"
        })
        let updatedJob = await Job.update(job.id,
            { title: "Senior Biologist", salary: 95000 });
        expect(updatedJob).toEqual({
            id: job.id,
            title: "Senior Biologist",
            salary: 95000,
            equity: "0.2",
            companyHandle: "c2"
        })
    })
    test("not found if no such job", async function () {
        try {
            await Job.update(999999, { title: "No Job" });
            fail(); // should not reach here
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
})

// remove
describe('remove', () => {
    test('works: delete job', async () => {
        let job = await Job.create({
            title: "Data Scientist",
            salary: 130000,
            equity: "0.05",
            companyHandle: "c1"
        })
        await Job.remove(job.id);
        const resp = await db.query(`SELECT id FROM jobs WHERE id = $1`, [job.id]);
        expect(resp.rows.length).toEqual(0)
    })
})