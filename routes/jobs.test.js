"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const Job = require("../models/job");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    adminToken, // assumes you have an admin user and token
    u1Token, // non-admin user token

} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// GET /jobs
describe("GET /jobs", function () {
    test("works: no filters", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.statusCode).toEqual(200);
        expect(resp.body.jobs).toEqual([
            {
                id: expect.any(Number),
                title: "Botanist",
                salary: 100000,
                equity: "0.5",
                companyHandle: "c1"
            },
            {
                id: expect.any(Number),
                title: "Software Engineer",
                salary: 120000,
                equity: "0.1",
                companyHandle: "c2"
            }
        ]);
    });

    test("works: filter by title", async function () {
        const resp = await request(app).get("/jobs").query({ title: "Software" });
        expect(resp.statusCode).toEqual(200);
        expect(resp.body.jobs).toEqual([
            {
                id: expect.any(Number),
                title: "Software Engineer",
                salary: 120000,
                equity: "0.1",
                companyHandle: "c2",
            },
        ]);
    });


    test("works: filter by minSalary", async function () {
        const resp = await request(app).get("/jobs").query({ minSalary: 110000 });
        expect(resp.statusCode).toEqual(200);
        expect(resp.body.jobs).toEqual([
            {
                id: expect.any(Number),
                title: "Software Engineer",
                salary: 120000,
                equity: "0.1",
                companyHandle: "c2"
            }
        ]);
    });

    test("works: filter by hasEquity", async function () {
        const resp = await request(app).get("/jobs").query({ hasEquity: true });
        expect(resp.statusCode).toEqual(200);
        expect(resp.body.jobs).toEqual([
            {
                id: expect.any(Number),
                title: "Botanist",
                salary: 100000,
                equity: "0.5",
                companyHandle: "c1"
            },
            {
                id: expect.any(Number),
                title: "Software Engineer",
                salary: 120000,
                equity: "0.1",  // accept any positive equity, including small values
                companyHandle: "c2",
            }
        ]);
    });

    test("works: multiple filters", async function () {
        const resp = await request(app).get("/jobs").query({ title: "Botanist", minSalary: 90000 });
        expect(resp.statusCode).toEqual(200);
        expect(resp.body.jobs).toEqual([
            {
                id: expect.any(Number),
                title: "Botanist",
                salary: 100000,
                equity: "0.5",
                companyHandle: "c1"
            }
        ]);
    });

    test("fails: no jobs found", async function () {
        const resp = await request(app).get("/jobs").query({ title: "NonExistent" });
        expect(resp.statusCode).toEqual(200);
        expect(resp.body.jobs).toEqual([]);
    });
});

// POST /jobs
describe("POST /jobs", function () {
    const newJob = {
        title: "Astronomer",
        salary: 95000,
        equity: "0.2",
        companyHandle: "c1"
    };

    test("works for admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body.job).toEqual({
            id: expect.any(Number),
            title: "Astronomer",
            salary: 95000,
            equity: "0.2",
            companyHandle: "c1"
        });
    });

    test("fails for non-admin users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "Astronomer"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

// PATCH /jobs/:id
describe("PATCH /jobs/:id", function () {
    test("works for admins", async function () {
        const newJob = await Job.create({
            title: "Marine Biologist",
            salary: 90000,
            equity: "0.2",
            companyHandle: "c1"
        });
        const resp = await request(app)
            .patch(`/jobs/${newJob.id}`)
            .send({ title: "Senior Biologist" })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body.job).toEqual({
            id: newJob.id,
            title: "Senior Biologist",
            salary: 90000,
            equity: "0.2",
            companyHandle: "c1"
        });
    });

    test("fails for non-admin users", async function () {
        const newJob = await Job.create({
            title: "Marine Biologist",
            salary: 90000,
            equity: "0.2",
            companyHandle: "c1"
        });
        const resp = await request(app)
            .patch(`/jobs/${newJob.id}`)
            .send({ title: "Senior Biologist" })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });
});

// DELETE /jobs/:id
describe("DELETE /jobs/:id", function () {
    test("works for admins", async function () {
        const newJob = await Job.create({
            title: "Marine Biologist",
            salary: 90000,
            equity: "0.2",
            companyHandle: "c1"
        });
        const resp = await request(app)
            .delete(`/jobs/${newJob.id}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(200);
        const result = await db.query(`SELECT id FROM jobs WHERE id = $1`, [newJob.id]);
        expect(result.rows.length).toEqual(0);
    });

    test("fails for non-admin users", async function () {
        const newJob = await Job.create({
            title: "Marine Biologist",
            salary: 90000,
            equity: "0.2",
            companyHandle: "c1"
        });
        const resp = await request(app)
            .delete(`/jobs/${newJob.id}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });
});
