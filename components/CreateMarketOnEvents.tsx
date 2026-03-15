"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import CreateMarketModal from "@/components/CreateMarketModal";

export function CreateMarketOnEvents() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="bg-[#0052ff] hover:bg-[#0046e0] text-white shrink-0"
        onClick={() => setOpen(true)}
      >
        Create Market
      </Button>
      <CreateMarketModal open={open} onOpenChange={setOpen} noTrigger />
    </>
  );
}
