import { Component, ViewChild, ChangeDetectorRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { first } from 'rxjs';
import { StorageService } from './services/storage/storage.service';
import { Map } from './interfaces/map';
import { MatDialog } from '@angular/material/dialog';
import { UploadDialogComponent } from './upload-dialog/upload-dialog.component';
import { ControlsComponent } from './controls/controls.component';
import { Token } from './interfaces/token';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';
import { MapService } from './services/map/map.service';
import { WebSocketServerService } from './services/web-socket-server/web-socket-server.service';
import { ServerSynchronizeService } from './services/synchronize/server-synchronize.service';
import { Synchronize } from './services/synchronize/synchronize';
import { ClientSynchronizeService } from './services/synchronize/client-synchronize.service';

interface DialogResult {
    name: string;
    map: Blob | MediaSource;
    mapBuffer: ArrayBuffer;
    pixelPerUnit: number;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    @ViewChild(WhiteboardComponent) whiteBoardComponent: WhiteboardComponent;
    @ViewChild(ControlsComponent) controlsComponent: ControlsComponent;

    public title = 'dnd';
    public maps: Map[];
    public selectedMap: Map;
    public selectedToken: Token;
    public showOverlay = false;
    public paintMode = 'paint';
    public synchronize: Synchronize;
    public inDmMode: boolean;

    constructor(
        private storageService: StorageService,
        public serverSyncronizeService: ServerSynchronizeService,
        public clientSyncronizeService: ClientSynchronizeService,
        private changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        private mapService: MapService,
        private webSocketServer: WebSocketServerService
    ) { }

    public ngOnInit() {
        this.maps = this.storageService.listMaps();
        this.webSocketServer.clientConnectedSubject.subscribe(client => this.webSocketServer.updateClient(client, this.selectedMap));
    }

    public modeSelected(): void {
        if (this.synchronize) {
            this.synchronize.stopSynchronizing();
        }

        if (this.inDmMode) {
            this.synchronize = this.serverSyncronizeService;
        } else {
            this.synchronize = this.clientSyncronizeService;
        }

        this.synchronize.startSynchronizing();
        this.initSynchronizeEvents();
    }

    public onMapSelectionChange(): void {
        this.synchronize.updateMap(this.selectedMap);
    }

    public uploadMap(): void {
        const dialogRef = this.dialog.open(UploadDialogComponent, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe((result: DialogResult) => {
            if (!result) {
                return;
            }

            this.mapService.createMap(result.map, result.name, result.pixelPerUnit).pipe(first()).subscribe(addedMap => {
                this.storageService.storeMap(addedMap);
                this.maps = this.storageService.listMaps();
                this.selectedMap = this.maps.find(map => map.settings.id === addedMap.settings.id);
                this.controlsComponent.hideList = true;
                this.synchronize.updateMap(this.selectedMap);
            });
        });
    }

    public deleteMap(map: Map): void {
        this.storageService.deleteMap(map);
        this.maps = this.storageService.listMaps();
        this.selectedMap = null;
    }

    public updateTokens(): void {
        this.whiteBoardComponent.ngOnChanges({
            tokens: {
                previousValue: this.selectedMap.settings.tokens,
                currentValue: this.selectedMap.settings.tokens,
                firstChange: false,
                isFirstChange: () => false
            }
        });

        this.synchronize.updateSettings(this.selectedMap.name, this.selectedMap.settings);
    }

    private initSynchronizeEvents(): void {
        this.synchronize.mapUpdateRecieved.subscribe(data => {
            this.selectedMap = data.value;
            this.changeDetectorRef.detectChanges();
        });
        this.synchronize.scenarioMapUpdateRecieved.subscribe(update => this.selectedMap.scenarioMap = update.value);
        this.synchronize.fogOfWarUpdateRecieved.subscribe(update => this.selectedMap.fogOfWar = update.value);
        this.synchronize.mapWithFogOfWarUpdateRecieved.subscribe(update => this.selectedMap.mapWithFogOfWar = update.value);
        this.synchronize.dmNotesUpdateRecieved.subscribe(update => this.selectedMap.dmNotes = update.value);
        this.synchronize.playerNotesUpdateRecieved.subscribe(update => this.selectedMap.playerNotes = update.value);
        this.synchronize.settingsUpdateRecieved.subscribe(update => this.selectedMap.settings = update.value);
    }
}
