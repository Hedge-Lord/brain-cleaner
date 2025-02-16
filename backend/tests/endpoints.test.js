require('dotenv').config();
const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');

// Adjust the path to your app accordingly
const app = require('../src/app');

const API_PATH = '/api/v1'

// Use Mocha for structuring tests

describe('Auth Endpoints', function() {
  // Increase timeout for slower environments if necessary
  this.timeout(5000);
  const uniqueEmail = `testuser_${Date.now()}@example.com`;
  const password = 'password';
  let token = '';

  it('should register a new user', function(done) {
    request(app)
      .post(`${API_PATH}/auth/register`)
      .send({ email: uniqueEmail, password })
      .end((err, res) => {
        if (err) return done(err);
        // Accepting either 200 or 201 as successful registration
        console.log(res)
        if (![200, 201].includes(res.status)) {
          return done(new Error(`Expected status 200 or 201, got ${res.status}`));
        }
        if (!res.body || !res.body.message) {
          return done(new Error('Response does not have a message property'));
        }
        done();
      });
  });

  it('should login user and return a JWT token', function(done) {
    request(app)
      .post(`${API_PATH}/auth/login`)
      .send({ email: uniqueEmail, password })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        token = res.body.token;
        if (!token) {
          return done(new Error('No token returned'));
        }
        done();
      });
  });

  it('should verify the JWT token', function() {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('No JWT_SECRET in environment');
    }
    const decoded = jwt.verify(token, jwtSecret);
    expect(decoded).to.have.property('email', uniqueEmail);
  });
});