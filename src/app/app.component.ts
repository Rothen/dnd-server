import { Component, ViewChild } from '@angular/core';
import { WhiteBoard } from './white-broad';
import Konva from 'konva';
import { from, fromEvent } from 'rxjs';
import { Vector2d } from 'konva/lib/types';
import { StorageService } from './storage.service';
import { Map } from './map';
import { MatDialog } from '@angular/material/dialog';
import { UploadDialog } from './upload-dialog/upload-dialog';
import { ControlsComponent } from './controls/controls.component';
import { Token } from './token';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    @ViewChild(ControlsComponent) controlsComponent: ControlsComponent;

    private map: HTMLImageElement;

    public mapPath = 'assets/test_map.jpg';

    title = 'dnd';

    // Brush colour and size
    public colour = {
        r: 130,
        g: 130,
        b: 130
    };
    public strokeWidth = 50;
    public BUTTON = 0b01;
    public selectedMode = 'edit_fog';

    // Drawing state
    public latestPoint: number[];
    public drawing = false;

    // Set up our drawing context
    public fogOfWarContext: CanvasRenderingContext2D;
    public dmNotesContext: CanvasRenderingContext2D;
    public playerNotesContext: CanvasRenderingContext2D;
    public pointerContext: CanvasRenderingContext2D;

    public fogOfWarInfCanvas: any;
    public dmNotesInfCanvas: any;
    public playerNotesInfCanvas: any;
    public pointerInfCanvas: any;

    public maps: Map[];
    public selectedMap: Map;
    public showOverlay: boolean = false;

    private whiteBoard: WhiteBoard;
    public paintMode: string = 'paint';
    public selectedToken: Token;

    constructor(
        private storageService: StorageService,
        public dialog: MatDialog
    ) { }

    public ngOnInit() {
        this.whiteBoard = new WhiteBoard('canvas', this.storageService);
        this.whiteBoard.tokenSelected.subscribe(token => {
            console.log(token);
            this.selectedToken = token;
            this.controlsComponent.token = token;
        });
        
        this.maps = this.storageService.listMaps();
        window.addEventListener('resize', event => this.resize())
    }

    private resize(): void {
        this.whiteBoard.stage.size({ width: window.innerWidth, height: window.innerHeight });
    }

    // Drawing functions

    public continueStroke(newPoint: number[]) {
        let stroke: Konva.Path = new Konva.Path({
            data: `M${this.latestPoint[0]} ${this.latestPoint[1]} ${newPoint[0]} ${newPoint[1]}`,
            lineCap: 'round',
            stroke: `rgb(${this.colour.r}, ${this.colour.g}, ${this.colour.b})`,
            strokeWidth: this.strokeWidth,
            lineJoin: 'round',
            globalCompositeOperation: (this.paintMode === 'paint') ? 'source-over' : 'destination-out'
        });
        this.whiteBoard.fogOfWarLayer.add(stroke);
        this.latestPoint = newPoint;
    }

    // Event helpers

    public uploadMap(): void {
        let dialogRef = this.dialog.open(UploadDialog, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe((result: { name: string, map: any, mapBuffer: ArrayBuffer }) => {
            if (result) {
                this.map = new Image();
                
                fromEvent(this.map, 'load').subscribe(_ => {
                    this.whiteBoard.initMap(this.map, result.name).subscribe(_ => {
                        this.maps = this.storageService.listMaps()
                        this.selectedMap = this.maps.find(map => map.name === result.name);
                        this.controlsComponent.hideList = true;
                        this.loadMap();
                    });
                });

                this.map.src = URL.createObjectURL(result.map);
            }
        });
    }

    public loadMap(): void {
        this.whiteBoard.loadMap(this.selectedMap);
    }

    public startStroke(point: number[]) {
        this.drawing = true;
        this.latestPoint = point;
    }

    public mouseButtonIsDown(buttons: number): boolean {
        return (this.BUTTON & buttons) === this.BUTTON;
    }

    public mouseMove(evt: MouseEvent) {
        if (!this.drawing) {
            return;
        }
        const pointer = this.whiteBoard.stage.getRelativePointerPosition();
        this.continueStroke([pointer.x, pointer.y]);
    }

    public mouseDown(evt: MouseEvent) {
        if (evt.button != 0) {
            return;
        }
        if (this.drawing) {
            return;
        }
        evt.preventDefault();
        const pointer = this.whiteBoard.stage.getRelativePointerPosition();
        this.startStroke([pointer.x, pointer.y]);
    }

    public mouseEnter(evt: MouseEvent) {
        if (!this.mouseButtonIsDown(evt.buttons) || this.drawing) {
            return;
        }
        this.mouseDown(evt);
    }

    public endStroke(evt: MouseEvent) {
        if (!this.drawing) {
            return;
        }
        this.drawing = false;

        const position = this.whiteBoard.stage.getPosition();
        const scale = this.whiteBoard.stage.scale() as Vector2d;
        const rec = { x: position.x, y: position.y, width: this.whiteBoard.map.settings.width * scale.x, height: this.whiteBoard.map.settings.height * scale.y, pixelRatio: 1 / scale.x };

        from(this.whiteBoard.fogOfWarLayer.toImage(rec)).subscribe(res => {
            this.whiteBoard.fogOfWarLayer.destroyChildren();
            this.whiteBoard.fogOfWarLayer.add(new Konva.Image({ image: res as any }));
            this.whiteBoard.store().subscribe();
        });
    }

    public deleteMap(map: Map): void {
        this.storageService.deleteMap(map);
        this.whiteBoard.reset();
        this.maps = this.storageService.listMaps();
        this.selectedMap = null;
    }
}
