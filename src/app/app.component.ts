import { Component, ViewChild, ChangeDetectorRef, OnInit, AfterViewInit } from '@angular/core';
import { first } from 'rxjs';
import { StorageService } from './services/storage/storage.service';
import { MapData } from './interfaces/map-data';
import { MatDialog } from '@angular/material/dialog';
import { UploadDialogComponent } from './upload-dialog/upload-dialog.component';
import { ControlsComponent } from './controls/controls.component';
import { TokenData } from './interfaces/token-data';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';
import { MapDataService } from './services/map-data/map-data.service';
import { WebSocketServerService } from './services/web-socket-server/web-socket-server.service';
import { ServerSynchronizeService } from './services/synchronize/server-synchronize.service';
import { Synchronize } from './services/synchronize/synchronize';
import { ClientSynchronizeService } from './services/synchronize/client-synchronize.service';
import { MapService } from './services/map/map.service';
import { ServerDiscoveryService } from './services/server-discovery/server-discovery.service';
import { WebSocketService } from './services/web-socket/web-socket.service';

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
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(WhiteboardComponent) whiteBoardComponent: WhiteboardComponent;
    @ViewChild(ControlsComponent) controlsComponent: ControlsComponent;

    public title = 'dnd';
    public maps: MapData[];
    public selectedMap: MapData;
    public selectedToken: TokenData;
    public showOverlay = false;
    public paintMode = 'paint';
    public synchronize: Synchronize;
    public inDmMode: boolean;
    public servers: { name: string, port: number }[] = [];
    public selectedServer: { name: string, port: number };

    constructor(
        private storageService: StorageService,
        public serverSyncronizeService: ServerSynchronizeService,
        public clientSyncronizeService: ClientSynchronizeService,
        private changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        private mapDataService: MapDataService,
        private mapService: MapService,
        private webSocketServer: WebSocketServerService,
        private webSocketClient: WebSocketService,
        private serverDiscoveryService: ServerDiscoveryService
    ) { }

    public ngOnInit() {
        this.maps = this.storageService.listMaps();
        this.serverDiscoveryService.onDiscovered.subscribe(servers => this.servers = servers);
        this.webSocketServer.clientConnectedSubject.subscribe(
            client => this.webSocketServer.updateClient(client, this.selectedMap)
        );
        this.mapService.onTokenChange.subscribe(
            token => this.synchronize.updateSettings(this.mapService.mapData.name, this.mapService.mapData.settings)
        );
    }

    public ngAfterViewInit(): void {
        this.mapService.setWhiteBoard(this.whiteBoardComponent.whiteBoard);
    }

    public modeSelected(): void {
        this.mapService.setInDmMode(this.inDmMode);

        if (this.synchronize) {
            this.synchronize.stopSynchronizing();
        }

        if (this.inDmMode) {
            this.selectedServer = null;
            this.synchronize = this.serverSyncronizeService;
        } else {
            this.webSocketClient.setServer(this.selectedServer.name, this.selectedServer.port);
            this.synchronize = this.clientSyncronizeService;
        }

        this.synchronize.startSynchronizing();
        this.initSynchronizeEvents();
    }

    public onMapSelectionChange(): void {
        this.mapService.load(this.selectedMap);
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

            this.mapDataService.createMap(result.map, result.name, result.pixelPerUnit).pipe(first()).subscribe(addedMap => {
                this.storageService.storeMap(addedMap);
                this.maps = this.storageService.listMaps();
                this.selectedMap = this.maps.find(map => map.settings.id === addedMap.settings.id);
                this.mapService.load(this.selectedMap);
                this.synchronize.updateMap(this.selectedMap);
            });
        });
    }

    public deleteMap(map: MapData): void {
        this.storageService.deleteMap(map);
        this.mapService.destroy();
        this.maps = this.storageService.listMaps();
        this.selectedMap = null;
    }

    public updateTokens(): void {
        this.mapService.update(this.selectedMap);
        this.synchronize.updateSettings(this.selectedMap.name, this.selectedMap.settings);
    }

    private initSynchronizeEvents(): void {
        this.synchronize.mapDeleteRecieved.subscribe(data => {
            this.selectedMap = null;
            this.changeDetectorRef.detectChanges();
        });
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
