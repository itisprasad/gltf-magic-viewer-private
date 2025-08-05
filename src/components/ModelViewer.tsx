import { useRef, useState, Suspense, useMemo, useEffect, Component } from "react";
import { Canvas, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls, useGLTF, PerspectiveCamera, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Mesh } from "three";
import { toast } from "sonner";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

interface ModelProps {
  url: string;
  name: string;
  wireframe: boolean;
  clippingEnabled: boolean;
  clippingPlanes: THREE.Plane[];
  highlightEnabled: boolean;
}

function GLBModel({ url, wireframe, clippingEnabled, clippingPlanes, highlightEnabled }: ModelProps) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<Mesh>(null);
  const { camera, gl } = useThree();

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const clickableMeshes = useRef<THREE.Mesh[]>([]);
  const [selected, setSelected] = useState<THREE.Mesh | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!highlightEnabled) return;

      const bounds = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouse.current.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(clickableMeshes.current, true);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;

        if (selected && selected !== mesh) {
          const prevMat = selected.material as THREE.MeshStandardMaterial;
          const origColor = selected.userData.originalColor;
          if (origColor) prevMat.color.setHex(origColor);
        }

        if (!mesh.userData.originalColor) {
          mesh.userData.originalColor = (mesh.material as THREE.MeshStandardMaterial).color.getHex();
        }

        (mesh.material as THREE.MeshStandardMaterial).color.set(0xff0000); // Standard red highlight
        setSelected(mesh);
        console.log("GLBModel: Highlighted mesh:", { meshName: mesh.name, color: "red" });
      }
    };

    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [highlightEnabled, camera, gl, selected]);

  useEffect(() => {
    if (!highlightEnabled && selected) {
      const mat = selected.material as THREE.MeshStandardMaterial;
      const originalColor = selected.userData.originalColor;
      if (originalColor) mat.color.setHex(originalColor);
      setSelected(null);
      console.log("GLBModel: Highlight reset");
    }
  }, [highlightEnabled, selected]);

  useEffect(() => {
    clickableMeshes.current = [];
    scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = child.material.clone();
        if (!child.userData.originalColor) {
          child.userData.originalColor = (child.material as THREE.MeshStandardMaterial).color.getHex();
        }
        child.material.wireframe = wireframe;
        child.material.clippingPlanes = clippingEnabled ? clippingPlanes : [];
        child.material.clipShadows = clippingEnabled;
        child.material.needsUpdate = true;
        clickableMeshes.current.push(child);
      }
    });
  }, [scene, wireframe, clippingEnabled, clippingPlanes]);

  return <primitive object={scene} ref={meshRef} />;
}

function STLModel({ url, wireframe, clippingEnabled, clippingPlanes, highlightEnabled }: ModelProps) {
  const geometry = useLoader(STLLoader, url, undefined, (error) => {
    toast.error("Failed to load STL model");
    console.error("STL loading error:", error);
  });
  const meshRef = useRef<Mesh>(null);
  const { camera, gl } = useThree();

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const [selected, setSelected] = useState<THREE.Mesh | null>(null);

  useEffect(() => {
    if (meshRef.current && geometry) {
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!;
      const center = box.getCenter(new THREE.Vector3());
      geometry.translate(-center.x, -center.y, -center.z);

      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (!meshRef.current.userData.originalColor) {
        meshRef.current.userData.originalColor = material.color.getHex();
      }
      material.wireframe = wireframe;
      material.clippingPlanes = clippingEnabled ? clippingPlanes : [];
      material.clipShadows = clippingEnabled;
      material.needsUpdate = true;
    }
  }, [geometry, wireframe, clippingEnabled, clippingPlanes]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!highlightEnabled || !meshRef.current) return;

      const bounds = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouse.current.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObject(meshRef.current, true);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;

        if (selected && selected !== mesh) {
          const prevMat = selected.material as THREE.MeshStandardMaterial;
          const origColor = selected.userData.originalColor;
          if (origColor) prevMat.color.setHex(origColor);
        }

        if (!mesh.userData.originalColor) {
          mesh.userData.originalColor = (mesh.material as THREE.MeshStandardMaterial).color.getHex();
        }

        (mesh.material as THREE.MeshStandardMaterial).color.set(0xff0000); // Standard red highlight
        setSelected(mesh);
        console.log("STLModel: Highlighted mesh:", { meshName: mesh.name, color: "red" });
      }
    };

    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [highlightEnabled, camera, gl, selected]);

  useEffect(() => {
    if (!highlightEnabled && selected) {
      const mat = selected.material as THREE.MeshStandardMaterial;
      const originalColor = selected.userData.originalColor;
      if (originalColor) mat.color.setHex(originalColor);
      setSelected(null);
      console.log("STLModel: Highlight reset");
    }
  }, [highlightEnabled, selected]);

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={0x808080}
        wireframe={wireframe}
        clippingPlanes={clippingEnabled ? clippingPlanes : []}
        clipShadows={clippingEnabled}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

class ModelErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ModelErrorBoundary caught error:", error);
    toast.error("Failed to load model. Please ensure the file is a valid .glb, .gltf, or .stl.");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">Error loading model. Please try another file.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function Model({ url, name, wireframe, clippingEnabled, clippingPlanes, highlightEnabled }: ModelProps) {
  const [isSTL, setIsSTL] = useState(name.toLowerCase().endsWith(".stl"));
  const [isLoadingType, setIsLoadingType] = useState(false);

  useEffect(() => {
    console.log("Model: Initializing with:", { url, name });
    // Reset state for new file
    setIsSTL(name.toLowerCase().endsWith(".stl"));
    setIsLoadingType(name === "unknown");

    if (name === "unknown") {
      console.log("Model: Checking file type for:", { url, name });
      const loader = new STLLoader();
      loader.load(
        url,
        () => {
          console.log("Model: Confirmed STL file");
          setIsSTL(true);
          setIsLoadingType(false);
        },
        undefined,
        (error) => {
          console.log("Model: Not an STL file, attempting GLTF", error);
          setIsSTL(false);
          setIsLoadingType(false);
        }
      );
    }
  }, [url, name]); // Run on url or name change

  console.log("Model component:", { url, name, isSTL, isLoadingType });

  if (isLoadingType) {
    return null; // Wait for file type detection
  }

  return (
    <ModelErrorBoundary>
      {isSTL ? (
        <STLModel
          url={url}
          name={name}
          wireframe={wireframe}
          clippingEnabled={clippingEnabled}
          clippingPlanes={clippingPlanes}
          highlightEnabled={highlightEnabled}
        />
      ) : (
        <GLBModel
          url={url}
          name={name}
          wireframe={wireframe}
          clippingEnabled={clippingEnabled}
          clippingPlanes={clippingPlanes}
          highlightEnabled={highlightEnabled}
        />
      )}
    </ModelErrorBoundary>
  );
}

interface ModelViewerProps {
  modelUrl: string | null;
  wireframe: boolean;
  environmentPreset: "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment" | "studio" | "city" | "park" | "lobby";
  modelName: string | null;
}

export const ModelViewer = ({ modelUrl, wireframe, environmentPreset, modelName }: ModelViewerProps) => {
  const controlsRef = useRef<any>(null);
  const [clippingEnabled, setClippingEnabled] = useState(false);
  const [clippingAxis, setClippingAxis] = useState<"x" | "y" | "z">("x");
  const [planeConstant, setPlaneConstant] = useState(0);
  const [highlightEnabled, setHighlightEnabled] = useState(false);

  const clippingPlanes = useMemo(() => {
    const axis = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[clippingAxis];
    return [new THREE.Plane(new THREE.Vector3(...axis), planeConstant)];
  }, [clippingAxis, planeConstant]);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      toast("Camera position reset!");
    }
  };

  useEffect(() => {
    console.log("ModelViewer props:", { modelUrl, modelName });
    if (!modelUrl) {
      console.warn("ModelViewer: modelUrl is null");
      toast.info("Please upload a 3D model to view");
    }
    if (!modelName) {
      console.warn("ModelViewer: modelName is null, attempting to detect file type");
    }
  }, [modelUrl, modelName]);

  useEffect(() => {
    return () => {
      if (modelUrl) {
        console.log("ModelViewer: Revoking URL:", modelUrl);
        URL.revokeObjectURL(modelUrl);
      }
    };
  }, [modelUrl]);

  return (
    <div className="relative w-full h-full bg-canvas-bg rounded-lg overflow-hidden">
      <Canvas shadows gl={{ localClippingEnabled: true, preserveDrawingBuffer: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <Environment preset={environmentPreset} />
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          dampingFactor={0.05}
          enableDamping={true}
        />
        {modelUrl && (
          <Suspense
            fallback={
              <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#666" wireframe />
              </mesh>
            }
          >
            <Model
              key={modelUrl} // Force remount on URL change
              url={modelUrl}
              name={modelName || "unknown"}
              wireframe={wireframe}
              clippingEnabled={clippingEnabled}
              clippingPlanes={clippingPlanes}
              highlightEnabled={highlightEnabled}
            />
          </Suspense>
        )}
      </Canvas>

      <div className="absolute top-4 left-4 bg-card p-4 rounded-lg shadow space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={highlightEnabled}
            onChange={(e) => setHighlightEnabled(e.target.checked)}
          />
          Enable Click Highlight
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={clippingEnabled}
            onChange={(e) => setClippingEnabled(e.target.checked)}
          />
          Enable Cross-Section
        </label>

        {clippingEnabled && (
          <>
            <label className="text-sm">
              Axis:
              <select
                value={clippingAxis}
                onChange={(e) => setClippingAxis(e.target.value as "x" | "y" | "z")}
                className="ml-2 p-1 rounded border text-sm bg-black text-white"
              >
                <option value="x">X</option>
                <option value="y">Y</option>
                <option value="z">Z</option>
              </select>
            </label>

            <label className="text-sm block">
              Position:
              <input
                type="range"
                min={-5}
                max={5}
                step={0.1}
                value={planeConstant}
                onChange={(e) => setPlaneConstant(parseFloat(e.target.value))}
                className="w-full"
              />
            </label>
          </>
        )}
      </div>

      <button
        onClick={resetCamera}
        className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-3 py-2 rounded-md 
                   hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
      >
        Reset Camera
      </button>

      {!modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <p className="text-muted-foreground">Upload a 3D model to get started</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelViewer;
