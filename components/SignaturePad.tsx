"use client";

import { useRef, useState, useEffect } from "react";

export default function SignaturePad({
  onConfirm,
  onCancel,
}: {
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  }

  function confirm() {
    if (isEmpty) return;
    onConfirm(canvasRef.current!.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-md">
        <h3 className="font-bold text-center mb-2">Votre signature</h3>
        <canvas
          ref={canvasRef}
          width={400}
          height={180}
          className="border border-gray-300 rounded w-full touch-none bg-gray-50"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        <div className="flex justify-between mt-3 gap-2">
          <button onClick={clear} className="text-sm text-gray-500 hover:underline">
            Effacer
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={confirm}
              disabled={isEmpty}
              className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
            >
              Valider mon étape et transmettre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}