import { Injectable } from '@angular/core';
import * as ws from 'ws';
import * as dgram from 'dgram';
import { Map } from '../../interfaces/map';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    ws: typeof ws;
    dgram: typeof dgram;

    public onUpdateRecieved: Subject<any> = new Subject();

    private discoveryInterval: NodeJS.Timeout;
    private socket: dgram.Socket;
    private server: ws.WebSocket;

    constructor() {
        if (this.isElectron) {
            this.ws = window.require('ws');
            this.dgram = window.require('dgram');
        }
    }

    get isElectron(): boolean {
        return !!(window && window.process && window.process.type);
    }

    public updateServer(data: any): void {
        this.server.send(JSON.stringify(data));
    }

    public start(): void {
        this.discoverServer();
    }

    public stop(): void {
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
        }
        if (this.socket) {
            this.socket.close();
        }
        if (this.server) {
            this.server.close();
        }
    }

    private discoverServer(): void {
        const messageBuffer = Buffer.from('Server?');
        this.socket = this.dgram.createSocket('udp4');

        this.socket.on('listening', () => {
            this.socket.setBroadcast(true);
            this.sendDiscovery(this.socket, messageBuffer);
            this.discoveryInterval = setInterval(() => {
                this.sendDiscovery(this.socket, messageBuffer);
            }, 5000);
        });

        this.socket.on('message', (message, remote) => {
            this.startWebSocket(remote.address);
            clearInterval(this.discoveryInterval);
            this.discoveryInterval = null;
            this.socket.close();
            console.log('found server: ', remote.address);
        });

        this.socket.bind(8888);
    }

    private sendDiscovery(socket: dgram.Socket, messageBuffer: Buffer): void {
        socket.send(messageBuffer, 0, messageBuffer.length, 5555, '255.255.255.255');
    }

    private startWebSocket(host: string): void {
        this.server = new this.ws.WebSocket(`ws://${host}:8080`);

        this.server.on('error', console.error);

        this.server.on('open', _ => {
            console.log('connected to websocket server');
        });

        this.server.on('message', data => {
            console.log('received data');
            if (data.toString().length > 0) {
                this.onUpdateRecieved.next(JSON.parse(data.toString()));
            }
        });
    }
}
