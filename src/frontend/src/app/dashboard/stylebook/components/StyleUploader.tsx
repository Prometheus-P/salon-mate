'use client';

import { useState, useCallback } from 'react';
import { Upload, X, ImagePlus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAnalyzeBase64Image } from '../hooks/useStyles';
import { toast } from 'sonner';

interface StyleUploaderProps {
  shopId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'failed';
  error?: string;
}

export function StyleUploader({ shopId, isOpen, onClose, onComplete }: StyleUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const analyzeMutation = useAnalyzeBase64Image(shopId);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter((file) => {
      // 이미지 파일만 허용
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}은(는) 이미지 파일이 아닙니다.`);
        return false;
      }
      // 10MB 이하만 허용
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}은(는) 10MB를 초과합니다.`);
        return false;
      }
      return true;
    });

    const uploadedFiles: UploadedFile[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
    }));

    setFiles((prev) => [...prev, ...uploadedFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
      }
    },
    [addFiles]
  );

  const uploadAndAnalyze = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    for (const uploadedFile of pendingFiles) {
      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: 'uploading' as const } : f
          )
        );

        // Convert to base64
        const base64 = await fileToBase64(uploadedFile.file);
        const format = uploadedFile.file.type.split('/')[1] || 'jpeg';

        // Update status to analyzing
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: 'analyzing' as const } : f
          )
        );

        // Call API
        await analyzeMutation.mutateAsync({
          image_data: base64,
          image_format: format,
        });

        // Update status to completed
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: 'completed' as const } : f
          )
        );
      } catch (error) {
        // Update status to failed
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  status: 'failed' as const,
                  error: error instanceof Error ? error.message : '분석 실패',
                }
              : f
          )
        );
      }
    }

    // Check if all completed
    const allCompleted = files.every(
      (f) => f.status === 'completed' || f.status === 'failed'
    );
    if (allCompleted) {
      toast.success('스타일 분석이 완료되었습니다.');
    }
  };

  const handleClose = () => {
    // Cleanup previews
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    onClose();
  };

  const handleComplete = () => {
    // Cleanup previews
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    onComplete();
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const completedCount = files.filter((f) => f.status === 'completed').length;
  const isProcessing = files.some(
    (f) => f.status === 'uploading' || f.status === 'analyzing'
  );
  const allDone =
    files.length > 0 &&
    files.every((f) => f.status === 'completed' || f.status === 'failed');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-purple-500" />
            스타일 추가
          </DialogTitle>
          <DialogDescription>
            시술 사진을 업로드하면 AI가 자동으로 스타일을 분석합니다.
          </DialogDescription>
        </DialogHeader>

        {/* Drop Zone */}
        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="flex cursor-pointer flex-col items-center"
          >
            <Upload className="mb-4 h-10 w-10 text-gray-400" />
            <p className="mb-2 text-sm text-gray-600">
              <span className="font-semibold text-purple-600">클릭하여 업로드</span>
              하거나 파일을 드래그하세요
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, GIF, WebP (최대 10MB)
            </p>
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-2"
              >
                {/* Preview */}
                <img
                  src={uploadedFile.preview}
                  alt="Preview"
                  className="h-12 w-12 rounded object-cover"
                />

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-700">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {uploadedFile.status === 'pending' && (
                    <span className="text-xs text-gray-400">대기 중</span>
                  )}
                  {uploadedFile.status === 'uploading' && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs">업로드 중...</span>
                    </div>
                  )}
                  {uploadedFile.status === 'analyzing' && (
                    <div className="flex items-center gap-1 text-purple-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs">분석 중...</span>
                    </div>
                  )}
                  {uploadedFile.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {uploadedFile.status === 'failed' && (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-xs">{uploadedFile.error}</span>
                    </div>
                  )}

                  {/* Remove Button */}
                  {(uploadedFile.status === 'pending' ||
                    uploadedFile.status === 'failed') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(uploadedFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <div className="text-sm text-gray-500">
            {files.length > 0 && (
              <>
                {completedCount}/{files.length} 완료
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={isProcessing}>
              취소
            </Button>
            {allDone ? (
              <Button onClick={handleComplete}>완료</Button>
            ) : (
              <Button
                onClick={uploadAndAnalyze}
                disabled={pendingCount === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {pendingCount}개 분석 시작
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper: File to Base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}
