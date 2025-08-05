import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FileUploadProps {
  onFileUpload: (file: File, name: string) => void;
  isLoading: boolean;
}

export const FileUpload = ({ onFileUpload, isLoading }: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      if (fileExtension === 'glb' || fileExtension === 'gltf' || fileExtension === 'stl') {
        console.log("FileUpload: Uploading file:", { name: file.name, type: fileExtension });
        onFileUpload(file, file.name);
        toast.success("Model uploaded successfully!");
      } else {
        console.warn("FileUpload: Invalid file type:", fileExtension);
        toast.error("Please upload a .glb, .gltf, or .stl file");
      }
    } else {
      console.warn("FileUpload: No file selected");
      toast.error("No file selected");
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf'],
      'application/octet-stream': ['.stl'],
      'model/stl': ['.stl']
    },
    multiple: false,
    disabled: isLoading
  });

  return (
    <Card className="p-6">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {isDragActive ? "Drop your 3D model here" : "Upload 3D Model"}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag & drop your .glb, .gltf, or .stl file here, or click to browse
            </p>
            <Button variant="outline" disabled={isLoading}>
              {isLoading ? "Loading..." : "Choose File"}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Supported formats: .glb, .gltf, .stl
          </div>
        </div>
      </div>
    </Card>
  );
};
