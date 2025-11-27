import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { storageService } from '@/services/storage.service';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2,
  Plus,
  Grid3x3,
  List
} from 'lucide-react';
import { toast } from 'sonner';

const StoragePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [files, setFiles] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/auth/login');
      return;
    }

    loadBuckets();
  }, [navigate]);

  useEffect(() => {
    if (selectedBucket) {
      loadFiles();
    }
  }, [selectedBucket]);

  const loadBuckets = () => {
    const loadedBuckets = storageService.getBuckets();
    setBuckets(loadedBuckets);
    if (loadedBuckets.length > 0 && !selectedBucket) {
      setSelectedBucket(loadedBuckets[0].name);
    }
  };

  const loadFiles = () => {
    if (!selectedBucket) return;
    const loadedFiles = storageService.getFiles(selectedBucket);
    setFiles(loadedFiles);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0 || !selectedBucket) return;

    setUploading(true);

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        await storageService.uploadFile(selectedBucket, uploadedFiles[i]);
      }
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
      loadFiles();
      loadBuckets();
    } catch (error: any) {
      toast.error('Upload failed', { description: error.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCreateBucket = () => {
    const name = prompt('Enter bucket name:');
    if (name) {
      storageService.createBucket(name, false);
      loadBuckets();
      toast.success('Bucket created');
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (confirm('Delete this file?')) {
      storageService.deleteFile(fileId);
      loadFiles();
      loadBuckets();
      toast.success('File deleted');
    }
  };

  const handleDownloadFile = (fileId: string) => {
    const data = storageService.downloadFile(fileId);
    if (data) {
      const file = files.find(f => f.id === fileId);
      const link = document.createElement('a');
      link.href = data;
      link.download = file?.name || 'download';
      link.click();
      toast.success('Download started');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const storageStats = storageService.getStorageStats();

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-glow">Storage</h1>
            <p className="text-muted-foreground mt-2">
              Manage your files and buckets
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCreateBucket}
              className="neon-border"
            >
              <Plus className="mr-2 w-4 h-4" />
              New Bucket
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              className="liquid-button pulse-glow"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !selectedBucket}
            >
              <Upload className="mr-2 w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
              <Folder className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{storageStats.formattedSize}</div>
              <p className="text-xs text-muted-foreground">{storageStats.totalFiles} files</p>
            </CardContent>
          </Card>

          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Buckets</CardTitle>
              <Folder className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{storageStats.bucketCount}</div>
              <p className="text-xs text-muted-foreground">storage containers</p>
            </CardContent>
          </Card>

          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Public Access</CardTitle>
              <ImageIcon className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {buckets.filter(b => b.public).length}
              </div>
              <p className="text-xs text-muted-foreground">public buckets</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Buckets Sidebar */}
          <Card className="card-elevated neon-border">
            <CardHeader>
              <CardTitle>Buckets</CardTitle>
              <CardDescription>Select a bucket to view files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {buckets.map((bucket) => (
                  <button
                    key={bucket.id}
                    onClick={() => setSelectedBucket(bucket.name)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedBucket === bucket.name
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{bucket.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {bucket.fileCount} files
                        </p>
                      </div>
                      {bucket.public && (
                        <Badge variant="outline" className="text-xs">Public</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Files Area */}
          <div className="lg:col-span-3">
            <Card className="card-elevated neon-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Files in {selectedBucket || 'No bucket selected'}</CardTitle>
                    <CardDescription>{files.length} file(s)</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className={viewMode === 'grid' ? 'neon-border' : ''}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewMode('list')}
                      className={viewMode === 'list' ? 'neon-border' : ''}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedBucket ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Select a bucket to view files
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No files in this bucket. Upload some files to get started.
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((file) => {
                      const Icon = getFileIcon(file.mimeType);
                      return (
                        <div
                          key={file.id}
                          className="group relative rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all overflow-hidden"
                        >
                          {/* Thumbnail */}
                          <div className="aspect-square bg-muted flex items-center justify-center">
                            {file.thumbnail ? (
                              <img
                                src={file.thumbnail}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icon className="w-12 h-12 text-muted-foreground" />
                            )}
                          </div>

                          {/* File Info */}
                          <div className="p-3">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8"
                              onClick={() => handleDownloadFile(file.id)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteFile(file.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => {
                      const Icon = getFileIcon(file.mimeType);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <Icon className="w-6 h-6 text-primary" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadFile(file.id)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteFile(file.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StoragePage;
