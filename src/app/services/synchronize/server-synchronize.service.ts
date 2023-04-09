import { Injectable } from '@angular/core';
import { MapData } from '../../interfaces/map-data';
import { MapSettingsData } from '../../interfaces/map-settings-data';
import { Synchronize } from './synchronize';
import { StorageService } from '../storage/storage.service';
import { WebSocketServerService } from '../web-socket-server/web-socket-server.service';

@Injectable({
    providedIn: 'root'
})
export class ServerSynchronizeService extends Synchronize {
    constructor(
        private storageService: StorageService,
        private webSocketServerService: WebSocketServerService
    ) {
        super();

        if (this.isElectron) {
            this.playerNotesUpdateRecieved.subscribe(update => {
                this.storageService.storePlayerNotesFile(update.mapName, update.value);
            });

            this.settingsUpdateRecieved.subscribe(update => {
                this.storageService.storeSettingsFile(update.mapName, update.value);
            });

            this.webSocketServerService.onUpdateRecieved.subscribe(data => this.handleUpdate(data.data));
        }
    }

    get isElectron(): boolean {
        return !!(window && window.process && window.process.type);
    }

    public startSynchronizing(): void {
        this.webSocketServerService.start();
    }

    public stopSynchronizing(): void {
        this.webSocketServerService.stop();
    }

    public deleteMap(map: MapData): void {
        this.storageService.deleteMap(map);
        this.webSocketServerService.updateClients({
            mapName: map.name,
            update: 'map_delte',
            value: map
        });
    }

    public updateMap(map: MapData): void {
        this.storageService.storeMap(map);
        this.webSocketServerService.updateClients({
            mapName: map.name,
            update: 'map',
            value: map
        });
    }

    public updateScenarioMap(mapName: string, scenarioMap: string): void {
        this.storageService.storeMapFile(mapName, scenarioMap);
        this.webSocketServerService.updateClients({
            mapName,
            update: 'scenario_map',
            value: scenarioMap
        });
    }

    public updateFogOfWar(mapName: string, fogOfWar: string): void {
        this.storageService.storeFogOfWarFile(mapName, fogOfWar);
        this.webSocketServerService.updateClients({
            mapName,
            update: 'fog_of_war',
            value: fogOfWar
        });
    }

    public updateMapWithFogOfWar(mapName: string, mapWithFogOfWar: string): void {
        this.storageService.storeMapWithFogOfWarFile(mapName, mapWithFogOfWar);
        this.webSocketServerService.updateClients({
            mapName,
            update: 'map_with_fog_of_war',
            value: mapWithFogOfWar
        });
    }

    public updateDmNotes(mapName: string, dmNotes: string): void {
        this.storageService.storeDmNotesFile(mapName, dmNotes);
        this.webSocketServerService.updateClients({
            mapName,
            update: 'dm_notes',
            value: dmNotes
        });
    }

    public updatePlayerNotes(mapName: string, playerNotes: string): void {
        this.storageService.storePlayerNotesFile(mapName, playerNotes);
        this.webSocketServerService.updateClients({
            mapName,
            update: 'player_notes',
            value: playerNotes
        });
    }

    public updateSettings(mapName: string, mapSettings: MapSettingsData): void {
        this.storageService.storeSettingsFile(mapName, mapSettings);
        this.webSocketServerService.updateClients({
            mapName,
            update: 'settings',
            value: mapSettings
        });
    }
}
