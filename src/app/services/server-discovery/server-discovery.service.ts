import { Injectable } from '@angular/core';
import * as ws from 'ws';
import * as dgram from 'dgram';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ServerDiscoveryService {
    ws: typeof ws;
    dgram: typeof dgram;

    public onDiscovered: Subject<{ name: string; port: number }[]> = new Subject();
    public discoveredServers: { name: string; port: number }[] = [];

    private discoveryInterval: NodeJS.Timeout;
    private socket: dgram.Socket;

    constructor() {
        if (this.isElectron) {
            this.ws = window.require('ws');
            this.dgram = window.require('dgram');

            this.discoverServers();
        }
    }

    get isElectron(): boolean {
        return !!(window && window.process && window.process.type);
    }

    public stop(): void {
        clearInterval(this.discoveryInterval);
        this.discoveryInterval = null;
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    private discoverServers(): void {
        const messageBuffer = Buffer.from('Server?');
        this.socket = this.dgram.createSocket('udp4');

        this.socket.on('listening', () => {
            this.socket.setBroadcast(true);
            this.sendDiscovery(this.socket, messageBuffer);
            this.discoveryInterval = setInterval(() => {
                this.sendDiscovery(this.socket, messageBuffer);
            }, 1000);
        });

        this.socket.on('message', (message, remote) => {
            console.log('found server: ', remote.address);
            if (!this.discoveredServers.find(discoveredServer => discoveredServer.name === remote.address)) {
                this.discoveredServers.push({
                    name: remote.address,
                    port: 8081
                });
                this.onDiscovered.next(this.discoveredServers);
            }
        });

        this.socket.bind(8888);
    }

    private sendDiscovery(socket: dgram.Socket, messageBuffer: Buffer): void {
        socket.send(messageBuffer, 0, messageBuffer.length, 5555, '255.255.255.255');
    }
}
