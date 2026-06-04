const request = require('supertest');
const { app, server } = require('../server');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(60000);

let mongoServer;
let adminToken;
let userToken;
let contactId;
let sosAlertId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
}, 60000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    server.close();
});

describe('APADS Full System API Endpoints', () => {
    // 1. AUTHENTICATION TESTS
    describe('Auth Endpoints', () => {
        it('should register a new admin user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Admin User',
                    email: 'admin@apads.com',
                    password: 'password123',
                    role: 'admin'
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body.token).toBeDefined();
            expect(res.body.role).toEqual('admin');
            adminToken = res.body.token;
        });

        it('should register a regular user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Regular User',
                    email: 'user@apads.com',
                    password: 'password123',
                    role: 'responder'
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body.token).toBeDefined();
            expect(res.body.role).toEqual('responder');
            userToken = res.body.token;
        });

        it('should login the admin user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@apads.com',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body.token).toBeDefined();
        });

        it('should reject login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@apads.com',
                    password: 'wrongpassword'
                });
            expect(res.statusCode).toEqual(401);
        });
    });

    // 2. EMERGENCY CONTACTS TESTS (Requires Auth)
    describe('Emergency Contacts Endpoints', () => {
        it('should reject adding contact without token', async () => {
            const res = await request(app)
                .post('/api/contacts')
                .send({
                    name: 'John Doe',
                    role: 'Paramedic',
                    phone: '1234567890',
                    email: 'john@paramedic.com'
                });
            expect(res.statusCode).toEqual(401);
        });

        it('should reject adding contact for non-admin user', async () => {
            const res = await request(app)
                .post('/api/contacts')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'John Doe',
                    role: 'Paramedic',
                    phone: '1234567890',
                    email: 'john@paramedic.com'
                });
            expect(res.statusCode).toEqual(403);
        });

        it('should allow admin to add an emergency contact', async () => {
            const res = await request(app)
                .post('/api/contacts')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Emergency Contact 1',
                    role: 'Police Chief',
                    phone: '7478435239',
                    email: 'arkojana45@gmail.com'
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBeTruthy();
            expect(res.body.data.name).toEqual('Emergency Contact 1');
            contactId = res.body.data._id;
        });

        it('should fetch contacts with auth token', async () => {
            const res = await request(app)
                .get('/api/contacts')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBeTruthy();
            expect(Array.isArray(res.body.data)).toBeTruthy();
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });

        it('should delete a contact as admin', async () => {
            const res = await request(app)
                .delete(`/api/contacts/${contactId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBeTruthy();
        });
    });

    // 3. VOICE SOS TESTS
    describe('Voice SOS Endpoints', () => {
        it('should create a Voice SOS alert', async () => {
            const payload = {
                domain: 'Medical',
                transcript: 'help me i am having a heart attack',
                confidence: 0.9,
                coordinates: { lat: 22.5726, lng: 88.3639 },
                location: 'Kolkata, India',
                deviceId: 'TEST-DEVICE-ID-1'
            };

            const res = await request(app)
                .post('/api/sos')
                .send(payload);

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBeTruthy();
            expect(res.body.data.domain).toEqual('Medical');
            expect(res.body.data.severity).toEqual('Critical'); // derived from confidence 0.9
            sosAlertId = res.body.data._id;
        });

        it('should reject duplicate Voice SOS alert from same device within cooldown', async () => {
            const payload = {
                domain: 'Medical',
                transcript: 'help me i am having a heart attack',
                confidence: 0.9,
                coordinates: { lat: 22.5726, lng: 88.3639 },
                location: 'Kolkata, India',
                deviceId: 'TEST-DEVICE-ID-1'
            };

            const res = await request(app)
                .post('/api/sos')
                .send(payload);

            expect(res.statusCode).toEqual(429); // Too Many Requests / Cooldown active
            expect(res.body.success).toBeFalsy();
        });

        it('should accept SOS from a different device', async () => {
            const payload = {
                domain: 'Fire',
                transcript: 'there is a fire here',
                confidence: 0.6,
                coordinates: { lat: 22.5726, lng: 88.3639 },
                location: 'Kolkata, India',
                deviceId: 'TEST-DEVICE-ID-2'
            };

            const res = await request(app)
                .post('/api/sos')
                .send(payload);

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.severity).toEqual('High'); // derived from confidence 0.6
        });

        it('should fetch all SOS alerts', async () => {
            const res = await request(app).get('/api/sos');
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBeTruthy();
            expect(Array.isArray(res.body.data)).toBeTruthy();
            expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        });

        it('should cancel SOS alert within grace window', async () => {
            const res = await request(app)
                .post(`/api/sos/${sosAlertId}/cancel`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBeTruthy();
            expect(res.body.data.cancelled).toBeTruthy();
        });
    });
});
