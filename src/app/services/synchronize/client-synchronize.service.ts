import { Injectable } from '@angular/core';
import { MapData } from '../../interfaces/map-data';
import { MapSettingsData } from '../../interfaces/map-settings-data';
import { Synchronize } from './synchronize';
import { WebSocketService } from '../web-socket/web-socket.service';

@Injectable({
    providedIn: 'root'
})
export class ClientSynchronizeService extends Synchronize {
    constructor(
        private webSocketService: WebSocketService
    ) {
        super();

        this.webSocketService.onUpdateRecieved.subscribe(data => {
            console.log(data);
            this.handleUpdate(data.data);
        });
    }

    get isElectron(): boolean {
        return !!(window && window.process && window.process.type);
    }

    public startSynchronizing(): void {
        this.webSocketService.start();
    }

    public stopSynchronizing(): void {
        this.webSocketService.stop();
    }

    public pauseSynchronizing(): void {
        // Ignore
    }

    public resumeSynchronizing(): void {
        // Ignore
    }

    public deleteMap(map: MapData): void {
        // Ignore
    }

    public updateMap(map: MapData): void {
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
            mapName,
            update: 'player_notes',
            value: playerNotes
        });
    }

    public updateSettings(mapName: string, mapSettings: MapSettingsData): void {
        this.webSocketService.updateServer({
            mapName,
            update: 'settings',
            value: mapSettings
        });
    }
}
