import { Injectable } from '@angular/core';
import { MapData } from '../../interfaces/map-data';
import { MapSettingsData } from '../../interfaces/map-settings-data';
import { Synchronize } from './synchronize';
import { StorageService } from '../storage/storage.service';
import { UpdateData, WebSocketServerService } from '../web-socket-server/web-socket-server.service';

@Injectable({
    providedIn: 'root'
})
export class ServerSynchronizeService extends Synchronize {
    public isPaused = false;

    private pausedUpdateMapData: any;
    private pausedUpdateScenarioMapData: any;
    private pausedUpdateFogOfWarData: any;
    private pausedUpdateMapWithFogOfWarData: any;
    private pausedUpdateDmNotesData: any;
    private pausedUpdatePlayerNotesData: any;
    private pausedUpdateSettingsData: any;

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

            this.webSocketServerService.onUpdateRecieved.subscribe(data => {
                this.handleUpdate(data.data);
                this.forward(data);
            });
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

    public pauseSynchronizing(): void {
        this.isPaused = true;
    }

    public resumeSynchronizing(): void {
        if (this.pausedUpdateMapData) {
            this.webSocketServerService.updateClients(this.pausedUpdateMapData);
            this.pausedUpdateMapData = null;
        }
        if (this.pausedUpdateScenarioMapData) {
            this.webSocketServerService.updateClients(this.pausedUpdateScenarioMapData);
            this.pausedUpdateScenarioMapData = null;
        }
        if (this.pausedUpdateFogOfWarData) {
            this.webSocketServerService.updateClients(this.pausedUpdateFogOfWarData);
            this.pausedUpdateFogOfWarData = null;
        }
        if (this.pausedUpdateMapWithFogOfWarData) {
            this.webSocketServerService.updateClients(this.pausedUpdateMapWithFogOfWarData);
            this.pausedUpdateMapWithFogOfWarData = null;
        }
        if (this.pausedUpdateDmNotesData) {
            this.webSocketServerService.updateClients(this.pausedUpdateDmNotesData);
            this.pausedUpdateDmNotesData = null;
        }
        if (this.pausedUpdatePlayerNotesData) {
            this.webSocketServerService.updateClients(this.pausedUpdatePlayerNotesData);
            this.pausedUpdatePlayerNotesData = null;
        }
        if (this.pausedUpdateSettingsData) {
            this.webSocketServerService.updateClients(this.pausedUpdateSettingsData);
            this.pausedUpdateSettingsData = null;
        }

        this.isPaused = false;
    }

    public deleteMap(map: MapData): void {
        if (this.isPaused) {
            this.resumeSynchronizing();
        }

        this.storageService.deleteMap(map);
        this.webSocketServerService.updateClients({
            mapName: map.name,
            update: 'map_delte',
            value: map
        });
    }

    public updateMap(map: MapData): void {
        this.storageService.storeMap(map);

        this.pausedUpdateMapData = {
            mapName: map.name,
            update: 'map',
            value: map
        };
        if (!this.isPaused) {
            this.webSocketServerService.updateClients(this.pausedUpdateMapData);
            this.pausedUpdateMapData = null;
        }
    }

    public updateScenarioMap(mapName: string, scenarioMap: string): void {
        this.storageService.storeMapFile(mapName, scenarioMap);

        this.pausedUpdateScenarioMapData = {
            mapName,
            update: 'scenario_map',
            value: scenarioMap
        };
        if (!this.isPaused) {
            this.webSocketServerService.updateClients(this.pausedUpdateScenarioMapData);
            this.pausedUpdateScenarioMapData = null;
        }
    }

    public updateFogOfWar(mapName: string, fogOfWar: string): void {
        this.storageService.storeFogOfWarFile(mapName, fogOfWar);

        this.pausedUpdateFogOfWarData = {
            mapName,
            update: 'fog_of_war',
            value: fogOfWar
        };
        if (!this.isPaused) {
            this.webSocketServerService.updateClients(this.pausedUpdateFogOfWarData);
            this.pausedUpdateFogOfWarData = null;
        }
    }

    public updateMapWithFogOfWar(mapName: string, mapWithFogOfWar: string): void {
        this.storageService.storeMapWithFogOfWarFile(mapName, mapWithFogOfWar);

        this.pausedUpdateMapWithFogOfWarData = {
            mapName,
            update: 'map_with_fog_of_war',
            value: mapWithFogOfWar
        };
        if (!this.isPaused) {
            this.webSocketServerService.updateClients(this.pausedUpdateMapWithFogOfWarData);
            this.pausedUpdateMapWithFogOfWarData = null;
        }
    }

    public updateDmNotes(mapName: string, dmNotes: string): void {
        this.storageService.storeDmNotesFile(mapName, dmNotes);

        this.pausedUpdateDmNotesData = {
            mapName,
            update: 'dm_notes',
            value: dmNotes
        };
        if (!this.isPaused) {
            this.webSocketServerService.updateClients(this.pausedUpdateDmNotesData);
            this.pausedUpdateDmNotesData = null;
        }
    }

    public updatePlayerNotes(mapName: string, playerNotes: string): void {
        this.storageService.storePlayerNotesFile(mapName, playerNotes);

        this.pausedUpdatePlayerNotesData = {
            mapName,
            update: 'player_notes',
            value: playerNotes
        };
        if (!this.isPaused) {
            this.webSocketServerService.updateClients(this.pausedUpdatePlayerNotesData);
            this.pausedUpdatePlayerNotesData = null;
        }
    }

    public updateSettings(mapName: string, mapSettings: MapSettingsData): void {
        this.storageService.storeSettingsFile(mapName, mapSettings);

        this.pausedUpdateSettingsData = {
            mapName,
            update: 'settings',
            value: mapSettings
        };
        if (!this.isPaused) {
            this.webSocketServerService.updateClients(this.pausedUpdateSettingsData);
            this.pausedUpdateSettingsData = null;
        }
    }

    private forward(data: UpdateData): void {
        this.webSocketServerService.clients.forEach(client => {
            if (client !== data.client) {
                this.webSocketServerService.updateClient(client, {
                    update: data.data.update,
                    mapName: data.data.mapName,
                    value: data.data.value
                });
            }
        });
    }
}
