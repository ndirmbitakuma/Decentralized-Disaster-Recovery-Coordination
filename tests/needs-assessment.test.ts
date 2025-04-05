import { describe, it, expect, beforeEach } from 'vitest';

// Mock the Clarity contract calls
const mockNeeds = new Map();
let lastNeedId = 0;

const STATUS_OPEN = 1;
const STATUS_IN_PROGRESS = 2;
const STATUS_FULFILLED = 3;
const STATUS_CANCELLED = 4;

const PRIORITY_LOW = 1;
const PRIORITY_MEDIUM = 2;
const PRIORITY_HIGH = 3;
const PRIORITY_CRITICAL = 4;

const RESOURCE_TYPE_WATER = 1;
const RESOURCE_TYPE_FOOD = 2;
const RESOURCE_TYPE_SHELTER = 3;
const RESOURCE_TYPE_MEDICAL = 4;
const RESOURCE_TYPE_EQUIPMENT = 5;

// Mock functions
function registerNeed(resourceType, quantity, location, priority, description, sender) {
  // Validate inputs
  if (resourceType < 1 || resourceType > 5) {
    return { error: 1 };
  }
  if (quantity <= 0) {
    return { error: 2 };
  }
  if (priority < 1 || priority > 4) {
    return { error: 3 };
  }
  
  const newId = ++lastNeedId;
  
  mockNeeds.set(newId, {
    requester: sender,
    resourceType,
    quantity,
    location,
    priority,
    status: STATUS_OPEN,
    description,
    createdAt: 100, // Mock block height
    lastUpdated: 100 // Mock block height
  });
  
  return { value: newId };
}

function updateNeedStatus(needId, newStatus, sender) {
  if (!mockNeeds.has(needId)) {
    return { error: 404 };
  }
  
  const need = mockNeeds.get(needId);
  
  if (need.requester !== sender) {
    return { error: 403 };
  }
  
  if (newStatus < 1 || newStatus > 4) {
    return { error: 1 };
  }
  
  mockNeeds.set(needId, {
    ...need,
    status: newStatus,
    lastUpdated: 100 // Mock block height
  });
  
  return { value: true };
}

function updateNeedPriority(needId, newPriority, sender) {
  if (!mockNeeds.has(needId)) {
    return { error: 404 };
  }
  
  const need = mockNeeds.get(needId);
  
  if (need.requester !== sender) {
    return { error: 403 };
  }
  
  if (newPriority < 1 || newPriority > 4) {
    return { error: 1 };
  }
  
  mockNeeds.set(needId, {
    ...need,
    priority: newPriority,
    lastUpdated: 100 // Mock block height
  });
  
  return { value: true };
}

function getNeed(needId) {
  return mockNeeds.has(needId)
      ? { value: mockNeeds.get(needId) }
      : { value: null };
}

describe('Needs Assessment Contract', () => {
  beforeEach(() => {
    mockNeeds.clear();
    lastNeedId = 0;
  });
  
  it('should register a new need', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = registerNeed(
        RESOURCE_TYPE_WATER,
        500,
        'Miami',
        PRIORITY_HIGH,
        'Urgent need for clean water after hurricane',
        sender
    );
    
    expect(result.value).toBe(1);
    expect(mockNeeds.size).toBe(1);
    
    const need = mockNeeds.get(1);
    expect(need.requester).toBe(sender);
    expect(need.resourceType).toBe(RESOURCE_TYPE_WATER);
    expect(need.quantity).toBe(500);
    expect(need.location).toBe('Miami');
    expect(need.priority).toBe(PRIORITY_HIGH);
    expect(need.status).toBe(STATUS_OPEN);
    expect(need.description).toBe('Urgent need for clean water after hurricane');
  });
  
  it('should fail to register a need with invalid resource type', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = registerNeed(
        0,
        500,
        'Miami',
        PRIORITY_HIGH,
        'Urgent need for clean water after hurricane',
        sender
    );
    
    expect(result.error).toBe(1);
    expect(mockNeeds.size).toBe(0);
  });
  
  it('should fail to register a need with zero quantity', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = registerNeed(
        RESOURCE_TYPE_WATER,
        0,
        'Miami',
        PRIORITY_HIGH,
        'Urgent need for clean water after hurricane',
        sender
    );
    
    expect(result.error).toBe(2);
    expect(mockNeeds.size).toBe(0);
  });
  
  it('should fail to register a need with invalid priority', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = registerNeed(
        RESOURCE_TYPE_WATER,
        500,
        'Miami',
        0,
        'Urgent need for clean water after hurricane',
        sender
    );
    
    expect(result.error).toBe(3);
    expect(mockNeeds.size).toBe(0);
  });
  
  it('should update need status', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    registerNeed(
        RESOURCE_TYPE_WATER,
        500,
        'Miami',
        PRIORITY_HIGH,
        'Urgent need for clean water after hurricane',
        sender
    );
    
    const result = updateNeedStatus(1, STATUS_IN_PROGRESS, sender);
    
    expect(result.value).toBe(true);
    expect(mockNeeds.get(1).status).toBe(STATUS_IN_PROGRESS);
  });
  
  it('should fail to update status for non-existent need', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = updateNeedStatus(999, STATUS_IN_PROGRESS, sender);
    
    expect(result.error).toBe(404);
  });
  
  it('should fail to update status if not the requester', () => {
    const requester = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const otherUser = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    registerNeed(
        RESOURCE_TYPE_WATER,
        500,
        'Miami',
        PRIORITY_HIGH,
        'Urgent need for clean water after hurricane',
        requester
    );
    
    const result = updateNeedStatus(1, STATUS_IN_PROGRESS, otherUser);
    
    expect(result.error).toBe(403);
    expect(mockNeeds.get(1).status).toBe(STATUS_OPEN);
  });
  
  it('should update need priority', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    registerNeed(
        RESOURCE_TYPE_WATER,
        500,
        'Miami',
        PRIORITY_HIGH,
        'Urgent need for clean water after hurricane',
        sender
    );
    
    const result = updateNeedPriority(1, PRIORITY_CRITICAL, sender);
    
    expect(result.value).toBe(true);
    expect(mockNeeds.get(1).priority).toBe(PRIORITY_CRITICAL);
  });
  
  it('should get need details', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    registerNeed(
        RESOURCE_TYPE_WATER,
        500,
        'Miami',
        PRIORITY_HIGH,
        'Urgent need for clean water after hurricane',
        sender
    );
    
    const result = getNeed(1);
    
    expect(result.value).not.toBeNull();
    expect(result.value.requester).toBe(sender);
    expect(result.value.resourceType).toBe(RESOURCE_TYPE_WATER);
    expect(result.value.quantity).toBe(500);
    expect(result.value.priority).toBe(PRIORITY_HIGH);
  });
  
  it('should return null for non-existent need', () => {
    const result = getNeed(999);
    
    expect(result.value).toBeNull();
  });
});
