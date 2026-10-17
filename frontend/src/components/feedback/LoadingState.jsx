import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading road hazards..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-[#667784]">
      <Loader2 className="w-8 h-8 animate-spin text-[#087F8C] mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default LoadingState;
