import { TestBed } from '@angular/core/testing';

import { WebSocketServerService } from './web-socket.service';

describe('WebSocketServerService', () => {
  let service: WebSocketServerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebSocketServerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
