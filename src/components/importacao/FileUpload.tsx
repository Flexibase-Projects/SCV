import { useCallback, useState } from 'react';
import { CloudUploadOutlined as Upload, TableChartOutlined as FileSpreadsheet, CloseOutlined as X } from '@mui/icons-material';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
}

export function FileUpload({ 
  onFileSelect, 
  accept = '.csv,.xlsx,.xls',
  disabled = false 
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (['csv', 'xlsx', 'xls'].includes(extension || '')) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [disabled, onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
    // Reset input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  }, [onFileSelect]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            disabled={disabled}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        'rounded-xl border-2 border-dashed p-8 text-center transition-all',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 hover:border-gray-300',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
      />
      
      <label
        htmlFor="file-upload"
        className={cn(
          'flex cursor-pointer flex-col items-center gap-4',
          disabled && 'cursor-not-allowed'
        )}
      >
        <div className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full',
          isDragging ? 'bg-primary/10' : 'bg-gray-100'
        )}>
          <Upload className={cn(
            'h-8 w-8',
            isDragging ? 'text-primary' : 'text-gray-400'
          )} />
        </div>
        
        <div>
          <p className="text-lg font-medium text-gray-700">
            {isDragging ? 'Solte o arquivo aqui' : 'Arraste e solte seu arquivo'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            ou <span className="text-primary font-medium">clique para selecionar</span>
          </p>
        </div>
        
        <p className="text-xs text-gray-400">
          Formatos aceitos: CSV, Excel (.xlsx, .xls)
        </p>
      </label>
    </div>
  );
}

