import { Injectable } from '@angular/core';
import * as fs from 'fs';
import * as path from 'node:path';
import { ipcRenderer } from 'electron';
import { APP_CONFIG } from '../../../environments/environment';
import { Map } from '../../interfaces/map';
import { MapSettings } from '../../interfaces/map-settings';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    fs: typeof fs;
    path: typeof path;
    ipcRenderer: typeof ipcRenderer;

    protected userDataPath: string;
    protected mapsPath: string;

    constructor() {
        if (this.isElectron) {
            this.fs = window.require('fs');
            this.path = window.require('node:path');
            this.ipcRenderer = window.require('electron').ipcRenderer;

            this.userDataPath = this.ipcRenderer.sendSync('userDataPath');
            this.mapsPath = this.path.join(this.userDataPath, APP_CONFIG.mapsFolderPath);

            if (!this.fs.existsSync(this.mapsPath)) {
                this.fs.mkdirSync(this.mapsPath);
            }
        }
    }

    get isElectron(): boolean {
        return !!(window && window.process && window.process.type);
    }

    public listMaps(): Map[] {
        if (this.isElectron) {
            return this.fs.readdirSync(this.mapsPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => this.loadMap(dirent.name));
        } else {
            return [];
        }
    }

    public loadMap(name: string): Map {
        if (this.isElectron) {
            const mapFolderPath = this.path.join(this.mapsPath, name);
            if (this.fs.existsSync(mapFolderPath)) {
                return {
                    name,
                    scenarioMap: this.loadMapFile(mapFolderPath),
                    fogOfWar: this.loadFogOfWarFile(mapFolderPath),
                    mapWithFogOfWar: this.loadMapWithFogOfWarFile(mapFolderPath),
                    dmNotes: this.loadDmNotesFile(mapFolderPath),
                    playerNotes: this.loadPlayerNotesFile(mapFolderPath),
                    settings: this.loadSettingsFile(mapFolderPath)
                };
            }
        } else {
            return null;
        }
    }

    public deleteMap(map: Map): void {
        const mapPath = this.path.join(this.mapsPath, map.name);
        if (this.fs.existsSync(mapPath)) {
            this.fs.rmdirSync(mapPath, { recursive: true });
        }
    }

    public storeMap(map: Map): Map {
        if (this.isElectron) {
            const mapFolderPath = this.path.join(this.mapsPath, map.name);
            if (!this.fs.existsSync(mapFolderPath)) {
                this.fs.mkdirSync(mapFolderPath);
            }

            this.storeMapFile(map.name, map.scenarioMap);
            this.storeFogOfWarFile(map.name, map.fogOfWar);
            this.storeMapWithFogOfWarFile(map.name, map.mapWithFogOfWar);
            this.storeDmNotesFile(map.name, map.dmNotes);
            this.storePlayerNotesFile(map.name, map.playerNotes);
            this.storeSettingsFile(map.name, map.settings);
        } else {
            return null;
        }
    }

    public loadMapFile(mapFolderPath: string): string {
        return this.readPng(this.path.join(mapFolderPath, APP_CONFIG.mapPath));
    }

    public loadFogOfWarFile(mapFolderPath: string): string {
        return this.readPng(this.path.join(mapFolderPath, APP_CONFIG.fogOfWarPath));
    }

    public loadMapWithFogOfWarFile(mapFolderPath: string): string {
        return this.readPng(this.path.join(mapFolderPath, APP_CONFIG.mapWithFogOfWarPath));
    }

    public loadDmNotesFile(mapFolderPath: string): string {
        return this.readPng(this.path.join(mapFolderPath, APP_CONFIG.dmNotesPath));
    }

    public loadPlayerNotesFile(mapFolderPath: string): string {
        return this.readPng(this.path.join(mapFolderPath, APP_CONFIG.playerNotesPath));
    }

    public loadSettingsFile(mapFolderPath: string): MapSettings {
        const settings = JSON.parse(this.fs.readFileSync(this.path.join(mapFolderPath, APP_CONFIG.settingsPath)).toString());
        return settings;
    }

    public storeMapFile(mapPath: string, scenarioMap: string): void {
        this.writePng(this.path.join(this.mapsPath, mapPath, APP_CONFIG.mapPath), scenarioMap);
    }

    public storeFogOfWarFile(mapPath: string, fogOfWar: string): void {
        this.writePng(this.path.join(this.mapsPath, mapPath, APP_CONFIG.fogOfWarPath), fogOfWar);
    }

    public storeMapWithFogOfWarFile(mapPath: string, mapWithFogOfWar: string): void {
        this.writePng(this.path.join(this.mapsPath, mapPath, APP_CONFIG.mapWithFogOfWarPath), mapWithFogOfWar);
    }

    public storeDmNotesFile(mapPath: string, dmNotes: string): void {
        this.writePng(this.path.join(this.mapsPath, mapPath, APP_CONFIG.dmNotesPath), dmNotes);
    }

    public storePlayerNotesFile(mapPath: string, playerNotes: string): void {
        this.writePng(this.path.join(this.mapsPath, mapPath, APP_CONFIG.playerNotesPath), playerNotes);
    }

    public storeSettingsFile(mapPath: string, settings: MapSettings): void {
        this.fs.writeFileSync(this.path.join(this.mapsPath, mapPath, APP_CONFIG.settingsPath), JSON.stringify(settings));
    }

    private readPng(filePath: string): string {
        return 'data:image/png;base64,\n' +this.fs.readFileSync(filePath, { encoding: 'base64' });
    }

    private writePng(filePath: string, image: string): void {
        this.fs.writeFileSync(filePath, image.replace(/^data:image\/png;base64,/, ''), { encoding: 'base64' });
    }
}
