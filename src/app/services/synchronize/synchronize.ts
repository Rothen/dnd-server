import { Subject } from 'rxjs';
import { MapSettingsData } from '../../interfaces/map-settings-data';
import { MapData } from '../../interfaces/map-data';

export interface MapUpdate {
    update: string;
    mapName: string;
    value: MapData;
}

export interface StringUpdate {
    update: string;
    mapName: string;
    value: string;
}

export interface MapSettingsUpdate {
    update: string;
    mapName: string;
    value: MapSettingsData;
}

export abstract class Synchronize {
    public mapDeleteRecieved: Subject<MapUpdate> = new Subject();
    public mapUpdateRecieved: Subject<MapUpdate> = new Subject();
    public scenarioMapUpdateRecieved: Subject<StringUpdate> = new Subject();
    public fogOfWarUpdateRecieved: Subject<StringUpdate> = new Subject();
    public mapWithFogOfWarUpdateRecieved: Subject<StringUpdate> = new Subject();
    public dmNotesUpdateRecieved: Subject<StringUpdate> = new Subject();
    public playerNotesUpdateRecieved: Subject<StringUpdate> = new Subject();
    public settingsUpdateRecieved: Subject<MapSettingsUpdate> = new Subject();

    protected handleUpdate(data: MapUpdate | StringUpdate | MapSettingsUpdate): void {
        switch (data.update) {
            case 'map_delete':
                this.mapDeleteRecieved.next(data as MapUpdate);
                break;
            case 'map':
                this.mapUpdateRecieved.next(data as MapUpdate);
                break;
            case 'scenario_map':
                this.scenarioMapUpdateRecieved.next(data as StringUpdate);
                break;
            case 'fog_of_war':
                this.fogOfWarUpdateRecieved.next(data as StringUpdate);
                break;
            case 'map_with_fog_of_war':
                this.mapWithFogOfWarUpdateRecieved.next(data as StringUpdate);
                break;
            case 'dm_notes':
                this.dmNotesUpdateRecieved.next(data as StringUpdate);
                break;
            case 'player_notes':
                this.playerNotesUpdateRecieved.next(data as StringUpdate);
                break;
            case 'settings':
                this.settingsUpdateRecieved.next(data as MapSettingsUpdate);
                break;
        }
    }

    abstract startSynchronizing(): void;
    abstract stopSynchronizing(): void;
    abstract deleteMap(map: MapData): void;
    abstract updateMap(map: MapData): void;
    abstract updateScenarioMap(mapName: string, scenarioMap: string): void;
    abstract updateFogOfWar(mapName: string, fogOfWar: string): void;
    abstract updateMapWithFogOfWar(mapName: string, mapWithFogOfWar: string): void;
    abstract updateDmNotes(mapName: string, dmNotes: string): void;
    abstract updatePlayerNotes(mapName: string, playerNotes: string): void;
    abstract updateSettings(mapName: string, mapSettings: MapSettingsData): void;
}
