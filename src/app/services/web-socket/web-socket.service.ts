import { Injectable } from '@angular/core';
import * as ws from 'ws';
import { Subject } from 'rxjs';
import { UpdateData } from '../web-socket-server/web-socket-server.service';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    ws: typeof ws;

    public onUpdateRecieved: Subject<UpdateData> = new Subject();

    private server: ws.WebSocket;
    private host: string;
    private port: number;

    constructor() {
        if (this.isElectron) {
            this.ws = window.require('ws');
        }
    }

    get isElectron(): boolean {
        return !!(window && window.process && window.process.type);
    }

    public updateServer(data: any): void {
        this.server.send(JSON.stringify(data));
    }

    public start(): void {
        this.startWebSocket();
    }

    public stop(): void {
        if (this.server) {
            this.server.close();
        }
    }

    public setServer(host: string, port: number): void {
        this.host = host;
        this.port = port;
    }

    private startWebSocket(): void {
        this.server = new this.ws.WebSocket(`ws://${this.host}:${this.port}`);

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
