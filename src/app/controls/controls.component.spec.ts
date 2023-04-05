import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlsComponent } from './controls.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

describe('ControlsComponent', () => {
    let component: ControlsComponent;
    let fixture: ComponentFixture<ControlsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                MatIconModule,
                MatMenuModule
            ],
            declarations: [ControlsComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ControlsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
