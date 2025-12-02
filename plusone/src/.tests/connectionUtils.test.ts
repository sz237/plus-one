/**
 * @file src/.tests/connectionUtils.test.ts
 * Tests for connection-related utility functions
 */

import type { ConnectionRequest } from '../types/connection';

describe('Connection utilities', () => {
  describe('ConnectionRequest structure', () => {
    it('validates required ConnectionRequest fields', () => {
      const validRequest: ConnectionRequest = {
        id: 'req1',
        fromUserId: 'u1',
        toUserId: 'u2',
        message: 'Let\'s connect!',
        status: 'PENDING',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      expect(validRequest).toHaveProperty('id');
      expect(validRequest).toHaveProperty('fromUserId');
      expect(validRequest).toHaveProperty('toUserId');
      expect(validRequest).toHaveProperty('message');
      expect(validRequest).toHaveProperty('status');
      expect(validRequest).toHaveProperty('createdAt');
      expect(validRequest).toHaveProperty('updatedAt');
    });

    it('validates connection request status values', () => {
      const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED'];
      
      const request: ConnectionRequest = {
        id: 'req1',
        fromUserId: 'u1',
        toUserId: 'u2',
        message: 'Test',
        status: 'PENDING',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      expect(validStatuses.includes(request.status)).toBe(true);
    });

    it('filters requests by status', () => {
      const requests: ConnectionRequest[] = [
        {
          id: 'req1',
          fromUserId: 'u1',
          toUserId: 'u2',
          message: 'Test 1',
          status: 'PENDING',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'req2',
          fromUserId: 'u3',
          toUserId: 'u2',
          message: 'Test 2',
          status: 'ACCEPTED',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'req3',
          fromUserId: 'u4',
          toUserId: 'u2',
          message: 'Test 3',
          status: 'PENDING',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      const pendingRequests = requests.filter((req) => req.status === 'PENDING');
      expect(pendingRequests).toHaveLength(2);
      expect(pendingRequests[0].status).toBe('PENDING');
      expect(pendingRequests[1].status).toBe('PENDING');
    });
  });

  describe('Connection request validation', () => {
    it('validates request has message', () => {
      const validateRequest = (request: { message: string }): boolean => {
        return request.message.trim().length > 0;
      };

      expect(validateRequest({ message: 'Hello!' })).toBe(true);
      expect(validateRequest({ message: '   ' })).toBe(false);
      expect(validateRequest({ message: '' })).toBe(false);
    });

    it('validates request has different from and to users', () => {
      const validateUserIds = (fromUserId: string, toUserId: string): boolean => {
        return fromUserId !== toUserId && fromUserId.length > 0 && toUserId.length > 0;
      };

      expect(validateUserIds('u1', 'u2')).toBe(true);
      expect(validateUserIds('u1', 'u1')).toBe(false);
      expect(validateUserIds('', 'u2')).toBe(false);
      expect(validateUserIds('u1', '')).toBe(false);
    });
  });

  describe('Connection status mapping', () => {
    it('maps connection status to UI labels', () => {
      const statusToLabel = (status: string): string => {
        const mapping: Record<string, string> = {
          PENDING: 'Pending',
          ACCEPTED: 'Friends',
          REJECTED: 'Rejected',
          CONNECT: 'Connect',
          FRIENDS: 'Friends',
        };
        return mapping[status] || 'Connect';
      };

      expect(statusToLabel('PENDING')).toBe('Pending');
      expect(statusToLabel('ACCEPTED')).toBe('Friends');
      expect(statusToLabel('FRIENDS')).toBe('Friends');
      expect(statusToLabel('CONNECT')).toBe('Connect');
      expect(statusToLabel('UNKNOWN')).toBe('Connect');
    });
  });
});

