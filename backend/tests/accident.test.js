const request = require('supertest');
const { app, server } = require('../server');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
    // Setup in-memory MongoDB for testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Disconnect any existing connections
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    // Close the http server instance
    server.close();
});

describe('Accident API Endpoints', () => {
    it('should create a new accident record', async () => {
        const payload = {
            camId: "CAM-TEST",
            severity: "High",
            location: "Test Location",
            time: "10:00 AM",
            coordinates: { lat: 10, lng: 20 },
            licensePlate: "TEST-123",
            mediaUrl: "http://test.com/image.jpg"
        };

        const res = await request(app)
            .post('/api/accidents')
            .send(payload);

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBeTruthy();
        expect(res.body.data.camId).toEqual("CAM-TEST");
        expect(res.body.data.mediaUrl).toEqual("http://test.com/image.jpg");
    });

    it('should fetch all accident records', async () => {
        const res = await request(app).get('/api/accidents');
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBeTruthy();
        expect(Array.isArray(res.body.data)).toBeTruthy();
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
});
