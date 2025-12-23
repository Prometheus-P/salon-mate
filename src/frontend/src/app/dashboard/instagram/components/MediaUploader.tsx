'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  GripVertical,
  Sparkles,
  FolderOpen,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const MAX_FILES = 10;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];

interface MediaItem {
  id: string;
  file?: File;
  url: string;
  type: 'image' | 'video';
  isUploading?: boolean;
  error?: string;
}

interface MediaUploaderProps {
  value: MediaItem[];
  onChange: (value: MediaItem[]) => void;
  onOpenLibrary?: () => void;
  onOpenAIStudio?: () => void;
  className?: string;
}

export function MediaUploader({
  value,
  onChange,
  onOpenLibrary,
  onOpenAIStudio,
  className,
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return '지원하지 않는 파일 형식입니다.';
    }

    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      return isVideo
        ? '비디오는 100MB 이하만 업로드 가능합니다.'
        : '이미지는 8MB 이하만 업로드 가능합니다.';
    }

    return null;
  };

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remainingSlots = MAX_FILES - value.length;

      if (remainingSlots <= 0) {
        return;
      }

      const newItems: MediaItem[] = fileArray
        .slice(0, remainingSlots)
        .map((file) => {
          const error = validateFile(file);
          const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

          return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            url: URL.createObjectURL(file),
            type: isVideo ? ('video' as const) : ('image' as const),
            error: error ?? undefined,
          };
        });

      onChange([...value, ...newItems]);
    },
    [value, onChange]
  );

  const removeItem = useCallback(
    (id: string) => {
      const item = value.find((m) => m.id === id);
      if (item?.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
      onChange(value.filter((m) => m.id !== id));
    },
    [value, onChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  };

  // Drag and drop reordering
  const handleItemDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...value];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    onChange(newItems);
    setDraggedIndex(index);
  };

  const handleItemDragEnd = () => {
    setDraggedIndex(null);
  };

  const hasErrors = value.some((item) => item.error);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Error Alert */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            일부 파일에 오류가 있습니다. 해당 파일을 제거하거나 다시 업로드해주세요.
          </AlertDescription>
        </Alert>
      )}

      {/* Media Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {value.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleItemDragStart(index)}
              onDragOver={(e) => handleItemDragOver(e, index)}
              onDragEnd={handleItemDragEnd}
              className={cn(
                'relative aspect-square rounded-lg overflow-hidden border-2 group cursor-move',
                draggedIndex === index && 'opacity-50',
                item.error
                  ? 'border-red-500'
                  : index === 0
                  ? 'border-primary'
                  : 'border-transparent hover:border-primary/50'
              )}
            >
              {/* Media Preview */}
              {item.type === 'video' ? (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : (
                <img
                  src={item.url}
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Cover Badge */}
              {index === 0 && !item.error && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded text-xs font-medium">
                  커버
                </div>
              )}

              {/* Drag Handle */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1 bg-black/50 rounded">
                  <GripVertical className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeItem(item.id)}
                className="absolute bottom-1 right-1 p-1 bg-black/50 hover:bg-red-500 rounded transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>

              {/* Loading Overlay */}
              {item.isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}

              {/* Error Overlay */}
              {item.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/50 p-2">
                  <p className="text-xs text-white text-center">{item.error}</p>
                </div>
              )}
            </div>
          ))}

          {/* Add More Button (inline) */}
          {value.length < MAX_FILES && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Upload Area */}
      {value.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <div className="p-4 rounded-full bg-muted mb-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">이미지 또는 비디오 추가</p>
          <p className="text-xs text-muted-foreground text-center">
            드래그하여 업로드하거나 클릭하세요
            <br />
            최대 {MAX_FILES}개, 이미지 8MB, 비디오 100MB
          </p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenLibrary}
          className="gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          라이브러리에서 선택
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAIStudio}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          AI 이미지 생성
        </Button>
      </div>

      {/* File Count */}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length}/{MAX_FILES}개 선택됨
          {value.length > 1 && ' (첫 번째가 커버 이미지)'}
        </p>
      )}
    </div>
  );
}
