"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const { createToken } = require("../helpers/tokens");

let jobId1, jobId2; // Global variables to store job IDs

async function commonBeforeAll() {
  await db.query("DELETE FROM jobs");
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM users");
  await db.query("DELETE fROM applications");

  // Insert companies
  await Company.create({
    handle: "c1",
    name: "C1",
    numEmployees: 1,
    description: "Desc1",
    logoUrl: "http://c1.img",
  });
  await Company.create({
    handle: "c2",
    name: "C2",
    numEmployees: 2,
    description: "Desc2",
    logoUrl: "http://c2.img",
  });
  await Company.create({
    handle: "c3",
    name: "C3",
    numEmployees: 3,
    description: "Desc3",
    logoUrl: "http://c3.img",
  });

  // Insert users
  await User.register({
    username: "admin",
    firstName: "AdminF",
    lastName: "AdminL",
    email: "admin@admin.com",
    password: "password-admin",
    isAdmin: true,
  });
  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });

  // Insert jobs and store their IDs for testing
  const jobRes1 = await db.query(`
    INSERT INTO jobs (title, salary, equity, company_handle)
    VALUES ('Botanist', 100000, '0.5', 'c1')
    RETURNING id`);

  jobId1 = jobRes1.rows[0].id;

  const jobRes2 = await db.query(`
    INSERT INTO jobs (title, salary, equity, company_handle)
    VALUES ('Software Engineer', 120000, '0.1', 'c2')
    RETURNING id`);
  jobId2 = jobRes2.rows[0].id;

  console.log("jobId1:", jobId1);
  console.log("jobId2:", jobId2);

  // Insert job applications
  await db.query(`
    INSERT INTO applications (username, job_id)
    VALUES ('u1', $1), ('u2', $2)`,
    [jobId1, jobId2]);
}

async function commonBeforeEach() {
  await db.query("BEGIN");
  await db.query("DELETE FROM applications");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

// Create tokens for testing
const u1Token = createToken({ username: "u1", isAdmin: false });
const adminToken = createToken({ username: "admin", isAdmin: true });

// Getter functions to return jobId1 and jobId2 after they are initialized
function getJobId1() {
  return jobId1;
}

function getJobId2() {
  return jobId2;
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  getJobId1: () => jobId1,
  getJobId2: () => jobId2

};
