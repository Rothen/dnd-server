import { Injectable } from '@angular/core';
import * as ws from 'ws';
import * as dgram from 'dgram';
import { Map } from '../../interfaces/map';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketServerService {
    ws: typeof ws;
    dgram: typeof dgram;

    private server: ws.WebSocketServer;
    private clients: ws.WebSocket[] = [];

    public clientConnectedSubject: Subject<ws.WebSocket> = new Subject();
    public onUpdateRecieved: Subject<{ client: ws.WebSocket, data: any }> = new Subject();

    constructor() {
        if (this.isElectron) {
            this.ws = window.require('ws');
            this.dgram = window.require('dgram');

            this.startWebSocketServer();
            this.startUDPServer();
        }
    }

    private startWebSocketServer(): void {
        this.server = new this.ws.WebSocketServer({ port: 8080 });

        this.server.on('connection', ws => {
            this.clients.push(ws);
            this.clientConnectedSubject.next(ws);

            ws.on('error', console.error);

            ws.on('message', data => {
                console.log('received data from client');
                this.onUpdateRecieved.next({ client: ws, data: JSON.parse(data.toString()) });
            });
        });
    }

    private startUDPServer(): void {
        const socket = this.dgram.createSocket('udp4');

        socket.on('listening', function () {
            const address = socket.address();
            console.log('UDP socket listening on ' + address.address + ":" + address.port);
        });

        socket.on('message', function (message, remote) {
            console.log('SERVER RECEIVED:', remote.address + ':' + remote.port + ' - ' + message);
            const response = "Hellow there!";
            socket.send(response, 0, response.length, remote.port, remote.address);
        });

        socket.bind(5555);
    }

    public updateClient(client: ws.WebSocket, data: any): void {
        client.send(JSON.stringify(data));
    }

    public updateClients(data: any): void {
        this.clients.forEach(client => {
            this.updateClient(client, data);
        });
    }

    get isElectron(): boolean {
        return !!(window && window.process && window.process.type);
    }
}
