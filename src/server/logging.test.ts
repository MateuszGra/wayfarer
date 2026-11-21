import { describe, expect, it } from 'vitest';
import { requestForLog } from './logging';

describe('requestForLog', () => {
  it('keeps the method and the path but not the client address', () => {
    const request = {
      method: 'GET',
      url: '/api/journey',
      ip: '79.186.221.148',
      socket: { remoteAddress: '79.186.221.148' },
    };

    expect(requestForLog(request)).toEqual({ method: 'GET', url: '/api/journey' });
  });

  it('leaves out the query, where a link’s token would be', () => {
    expect(requestForLog({ method: 'GET', url: '/verify-email?token=secret' })).toEqual({
      method: 'GET',
      url: '/verify-email',
    });
  });
});
