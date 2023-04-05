import { Injectable } from '@angular/core';
import { Map } from '../../interfaces/map';
import { MapSettings } from '../../interfaces/map-settings';
import { Synchronize } from './synchronize';
import { WebSocketService } from '../web-socket/web-socket.service';

@Injectable({
    providedIn: 'root'
})
export class ServerSynchronize extends Synchronize {
    constructor(
        private webSocketService: WebSocketService
    ) {
        super();

        if (this.isElectron) {
            this.webSocketService.onUpdateRecieved.subscribe(data => this.handleUpdate(data));
        }
    }

    public updateMap(map: Map): void {
        // Ignore
    }

    public updateScenarioMap(mapName: string, scenarioMap: string): void {
        // Ignore
    }

    public updateFogOfWar(mapName: string, fogOfWar: string): void {
        // Ignore
    }

    public updateMapWithFogOfWar(mapName: string, mapWithFogOfWar: string): void {
        // Ignore
    }

    public updateDmNotes(mapName: string, dmNotes: string): void {
        // Ignore
    }

    public updatePlayerNotes(mapName: string, playerNotes: string): void {
        this.webSocketService.updateServer({
            update: 'player_notes',
            value: playerNotes
        });
    }

    public updateSettings(mapName: string, mapSettings: MapSettings): void {
        this.webSocketService.updateServer({
            update: 'settings',
            value: mapSettings
        });
    }

    get isElectron(): boolean {
        return !!(window && window.process && window.process.type);
    }
}
