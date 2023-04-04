import { ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Map } from '../map';
import { MatSelectionListChange } from '@angular/material/list';
import { Token } from '../token';
import { MatTable } from '@angular/material/table';

@Component({
    selector: 'app-controls',
    templateUrl: './controls.component.html',
    styleUrls: ['./controls.component.scss']
})
export class ControlsComponent {
    @ViewChild(MatTable) tokensTable: MatTable<any>;

    @Input() map: Map;
    @Input() maps: Map[];
    @Input() token: Token;
    @Input() mode: string;
    @Input() paintMode: string;

    @Output() mapChange = new EventEmitter<Map>();
    @Output() uploadMap = new EventEmitter<void>();
    @Output() paintModeChange = new EventEmitter<string>();
    @Output() deleteMap = new EventEmitter<Map>();
    @Output() tokenAdded = new EventEmitter<void>();

    public hideList: boolean = false;
    public displayedColumns: string[] = ['name', 'type', 'size', 'actions'];

    constructor(private changeDetectorRefs: ChangeDetectorRef) {}

    public onMapChange(event: MatSelectionListChange): void {
        this.map = event.options[0].value;
        this.mapChange.next(this.map);
        this.hideList = true;
    }

    public addToken(): void {
        if (this.map) {
            let token: Token = {
                name: '',
                size: 'medium',
                type: 'npc',
                position: { x: 0, y: 0 }
            }
            this.map.settings.tokens.push(token);
            this.token = token;

            this.tokensTable.renderRows()

            this.tokenAdded.next();
        }
    }

    public deleteToken(token: Token): void {
        if (this.map) {
            const index = this.map.settings.tokens.indexOf(token);

            if (index >= 0) {
                this.map.settings.tokens.splice(index, 1);
                this.tokensTable.renderRows();
                this.tokenAdded.next();
            }
        }
    }

    public deleteMapClick(): void {
        if (this.map) {
            this.hideList = false;
            this.deleteMap.next(this.map);
        }
    }
}
