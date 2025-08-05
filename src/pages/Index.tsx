import { useState, useEffect } from "react";
import { FileUpload } from "../components/FileUpload";
import { ModelViewer } from "../components/ModelViewer";
import { toast } from "sonner";

export const Index = () => {
  const [model, setModel] = useState<{ url: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (file: File, name: string) => {
    setIsLoading(true);
    try {
      const url = URL.createObjectURL(file);
      console.log("Index: Setting model:", { url, name });
      setModel({ url, name });
    } catch (error) {
      console.error("Index: Error creating URL:", error);
      toast.error("Failed to process file");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (model?.url) {
        console.log("Index: Revoking URL:", model.url);
        URL.revokeObjectURL(model.url);
      }
    };
  }, [model]);

  return (
    <div className="w-full h-screen flex flex-row">
      <div className="w-1/4 p-4">
        <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
      </div>
      <div className="w-3/4 flex-1">
        <ModelViewer
          modelUrl={model?.url || null}
          modelName={model?.name || null}
          wireframe={false}
          environmentPreset="studio"
        />
      </div>
    </div>
  );
};

export default Index;
