import { TestBed } from '@angular/core/testing';

import { ServerDiscoveryService } from './server-discovery.service';

describe('ServerDiscoveryService', () => {
  let service: ServerDiscoveryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServerDiscoveryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
