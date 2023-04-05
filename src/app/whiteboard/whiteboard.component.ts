import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { WhiteBoard } from '../helpers/white-board';
import { StorageService } from '../services/storage/storage.service';
import { Map } from '../interfaces/map';
import { DrawService } from '../services/draw/draw.service';
import { map, Observable, from, forkJoin } from 'rxjs';
import { Vector2d } from 'konva/lib/types';
import Konva from 'konva';
import { Token } from '../interfaces/token';

@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements OnInit, OnChanges {
    @ViewChild('whiteBoard') whiteBoardRef: ElementRef;

    @Input() selectedMap: Map;
    @Input() selectedToken: Token;

    @Output() selectedTokenChange: EventEmitter<Token> = new EventEmitter();

    public paintMode: 'paint' | 'erase' = 'paint';

    private whiteBoard: WhiteBoard;

    constructor(
        private storageService: StorageService,
        private drawService: DrawService
    ) { }

    public ngOnInit() {
        this.whiteBoard = new WhiteBoard('white-board', this.storageService);
        this.whiteBoard.tokenSelected.subscribe(token => {
            this.selectedToken = token;
            this.selectedTokenChange.next(this.selectedToken);
        });
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (this.selectedMap) {
            if (changes['selectedMap']) {
                this.loadMap();
            }
            if (changes['tokens']) {
                this.whiteBoard.updateTokens();
            }
        } else {
            if (this.whiteBoard) {
                this.whiteBoard.reset();
            }
        }
    }

    public loadMap(): void {
        this.whiteBoard.loadMap(this.selectedMap);
        this.drawService.setCanvas(
            this.whiteBoardRef.nativeElement,
            this.whiteBoard.stage,
            this.whiteBoard.fogOfWarLayer,
            { x: this.selectedMap.settings.width, y: this.selectedMap.settings.height }
        ).subscribe(_ => this.storeWhiteBoard());
    }

    private storeWhiteBoard(): Observable<string> {
        const observable = this.createMapWithFogOfWarDataURL();

        observable.subscribe(mapWithFogOfWar => {
            this.selectedMap.scenarioMap = this.whiteBoard.getScenarioMapDataURL();
            this.selectedMap.fogOfWar = this.whiteBoard.getFogOfWarDataURL();
            this.selectedMap.mapWithFogOfWar = mapWithFogOfWar;
            this.selectedMap.dmNotes = this.whiteBoard.getDmNotesDataURL();
            this.selectedMap.playerNotes = this.whiteBoard.getPlayerNotesDataURL();

            this.storageService.storeMap(this.selectedMap);
            return this.selectedMap;
        });

        return observable;
    }

    private createMapWithFogOfWarDataURL(): Observable<string> {
        const pos = this.whiteBoard.stage.getPosition();
        const scale = this.whiteBoard.stage.scale() as Vector2d;
        const rec = { x: pos.x, y: pos.y, width: this.selectedMap.settings.width * scale.x, height: this.selectedMap.settings.height * scale.y, pixelRatio: 1 / scale.y };
        const observables = [
            from(this.whiteBoard.backLayer.toImage(rec)),
            from(this.whiteBoard.fogOfWarLayer.toImage(rec))
        ];

        return forkJoin(observables).pipe(map(res => {
            const group = new Konva.Group();

            group.add(new Konva.Image({ image: res[0] as any }));
            group.add(new Konva.Image({ image: res[1] as any }));

            return group.toDataURL();
        }));
    }

    public paintModeChanged(): void {
        this.drawService.setPainMode(this.paintMode);
    }
}
