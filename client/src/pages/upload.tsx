import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileArchive, FileText, CheckCircle2, AlertCircle, ArrowRight, Info } from "lucide-react";

export default function UploadPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Upload successful", description: `Parsed ${data.summary?.positions || 0} positions, ${data.summary?.skills || 0} skills` });
      navigate("/select-track");
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) uploadMutation.mutate(selectedFile);
  };

  const isZip = selectedFile?.name.endsWith(".zip");
  const isCsv = selectedFile?.name.endsWith(".csv");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="font-serif text-3xl font-bold mb-2" data-testid="text-upload-title">Upload LinkedIn Data</h1>
          <p className="text-muted-foreground">
            Upload your official LinkedIn data export to begin your analysis.
          </p>
        </div>

        <Card className="p-0">
          <div
            className={`relative p-10 border-2 border-dashed rounded-md transition-colors cursor-pointer ${
              dragActive ? "border-primary bg-primary/5" : "border-border"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
            data-testid="dropzone-upload"
          >
            <input
              id="file-input"
              type="file"
              accept=".zip,.csv"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-file"
            />
            
            <div className="flex flex-col items-center text-center">
              {selectedFile ? (
                <>
                  <div className="w-14 h-14 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    {isZip ? <FileArchive className="w-6 h-6 text-primary" /> : <FileText className="w-6 h-6 text-primary" />}
                  </div>
                  <p className="font-medium mb-1" data-testid="text-file-name">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                    {isZip && " (ZIP archive)"}
                    {isCsv && " (CSV file)"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-sm text-chart-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ready to upload</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium mb-1">Drop your LinkedIn export here</p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse. Accepts .zip or .csv files
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>

        {uploadMutation.isPending && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Processing your data...</span>
              <span className="font-mono text-xs text-muted-foreground">parsing</span>
            </div>
            <Progress value={66} className="h-1" />
          </div>
        )}

        {uploadMutation.isError && (
          <div className="mt-6 flex items-start gap-3 p-4 rounded-md bg-destructive/10 text-sm" data-testid="text-upload-error">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-destructive">Upload failed</p>
              <p className="text-muted-foreground mt-1">{uploadMutation.error.message}</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-4">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="gap-2"
            data-testid="button-upload"
          >
            {uploadMutation.isPending ? "Processing..." : "Upload & Analyze"}
            {!uploadMutation.isPending && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>

        <div className="mt-10 p-4 rounded-md bg-card border border-card-border">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">How to export your LinkedIn data:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to LinkedIn Settings & Privacy</li>
                <li>Click "Get a copy of your data"</li>
                <li>Select the data you want (Positions, Education, Skills, Connections)</li>
                <li>Download the ZIP file when ready</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
