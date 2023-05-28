import { Component, EventEmitter, Input, Output, ViewChild, OnInit } from '@angular/core';
import { MapData } from '../interfaces/map-data';
import { TokenData } from '../interfaces/token-data';
import { MatTable } from '@angular/material/table';
import { MapDataService } from '../services/map-data/map-data.service';
import { Synchronize } from '../services/synchronize/synchronize';
import { MapService } from '../services/map/map.service';

@Component({
    selector: 'app-controls',
    templateUrl: './controls.component.html',
    styleUrls: ['./controls.component.scss']
})
export class ControlsComponent implements OnInit {
    @ViewChild(MatTable) tokensTable: MatTable<any>;

    @Input() synchronize: Synchronize;
    @Input() maps: MapData[];

    @Output() uploadMap = new EventEmitter<void>();
    @Output() deleteMap = new EventEmitter<MapData>();

    public selectedToken: TokenData;
    public isPaused = false;

    constructor(
        private mapDataServcie: MapDataService,
        public mapService: MapService
        ) {}

    public ngOnInit(): void {
        this.mapService.onTokenSelect.subscribe(token => {
            if (token) {
                this.selectedToken = token.tokenData;
            } else {
                this.selectedToken = null;
            }
        });
    }

    public addToken(type: 'player' | 'npc' | 'enemy'): void {
        if (this.mapService.mapData) {
            const token = this.mapDataServcie.createToken(type);
            this.mapService.addTokenToMap(token);
            this.synchronize.updateSettings(this.mapService.mapData.name, this.mapService.mapData.settings);
            this.mapService.setSelectedToken(token);
        }
    }

    public deleteToken(tokenToDelete: TokenData): void {
        if (this.mapService.mapData) {
            this.mapService.removeTokenFromMap(tokenToDelete);

            this.synchronize.updateSettings(this.mapService.mapData.name, this.mapService.mapData.settings);

            if (this.selectedToken === tokenToDelete) {
                this.mapService.setSelectedToken(null);
            }
        }
    }

    public deleteMapClick(): void {
        if (this.mapService.mapData) {
            this.deleteMap.next(this.mapService.mapData);
        }
    }

    public tokenChanged(): void {
        this.mapService.updateToken(this.selectedToken);
        this.synchronize.updateSettings(this.mapService.mapData.name, this.mapService.mapData.settings);
    }

    public setSelectedMap(map: MapData): void {
        this.mapService.load(map);
        this.synchronize.updateMap(map);
    }

    public pause(): void {
        this.isPaused = true;
        this.synchronize.pauseSynchronizing();
    }

    public resume(): void {
        this.isPaused = false;
        this.synchronize.resumeSynchronizing();
    }
}
