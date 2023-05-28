import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { UpdateData } from '../web-socket-server/web-socket-server.service';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    public onUpdateRecieved: Subject<UpdateData> = new Subject();

    private server: WebSocket;
    private host: string;
    private port: number;

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
        this.server = new WebSocket(`ws://${this.host}:${this.port}`);

        this.server.addEventListener('error', console.error);

        this.server.addEventListener('open', _ => {
            console.log('connected to websocket server');
        });

        this.server.addEventListener('message', (message: MessageEvent) => {
            if (message.data.length > 0) {
                this.onUpdateRecieved.next({
                    client: this.server as any,
                    data: JSON.parse(message.data)
                });
            }
        });
    }
}
