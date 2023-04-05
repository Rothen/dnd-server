import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhiteboardComponent } from './whiteboard.component';
import { MatMenuModule } from '@angular/material/menu';

describe('WhiteboardComponent', () => {
    let component: WhiteboardComponent;
    let fixture: ComponentFixture<WhiteboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ MatMenuModule ],
            declarations: [WhiteboardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(WhiteboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
