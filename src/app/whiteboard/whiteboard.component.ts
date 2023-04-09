import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MapData } from '../interfaces/map-data';
import { DrawService } from '../services/draw/draw.service';
import { fromEvent } from 'rxjs';
import { TokenData } from '../interfaces/token-data';
import { MenuItem } from '../interfaces/menu-item';
import { Synchronize } from '../services/synchronize/synchronize';
import { HUGE, LARGE, MEDIUM, SMALL } from '../helpers/pen-size';
import { WhiteBoard } from '../helpers/white-board';
import { Drawer, FogDrawer, FogEraser } from '../helpers/drawer';
import { MapService } from '../services/map/map.service';

@Component({
    selector: 'app-whiteboard',
    templateUrl: './whiteboard.component.html',
    styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements OnInit {
    @ViewChild('whiteBoard') whiteBoardRef: ElementRef;

    @Input() synchronize: Synchronize;
    @Input() selectedToken: TokenData;

    @Output() selectedTokenChange: EventEmitter<TokenData> = new EventEmitter();
    @Output() selectedMapChange: EventEmitter<MapData> = new EventEmitter();
    @Output() tokensChange: EventEmitter<void> = new EventEmitter();

    public selectedPaintMode: Drawer;
    public selectedPenSize: MenuItem;

    public paintModes: Drawer[] = [];
    public penSizes: MenuItem[] = [
        SMALL,
        MEDIUM,
        LARGE,
        HUGE
    ];

    public whiteBoard: WhiteBoard;
    private lastTokenSelection: Date;

    constructor(
        private drawService: DrawService,
        private mapService: MapService
    ) { }

    public ngOnInit() {
        this.whiteBoard = new WhiteBoard('white-board');
        this.initTokenEvents();
        this.initSynchronizeEvents();
        this.initMapServiceEvents();
    }

    public setSelectedPaintMode(paintMode: Drawer): void {
        this.selectedPaintMode = paintMode;
        this.selectedPaintMode.activate();
        this.drawService.setPaintMode(this.selectedPaintMode);
    }

    public setSelectedPenSize(penSize: MenuItem): void {
        this.selectedPenSize = penSize;
        this.drawService.setPenSize(this.selectedPenSize);
    }

    private initToolbox(): void {
        this.paintModes = this.mapService.inDmMode ? [
            new FogDrawer(
                this.drawService,
                this.whiteBoardRef.nativeElement,
                this.synchronize,
                this.mapService,
                this.whiteBoard,
                this.whiteBoard.fogOfWarLayer,
                { x: this.mapService.mapData.settings.width, y: this.mapService.mapData.settings.height }),
            new FogEraser(
                this.drawService,
                this.whiteBoardRef.nativeElement,
                this.synchronize,
                this.mapService,
                this.whiteBoard,
                this.whiteBoard.fogOfWarLayer,
                { x: this.mapService.mapData.settings.width, y: this.mapService.mapData.settings.height })
        ] : [];

        this.selectedPaintMode = this.mapService.inDmMode ? this.paintModes[0] : null;
        if (this.mapService.inDmMode) {
            this.selectedPaintMode.activate();
        }
        this.selectedPenSize = this.mapService.inDmMode ? LARGE : SMALL;
    }

    private initTokenEvents(): void {
        this.whiteBoard.tokenSelected.subscribe(token => {
            this.selectedToken = token;
            this.selectedTokenChange.next(this.selectedToken);
            this.lastTokenSelection = new Date();
        });

        fromEvent(this.whiteBoard.stage, 'click').subscribe((event) => {
            if (this.lastTokenSelection) {
                const delta = new Date().getTime() - this.lastTokenSelection.getTime();
                if (delta <= 10) {
                    return;
                }
            }
            this.selectedToken = null;
            this.selectedTokenChange.next(null);
            this.whiteBoard.selectedToken = null;
            this.whiteBoard.selectedTokenGroup = null;
            this.whiteBoard.updateDistances();
        });
        this.whiteBoard.tokensChanged.subscribe(token => {
            this.synchronize.updateSettings(this.mapService.mapData.name, this.mapService.mapData.settings);
        });
    }

    private initSynchronizeEvents(): void {
        if (this.synchronize) {
            // this.synchronize.mapUpdateRecieved.subscribe(update => this.whiteBoard.loadMap(update.value, this.mapService.inDmMode));
            /*this.synchronize.scenarioMapUpdateRecieved.subscribe(update => this.map.updateScenarioMap(update.value));
            this.synchronize.fogOfWarUpdateRecieved.subscribe(update => this.map.updateFogOfWar(update.value));
            this.synchronize.mapWithFogOfWarUpdateRecieved.subscribe(update => this.map.updateMapWithFogOfWar(update.value));
            this.synchronize.dmNotesUpdateRecieved.subscribe(update => this.map.updateDmNotes(update.value));
            this.synchronize.playerNotesUpdateRecieved.subscribe(update => this.map.updatePlayerNotes(update.value));
            this.synchronize.settingsUpdateRecieved.subscribe(update => this.map.updateSettings(update.value));*/
        }
    }

    private initMapServiceEvents(): void {
        this.mapService.onMapLoad.subscribe(_ => this.initToolbox());
    }
}
