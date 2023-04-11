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
import { MatSelectionList } from '@angular/material/list';
import { AbstractControl, FormControl, FormGroupDirective, NgForm, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

interface DialogResult {
    name: string;
    map: Blob | MediaSource;
    mapBuffer: ArrayBuffer;
    pixelPerUnit: number;
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        const isSubmitted = form && form.submitted;
        return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
    }
}

export function ipFormatValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        /*eslint max-len: ["error", { "code": 800 }]*/
        const ipFormat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(control.value);
        return ipFormat ? null : { ipFormat: { value: control.value } };
    };
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(WhiteboardComponent) whiteBoardComponent: WhiteboardComponent;
    @ViewChild(ControlsComponent) controlsComponent: ControlsComponent;
    @ViewChild(MatSelectionList) serverSelectionList: MatSelectionList;

    public title = 'dnd';
    public maps: MapData[];
    public selectedMap: MapData;
    public selectedToken: TokenData;
    public showOverlay = false;
    public paintMode = 'paint';
    public synchronize: Synchronize;
    public inDmMode: boolean;
    public servers: string[];
    public selectedServer: string;
    public serverFormControl: FormControl = new FormControl('', [Validators.required, ipFormatValidator()]);

    constructor(
        private storageService: StorageService,
        public serverSyncronizeService: ServerSynchronizeService,
        public clientSyncronizeService: ClientSynchronizeService,
        public changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        private mapDataService: MapDataService,
        private mapService: MapService,
        private webSocketServer: WebSocketServerService,
        private webSocketClient: WebSocketService,
        private serverDiscoveryService: ServerDiscoveryService
    ) {
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        }, false);
    }

    get isElectron(): boolean {
        return !!(window && window.process && window.process.type);
    }

    public ngOnInit() {
        this.maps = this.storageService.listMaps();
        this.webSocketServer.clientConnectedSubject.subscribe(
            client => (this.mapService.mapData) ? this.synchronize.updateMap(this.mapService.mapData) : null
        );
        this.mapService.onTokenChange.subscribe(
            token => this.synchronize.updateSettings(this.mapService.mapData.name, this.mapService.mapData.settings)
        );
    }

    public ngAfterViewInit(): void {
        this.mapService.setWhiteBoard(this.whiteBoardComponent.whiteBoard);
        this.serverDiscoveryService.onDiscovered.subscribe(servers => {
            this.servers = servers.map(server => server.name);
            this.changeDetectorRef.detectChanges();
        });
    }

    public modeSelected(): void {
        if (!this.isElectron) {
            this.selectedServer = this.serverFormControl.value;
        }

        this.mapService.setInDmMode(this.inDmMode);

        if (this.synchronize) {
            this.synchronize.stopSynchronizing();
        }
        this.serverDiscoveryService.stop();

        if (this.inDmMode) {
            this.selectedServer = null;
            this.synchronize = this.serverSyncronizeService;
        } else {
            this.webSocketClient.setServer(this.selectedServer, 8080);
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
        this.synchronize.updateSettings(this.selectedMap.name, this.selectedMap.settings);
    }

    public onNgModelChange(event: any) {
        console.log('On ngModelChange : ', event);
    }

    private initSynchronizeEvents(): void {
        this.synchronize.mapDeleteRecieved.subscribe(data => {
            this.selectedMap = null;
            this.mapService.destroy();
            this.changeDetectorRef.detectChanges();
        });
        this.synchronize.mapUpdateRecieved.subscribe(data => {
            this.selectedMap = data.value;
            this.mapService.load(this.selectedMap);
            this.changeDetectorRef.detectChanges();
        });
        this.synchronize.scenarioMapUpdateRecieved.subscribe(update => {
            this.selectedMap.scenarioMap = update.value;
            this.mapService.updateScenarioMap();
        });
        this.synchronize.fogOfWarUpdateRecieved.subscribe(update => {
            this.selectedMap.fogOfWar = update.value;
            this.mapService.updateFogOfWar();
        });
        this.synchronize.mapWithFogOfWarUpdateRecieved.subscribe(update => {
            this.selectedMap.mapWithFogOfWar = update.value;
            this.mapService.updateMapWithFogOfWar();
        });
        this.synchronize.dmNotesUpdateRecieved.subscribe(update => {
            this.selectedMap.dmNotes = update.value;
            this.mapService.updateDmNotes();
        });
        this.synchronize.playerNotesUpdateRecieved.subscribe(update => {
            this.selectedMap.playerNotes = update.value;
            this.mapService.updatePlayerNotes();
        });
        this.synchronize.settingsUpdateRecieved.subscribe(update => {
            this.mapService.update(update.value);
        });
    }
}
