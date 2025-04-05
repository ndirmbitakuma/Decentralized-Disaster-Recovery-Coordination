import { describe, it, expect, beforeEach } from 'vitest';

// Mock the Clarity contract calls
const mockResources = new Map();
let lastResourceId = 0;

const STATUS_AVAILABLE = 1;
const STATUS_RESERVED = 2;
const STATUS_DEPLOYED = 3;

const RESOURCE_TYPE_WATER = 1;
const RESOURCE_TYPE_FOOD = 2;
const RESOURCE_TYPE_SHELTER = 3;
const RESOURCE_TYPE_MEDICAL = 4;
const RESOURCE_TYPE_EQUIPMENT = 5;

// Mock functions
function registerResource(resourceType, quantity, location, sender) {
  // Validate inputs
  if (resourceType < 1 || resourceType > 5) {
    return { error: 1 };
  }
  if (quantity <= 0) {
    return { error: 2 };
  }
  
  const newId = ++lastResourceId;
  
  mockResources.set(newId, {
    owner: sender,
    resourceType,
    quantity,
    location,
    status: STATUS_AVAILABLE,
    lastUpdated: 100 // Mock block height
  });
  
  return { value: newId };
}

function updateQuantity(resourceId, newQuantity, sender) {
  if (!mockResources.has(resourceId)) {
    return { error: 404 };
  }
  
  const resource = mockResources.get(resourceId);
  
  if (resource.owner !== sender) {
    return { error: 403 };
  }
  
  if (newQuantity <= 0) {
    return { error: 2 };
  }
  
  mockResources.set(resourceId, {
    ...resource,
    quantity: newQuantity,
    lastUpdated: 100 // Mock block height
  });
  
  return { value: true };
}

function updateStatus(resourceId, newStatus, sender) {
  if (!mockResources.has(resourceId)) {
    return { error: 404 };
  }
  
  const resource = mockResources.get(resourceId);
  
  if (resource.owner !== sender) {
    return { error: 403 };
  }
  
  if (newStatus < 1 || newStatus > 3) {
    return { error: 1 };
  }
  
  mockResources.set(resourceId, {
    ...resource,
    status: newStatus,
    lastUpdated: 100 // Mock block height
  });
  
  return { value: true };
}

function getResource(resourceId) {
  return mockResources.has(resourceId)
      ? { value: mockResources.get(resourceId) }
      : { value: null };
}

describe('Resource Registration Contract', () => {
  beforeEach(() => {
    mockResources.clear();
    lastResourceId = 0;
  });
  
  it('should register a new resource', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = registerResource(RESOURCE_TYPE_WATER, 100, 'New York', sender);
    
    expect(result.value).toBe(1);
    expect(mockResources.size).toBe(1);
    
    const resource = mockResources.get(1);
    expect(resource.owner).toBe(sender);
    expect(resource.resourceType).toBe(RESOURCE_TYPE_WATER);
    expect(resource.quantity).toBe(100);
    expect(resource.location).toBe('New York');
    expect(resource.status).toBe(STATUS_AVAILABLE);
  });
  
  it('should fail to register a resource with invalid type', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = registerResource(0, 100, 'New York', sender);
    
    expect(result.error).toBe(1);
    expect(mockResources.size).toBe(0);
  });
  
  it('should fail to register a resource with zero quantity', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = registerResource(RESOURCE_TYPE_WATER, 0, 'New York', sender);
    
    expect(result.error).toBe(2);
    expect(mockResources.size).toBe(0);
  });
  
  it('should update resource quantity', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    registerResource(RESOURCE_TYPE_WATER, 100, 'New York', sender);
    
    const result = updateQuantity(1, 200, sender);
    
    expect(result.value).toBe(true);
    expect(mockResources.get(1).quantity).toBe(200);
  });
  
  it('should fail to update quantity for non-existent resource', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = updateQuantity(999, 200, sender);
    
    expect(result.error).toBe(404);
  });
  
  it('should fail to update quantity if not the owner', () => {
    const owner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const otherUser = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    registerResource(RESOURCE_TYPE_WATER, 100, 'New York', owner);
    
    const result = updateQuantity(1, 200, otherUser);
    
    expect(result.error).toBe(403);
    expect(mockResources.get(1).quantity).toBe(100);
  });
  
  it('should update resource status', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    registerResource(RESOURCE_TYPE_WATER, 100, 'New York', sender);
    
    const result = updateStatus(1, STATUS_RESERVED, sender);
    
    expect(result.value).toBe(true);
    expect(mockResources.get(1).status).toBe(STATUS_RESERVED);
  });
  
  it('should get resource details', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    registerResource(RESOURCE_TYPE_WATER, 100, 'New York', sender);
    
    const result = getResource(1);
    
    expect(result.value).not.toBeNull();
    expect(result.value.owner).toBe(sender);
    expect(result.value.resourceType).toBe(RESOURCE_TYPE_WATER);
    expect(result.value.quantity).toBe(100);
  });
  
  it('should return null for non-existent resource', () => {
    const result = getResource(999);
    
    expect(result.value).toBeNull();
  });
});
