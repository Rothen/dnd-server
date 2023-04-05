import { Component, ViewChild } from '@angular/core';
import { first, fromEvent } from 'rxjs';
import { StorageService } from './services/storage/storage.service';
import { Map } from './interfaces/map';
import { MatDialog } from '@angular/material/dialog';
import { UploadDialog } from './upload-dialog/upload-dialog';
import { ControlsComponent } from './controls/controls.component';
import { Token } from './interfaces/token';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';
import { MapService } from './services/map/map.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    @ViewChild(WhiteboardComponent) whiteBoardComponent: WhiteboardComponent;
    @ViewChild(ControlsComponent) controlsComponent: ControlsComponent;

    public title = 'dnd';
    public maps: Map[];
    public selectedMap: Map;
    public selectedToken: Token;
    public showOverlay: boolean = false;
    public paintMode: string = 'paint';

    constructor(
        private storageService: StorageService,
        public dialog: MatDialog,
        private mapService: MapService
    ) { }

    public ngOnInit() {        
        this.maps = this.storageService.listMaps();
    }

    public uploadMap(): void {
        let dialogRef = this.dialog.open(UploadDialog, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe((result: { name: string, map: Blob | MediaSource, mapBuffer: ArrayBuffer, pixelPerUnit: number }) => {
            if (!result) {
                return;
            }

            this.mapService.createMap(result.map, result.name, result.pixelPerUnit).pipe(first()).subscribe(addedMap => {
                this.storageService.storeMap(addedMap);
                this.maps = this.storageService.listMaps();
                this.selectedMap = this.maps.find(map => map.settings.id === addedMap.settings.id);
                this.controlsComponent.hideList = true;
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
    }
}
