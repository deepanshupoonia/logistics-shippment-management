const request = require('supertest');
const express = require('express');

const app = express();
app.get('/test', (req, res) => res.status(200).send('OK'));

describe('Basic GET route', () => {
    it('should return 200 OK', async () => {
        const res = await request(app).get('/test');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('OK');
    });
});