import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileArchive, FileText, CheckCircle2, AlertCircle, ArrowRight, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

const exportSteps = [
  {
    number: "01",
    title: "open linkedin settings",
    description: "click your profile picture in the top right, then select \"settings & privacy\" from the dropdown menu.",
  },
  {
    number: "02",
    title: "navigate to data privacy",
    description: "in the left sidebar, click \"data privacy\". then find and click \"get a copy of your data\".",
  },
  {
    number: "03",
    title: "select your data",
    description: "choose \"want something in particular?\" and check the boxes for: positions, education, skills, and connections. these are the data points we analyze.",
  },
  {
    number: "04",
    title: "request the archive",
    description: "click \"request archive\". linkedin will prepare your data — this usually takes a few minutes, but can take up to 24 hours.",
  },
  {
    number: "05",
    title: "download & upload",
    description: "you'll receive an email when it's ready. download the .zip file from linkedin, then drag it into the upload area above.",
  },
];

export default function UploadPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [guideExpanded, setGuideExpanded] = useState(false);

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
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="text-xs text-muted-foreground tracking-widest uppercase mb-3">step 1</div>
        <h1 className="text-lg font-medium mb-2" data-testid="text-upload-title">upload linkedin data</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          upload your official linkedin data export to begin analysis. don't have it yet?{" "}
          <button
            onClick={() => setGuideExpanded(!guideExpanded)}
            className="text-foreground underline underline-offset-2 hover:no-underline transition-colors"
            data-testid="button-toggle-guide"
          >
            follow our guide below
          </button>.
        </p>
      </div>

      <div
        className={`relative p-10 border border-dashed rounded transition-colors cursor-pointer ${
          dragActive ? "border-foreground bg-secondary/30" : "border-border"
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
              <div className="mb-4">
                {isZip ? <FileArchive className="w-5 h-5 text-muted-foreground" /> : <FileText className="w-5 h-5 text-muted-foreground" />}
              </div>
              <p className="text-sm font-medium mb-1" data-testid="text-file-name">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
                {isZip && " · zip archive"}
                {isCsv && " · csv file"}
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-[hsl(var(--ca-positive))]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ready to upload</span>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-muted-foreground mb-4" />
              <p className="text-sm mb-1">drop your linkedin export here</p>
              <p className="text-xs text-muted-foreground">
                or click to browse · .zip or .csv
              </p>
            </>
          )}
        </div>
      </div>

      {uploadMutation.isPending && (
        <div className="mt-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 border border-foreground/30 border-t-foreground rounded-full animate-spin" />
            <span>processing your data...</span>
          </div>
        </div>
      )}

      {uploadMutation.isError && (
        <div className="mt-6 flex items-start gap-3 p-4 rounded border border-[hsl(var(--ca-negative)/0.3)] text-xs" data-testid="text-upload-error">
          <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--ca-negative))] mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-[hsl(var(--ca-negative))]">upload failed</p>
            <p className="text-muted-foreground mt-1">{uploadMutation.error.message}</p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          className="gap-2 text-xs tracking-wide"
          data-testid="button-upload"
        >
          {uploadMutation.isPending ? "processing..." : "upload & analyze"}
          {!uploadMutation.isPending && <ArrowRight className="w-3.5 h-3.5" />}
        </Button>
      </div>

      <div className="mt-10" data-testid="section-export-guide">
        <button
          onClick={() => setGuideExpanded(!guideExpanded)}
          className="w-full flex items-center justify-between p-4 rounded border border-border/60 hover:border-border transition-colors text-left"
          data-testid="button-expand-guide"
        >
          <div>
            <p className="text-xs font-medium text-foreground">how to export your linkedin data</p>
            <p className="text-xs text-muted-foreground mt-0.5">step-by-step guide · takes about 2 minutes</p>
          </div>
          {guideExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </button>

        {guideExpanded && (
          <div className="mt-3 space-y-0" data-testid="guide-steps">
            {exportSteps.map((step, index) => (
              <div
                key={step.number}
                className="flex gap-4 p-4 border-x border-b border-border/60 first:border-t first:rounded-t last:rounded-b"
                data-testid={`guide-step-${index + 1}`}
              >
                <span className="text-xs text-muted-foreground/50 font-medium pt-0.5 shrink-0">{step.number}</span>
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}

            <div className="mt-4 flex items-center gap-4">
              <a
                href="https://www.linkedin.com/mypreferences/d/download-my-data"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-foreground underline underline-offset-2 hover:no-underline transition-colors"
                data-testid="link-linkedin-settings"
              >
                go to linkedin data export
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-xs text-muted-foreground">· opens in a new tab</span>
            </div>

            <div className="mt-4 p-3 rounded border border-border/40 bg-secondary/20">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">tip:</span> for the most complete analysis, select all available data categories when requesting your export. the more data points we have, the more accurate your career alpha score will be.
              </p>
            </div>

            <div className="mt-3 p-3 rounded border border-border/40 bg-secondary/20">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">privacy:</span> your data is processed securely and only used to compute your career alpha score. we don't share or store raw linkedin data beyond what's needed for analysis.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
