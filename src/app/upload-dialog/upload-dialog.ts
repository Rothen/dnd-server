import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-upload-dialog',
    templateUrl: 'upload-dialog.html',
    styleUrls: ['./upload-dialog.scss']
})
export class UploadDialog {
    public mapName: string;
    public pixelPerUnit: number;
    private file: any;
    private fileBuffer: ArrayBuffer;

    constructor(public dialogRef: MatDialogRef<UploadDialog>) { }

    public onFileSelected(): void {
        const inputNode: any = document.querySelector('#file');

        if (typeof (FileReader) !== 'undefined') {
            const reader = new FileReader();

            reader.onload = (e: any) => {
                this.file = inputNode.files[0];
                this.fileBuffer = e.target.result;
            };

            reader.readAsArrayBuffer(inputNode.files[0]);
        }
    }

    public closeDialog() {
        if (this.mapName == null || this.mapName.length == 0 || this.file == null || this.pixelPerUnit == null) {
            return;
        }
        
        this.dialogRef.close({
            name: this.mapName,
            map: this.file,
            mapBuffer: this.fileBuffer,
            pixelPerUnit: this.pixelPerUnit
        });
    }
}