import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Map } from '../interfaces/map';
import { MatSelectionListChange } from '@angular/material/list';
import { Token } from '../interfaces/token';
import { MatTable } from '@angular/material/table';
import { MapService } from '../services/map/map.service';

@Component({
    selector: 'app-controls',
    templateUrl: './controls.component.html',
    styleUrls: ['./controls.component.scss']
})
export class ControlsComponent {
    @ViewChild(MatTable) tokensTable: MatTable<any>;

    @Input() selectedMap: Map;
    @Input() maps: Map[];
    @Input() selectedToken: Token;
    @Input() mode: string;
    @Input() paintMode: string;

    @Output() selectedMapChange = new EventEmitter<Map>();
    @Output() selectedTokenChange = new EventEmitter<Token>();
    @Output() uploadMap = new EventEmitter<void>();
    @Output() paintModeChange = new EventEmitter<string>();
    @Output() deleteMap = new EventEmitter<Map>();
    @Output() tokensUpdated = new EventEmitter<void>();

    public hideList: boolean = false;
    public displayedColumns: string[] = ['name', 'type', 'size'];

    constructor(private mapServcie: MapService) {}

    public onMapChange(event: MatSelectionListChange): void {
        this.setSelectedToken(null);
        this.selectedMap = event.options[0].value;
        this.selectedMapChange.next(this.selectedMap);
        this.hideList = true;
    }

    public addToken(type: 'player' | 'npc' | 'enemy'): void {
        if (this.selectedMap) {
            const token = this.mapServcie.addToken(this.selectedMap, type);

            this.tokensUpdated.next();

            this.setSelectedToken(token);
        }
    }

    public deleteToken(token: Token): void {
        if (this.selectedMap) {
            const index = this.selectedMap.settings.tokens.indexOf(token);

            if (index >= 0) {
                this.selectedMap.settings.tokens.splice(index, 1);
                this.tokensUpdated.next();

                if (this.selectedToken == token) {
                    this.setSelectedToken(null);
                }
            }
        }
    }

    public deleteMapClick(): void {
        if (this.selectedMap) {
            this.hideList = false;
            this.deleteMap.next(this.selectedMap);
        }
    }

    public paintModeChanged(): void {
        
    }

    public setSelectedMap(map: Map): void {
        this.selectedMap = map;
        this.selectedMapChange.next(this.selectedMap);
    }

    public setSelectedToken(token: Token): void {
        this.selectedToken = token;
        this.selectedTokenChange.next(this.selectedToken);
    }
}
