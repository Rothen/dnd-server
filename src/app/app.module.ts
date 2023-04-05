import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

import { DetailModule } from './detail/detail.module';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectModule } from '@angular/material/select';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field'
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { UploadDialog } from './upload-dialog/upload-dialog';
import { MatInputModule } from '@angular/material/input';
import { ControlsComponent } from './controls/controls.component';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';

@NgModule({
    declarations: [
        AppComponent,
        UploadDialog,
        ControlsComponent,
        WhiteboardComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        CoreModule,
        SharedModule,
        DetailModule,
        BrowserAnimationsModule,
        MatSelectModule,
        DragDropModule,
        MatCheckboxModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatDialogModule,
        MatInputModule,
        MatListModule,
        MatIconModule,
        MatButtonToggleModule,
        MatRadioModule,
        MatTableModule
    ],
    providers: [
        { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: false } }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
