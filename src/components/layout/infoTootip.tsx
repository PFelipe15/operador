import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export const TooltipComponent = ({ text }: { text: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <Info />
      </TooltipTrigger>

      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
