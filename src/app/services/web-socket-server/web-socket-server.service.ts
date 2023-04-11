import { Injectable } from '@angular/core';
import * as ws from 'ws';
import * as fs from 'fs';
import * as dgram from 'dgram';
import { Subject } from 'rxjs';
import { MapSettingsUpdate, MapUpdate, StringUpdate } from '../synchronize/synchronize';

export interface UpdateData {
    client: ws.WebSocket;
    data: MapUpdate | StringUpdate | MapSettingsUpdate;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketServerService {
    ws: typeof ws;
    fs: typeof fs;
    dgram: typeof dgram;

    public clientConnectedSubject: Subject<ws.WebSocket> = new Subject();
    public onUpdateRecieved: Subject<UpdateData> = new Subject();
    public clients: ws.WebSocket[] = [];
    public listeningAddress: string;

    private server: ws.WebSocketServer;
    private dgramSocket: dgram.Socket;

    constructor() {
        if (this.isElectron) {
            this.ws = window.require('ws');
            this.fs = window.require('fs');
            this.dgram = window.require('dgram');
        }
    }

    get isElectron(): boolean {
        return !!(window && window.process && window.process.type);
    }

    public updateClient(client: ws.WebSocket, data: any): void {
        client.send(JSON.stringify(data));
    }

    public updateClients(data: any): void {
        this.clients.forEach(client => {
            this.updateClient(client, data);
        });
    }

    public start(): void {
        this.startWebSocketServer();
        this.startUDPServer();
    }

    public stop(): void {
        if (this.dgramSocket) {
            this.dgramSocket.close();
        }

        this.clients.forEach(client => client.close());

        if (this.server) {
            this.server.close();
        }
    }

    private startWebSocketServer(): void {
        this.server = new this.ws.WebSocketServer({ port: 8080 });

        this.server.on('connection', client => {
            this.clients.push(client);
            this.clientConnectedSubject.next(client);

            client.on('error', console.error);

            client.on('message', data => {
                console.log('received data from client');
                this.onUpdateRecieved.next({ client, data: JSON.parse(data.toString()) });
            });
        });
    }

    private startUDPServer(): void {
        this.dgramSocket = this.dgram.createSocket('udp4');

        this.dgramSocket.on('listening', () => {
            const address = this.dgramSocket.address();
            this.listeningAddress = address.address;
            console.log('UDP socket listening on ' + address.address + ':' + address.port);
        });

        this.dgramSocket.on('message', (message, remote) => {
            console.log('SERVER RECEIVED:', remote.address + ':' + remote.port + ' - ' + message);
            const response = 'Hellow there!';
            this.dgramSocket.send(response, 0, response.length, remote.port, remote.address);
        });

        this.dgramSocket.bind(5555);
    }
}
