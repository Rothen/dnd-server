import { ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
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
    public displayedColumns: string[] = ['name', 'type', 'size', 'actions'];

    constructor(private mapServcie: MapService) {}

    public onMapChange(event: MatSelectionListChange): void {
        this.selectedToken = null;
        this.selectedTokenChange.next(null);
        this.selectedMap = event.options[0].value;
        this.selectedMapChange.next(this.selectedMap);
        this.hideList = true;
    }

    public addToken(): void {
        if (this.selectedMap) {
            const token = this.mapServcie.addToken(this.selectedMap);

            this.tokensTable.renderRows()
            this.tokensUpdated.next();

            this.selectedToken = token;
            this.selectedTokenChange.next(this.selectedToken);
        }
    }

    public deleteToken(token: Token): void {
        if (this.selectedMap) {
            const index = this.selectedMap.settings.tokens.indexOf(token);

            if (index >= 0) {
                this.selectedMap.settings.tokens.splice(index, 1);
                this.tokensTable.renderRows();
                this.tokensUpdated.next();
            }
        }
    }

    public deleteMapClick(): void {
        if (this.selectedMap) {
            this.hideList = false;
            this.deleteMap.next(this.selectedMap);
        }
    }
}
