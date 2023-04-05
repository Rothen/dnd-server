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

    private server: ws.WebSocket;

    constructor() {
        if (this.isElectron) {
            this.ws = window.require('ws');
            this.dgram = window.require('dgram');

            this.discoverServer();
        }
    }

    private discoverServer(): void {
        const message = Buffer.from('Server?');
        const socket = this.dgram.createSocket('udp4');
        let interval: NodeJS.Timeout;

        socket.on('listening', () => {
            socket.setBroadcast(true);
            this.sendDiscovery(socket, message);
            interval = setInterval(() => {
                this.sendDiscovery(socket, message);
            }, 5000);
        });

        socket.on('message', (message, remote) => {
            this.startWebSocket(remote.address);
            clearInterval(interval);
            socket.close();
            console.log('found server: ', remote.address);
        });

        socket.bind(8888);
    }

    private sendDiscovery(socket: dgram.Socket, message: Buffer): void {
        socket.send(message, 0, message.length, 5555, '255.255.255.255');
    }

    private startWebSocket(host: string): void {
        this.server = new this.ws.WebSocket(`ws://${host}:8080`);

        this.server.on('error', console.error);

        this.server.on('open', _ => {
            console.log('connected to websocket server');
        });

        this.server.on('message', data => {
            console.log('received: data');
            this.onUpdateRecieved.next(JSON.parse(data.toString()));
        });
    }

    public updateServer(data: any): void {
        this.server.send(JSON.stringify(data));
    }

    get isElectron(): boolean {
        return !!(window && window.process && window.process.type);
    }
}
