import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ApiGatewayService } from '../shared/services/apiGateway.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-import-file',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './import-file.component.html',
  styleUrl: './import-file.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportFileComponent {
  private apiGatewayService = inject(ApiGatewayService);
  public fileName: string = '';
  selectedFile: File | null = null;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Only CSV files are allowed.');
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
    console.log('Selected file:', this.selectedFile.name);
  }

  importCsv() {
    if(!this.selectedFile) {
      alert('No file selected.');
      return; 
    }

    this.apiGatewayService.uploadCsv(this.selectedFile, this.fileName).subscribe({
      next: (res: any) => console.log('File uploaded successfully!', res),
      error: (err: any) => console.error('Upload failed', err)
    });
  }
}
