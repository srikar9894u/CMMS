import { test, expect } from '@playwright/test';

/**
 * CMMS Assets API Tests
 * Tests the backend API endpoints for assets
 */

test.describe('Assets API', () => {
  const apiUrl = process.env.API_URL || 'http://localhost:3000';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const response = await request.post(`${apiUrl}/api/auth/login`, {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    authToken = body.token;
  });

  test('GET /api/assets - should return list of assets', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/assets`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const assets = await response.json();

    expect(Array.isArray(assets)).toBeTruthy();
    if (assets.length > 0) {
      expect(assets[0]).toHaveProperty('id');
      expect(assets[0]).toHaveProperty('name');
      expect(assets[0]).toHaveProperty('asset_tag');
    }
  });

  test('GET /api/assets/:id - should return single asset', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/assets/1`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok()) {
      const asset = await response.json();
      expect(asset).toHaveProperty('id', 1);
      expect(asset).toHaveProperty('name');
    }
  });

  test('GET /api/assets/stats - should return asset statistics', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/assets/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const stats = await response.json();

    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('running');
    expect(stats).toHaveProperty('stopped');
    expect(stats).toHaveProperty('trip');
  });

  test('POST /api/assets - should create new asset', async ({ request }) => {
    const newAsset = {
      name: 'Test Motor',
      asset_tag: 'TEST-001',
      location: 'Test Location',
      category: 'Motor',
      manufacturer: 'Test Manufacturer',
      model: 'Test Model',
      installation_date: '2025-01-01',
      status: 'active'
    };

    const response = await request.post(`${apiUrl}/api/assets`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: newAsset
    });

    if (response.ok()) {
      const created = await response.json();
      expect(created).toHaveProperty('id');
      expect(created.name).toBe(newAsset.name);
      expect(created.asset_tag).toBe(newAsset.asset_tag);
    }
  });

  test('PUT /api/assets/:id - should update asset', async ({ request }) => {
    const updateData = {
      name: 'Updated Test Motor',
      location: 'Updated Location'
    };

    const response = await request.put(`${apiUrl}/api/assets/1`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: updateData
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.message).toBe('Asset updated successfully');
  });

  test('GET /api/assets - should handle unauthorized request', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/assets`);

    expect(response.status()).toBe(401);
  });
});
