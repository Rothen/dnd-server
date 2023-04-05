import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Map } from '../interfaces/map';
import { DrawService } from '../services/draw/draw.service';
import { fromEvent } from 'rxjs';
import { Token } from '../interfaces/token';
import { MenuItem } from '../interfaces/menu-item';
import { Synchronize } from '../services/synchronize/synchronize';
import { HUGE, LARGE, MEDIUM, SMALL } from '../helpers/pen-size';
import { WhiteBoard } from '../helpers/white-board';
import { Drawer, FogDrawer, FogEraser } from '../helpers/drawer';

@Component({
    selector: 'app-whiteboard',
    templateUrl: './whiteboard.component.html',
    styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements OnInit, OnChanges {
    @ViewChild('whiteBoard') whiteBoardRef: ElementRef;

    @Input() inDmMode: boolean;
    @Input() synchronize: Synchronize;
    @Input() selectedMap: Map;
    @Input() selectedToken: Token;

    @Output() selectedTokenChange: EventEmitter<Token> = new EventEmitter();
    @Output() selectedMapChange: EventEmitter<Map> = new EventEmitter();
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

    private whiteBoard: WhiteBoard;
    private lastTokenSelection: Date;

    constructor(
        private drawService: DrawService
    ) { }

    public ngOnInit() {
        this.whiteBoard = new WhiteBoard('white-board');
        this.initLayerVisibility();
        this.initTokenEvents();
        this.initSynchronizeEvents();
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (this.selectedMap) {
            if (changes.selectedMap) {
                this.loadMap();
            }
            if (changes.tokens) {
                this.whiteBoard.updateTokens(this.selectedMap.settings.tokens);
            }
        } else {
            if (this.whiteBoard) {
                this.whiteBoard.reset(true);
            }
        }
    }

    public loadMap(): void {
        this.whiteBoard.loadMap(this.selectedMap, this.inDmMode);
        this.initToolbox();
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

    private initLayerVisibility(): void {
        if (this.inDmMode) {
            this.whiteBoard.mapWithFogOfWarLayer.hide();
            this.whiteBoard.backLayer.show();
            this.whiteBoard.fogOfWarLayer.show();
            this.whiteBoard.mapLayer.show();
            this.whiteBoard.dmNotesLayer.show();
        } else {
            this.whiteBoard.mapWithFogOfWarLayer.show();
            this.whiteBoard.backLayer.hide();
            this.whiteBoard.fogOfWarLayer.hide();
            this.whiteBoard.mapLayer.hide();
            this.whiteBoard.dmNotesLayer.hide();
        }
    }

    private initToolbox(): void {
        this.paintModes = this.inDmMode ? [
            new FogDrawer(
                this.drawService,
                this.whiteBoardRef.nativeElement,
                this.synchronize,
                this.whiteBoard,
                this.whiteBoard.fogOfWarLayer,
                { x: this.selectedMap.settings.width, y: this.selectedMap.settings.height }),
            new FogEraser(
                this.drawService,
                this.whiteBoardRef.nativeElement,
                this.synchronize,
                this.whiteBoard,
                this.whiteBoard.fogOfWarLayer,
                { x: this.selectedMap.settings.width, y: this.selectedMap.settings.height })
        ] : [];

        this.selectedPaintMode = this.inDmMode ? this.paintModes[0] : null;
        if (this.inDmMode) {
            this.selectedPaintMode.activate();
        }
        this.selectedPenSize = this.inDmMode ? LARGE : SMALL;
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
        });
        this.whiteBoard.tokensChanged.subscribe(token => {
            this.synchronize.updateSettings(this.selectedMap.name, this.selectedMap.settings);
        });
    }

    private initSynchronizeEvents(): void {
        if (this.synchronize) {
            this.synchronize.mapUpdateRecieved.subscribe(update => this.whiteBoard.loadMap(update.value, this.inDmMode));
            this.synchronize.scenarioMapUpdateRecieved.subscribe(update => this.whiteBoard.updateScenarioMap(update.value));
            this.synchronize.fogOfWarUpdateRecieved.subscribe(update => this.whiteBoard.updateFogOfWar(update.value));
            this.synchronize.mapWithFogOfWarUpdateRecieved.subscribe(update => this.whiteBoard.updateMapWithFogOfWar(update.value));
            this.synchronize.dmNotesUpdateRecieved.subscribe(update => this.whiteBoard.updateDmNotes(update.value));
            this.synchronize.playerNotesUpdateRecieved.subscribe(update => this.whiteBoard.updatePlayerNotes(update.value));
            this.synchronize.settingsUpdateRecieved.subscribe(update => this.whiteBoard.updateSettings(update.value));
        }
    }
}
