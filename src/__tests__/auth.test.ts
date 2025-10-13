import request from 'supertest';
import app from '../index';

describe('Auth API', () => {
  it('should return ok on root', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
