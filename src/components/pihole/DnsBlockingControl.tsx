import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEffect, useState, useRef } from "react";
import { Spinner } from "../ui/spinner";
import { Item, ItemContent, ItemMedia, ItemTitle } from "../ui/item";
import { ShieldCheckIcon, ShieldCloseIcon, LoaderIcon } from "lucide-react";

export const DnsBlockingControl = () => {
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockingPeriodInMins, setBlockingPeriodInMins] = useState<number>(5);
  const [loadingState, setLoadingState] = useState<
    "LOADING" | "SUCCESS" | "ERROR"
  >("LOADING");
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBlockingStatus = async () => {
    const res = await fetch("/api/dns/blocking");

    if (!res.ok) {
      setLoadingState("ERROR");
      console.error("Could not fetch DNS blocking status");
      return;
    }

    const body = await res.json();

    if (!body) {
      console.error("Response body is empty");
      return;
    }

    if (body.blocking === "failed" || body.blocking === "unknown") {
      console.error("Failed to fetch DNS blocking status");
      return;
    }

    setIsBlocking(body.blocking === "enabled");
    setTimerRemaining(body.timer !== null ? Math.ceil(body.timer) : null);

    if (body.blocking === "enabled" && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (body.blocking === "disabled" && body.timer && body.timer > 0) {
      startTimer(Math.ceil(body.timer));
    }
  };

  const enableBlocking = async (): Promise<void> => {
    setLoadingState("LOADING");

    try {
      const payload = {
        blocking: true,
        timer: null,
      };

      const res = await fetch("/api/dns/blocking", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setLoadingState("ERROR");
        return;
      }

      const body = await res.json();
      setIsBlocking(body.blocking === "enabled");
      setTimerRemaining(body.timer);
      setLoadingState("SUCCESS");
    } catch (err) {
      setLoadingState("ERROR");
    }
  };

  const disableBlocking = async (): Promise<void> => {
    setLoadingState("LOADING");

    try {
      const payload = {
        blocking: false,
        timer: blockingPeriodInMins * 60,
      };

      const res = await fetch("/api/dns/blocking", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setLoadingState("ERROR");
        return;
      }

      const body = await res.json();
      setIsBlocking(body.blocking === "enabled");
      setTimerRemaining(body.timer !== null ? Math.ceil(body.timer) : null);
      setLoadingState("SUCCESS");

      if (body.blocking === "disabled" && body.timer && body.timer > 0) {
        startTimer(Math.ceil(body.timer));
      }
    } catch (err) {
      setLoadingState("ERROR");
    }
  };

  const startTimer = (initialTime: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTimerRemaining(initialTime);

    timerRef.current = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev === null || prev <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          fetchBlockingStatus();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    (async () => {
      setLoadingState("LOADING");
      await fetchBlockingStatus();
      setLoadingState("SUCCESS");
    })();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-center flex-col gap-4">
      <h2 className="text-lg font-semibold">DNS Blocking</h2>

      <div className="flex items-center justify-center flex-row gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          value={blockingPeriodInMins.toString()}
          onValueChange={(value) => setBlockingPeriodInMins(parseInt(value))}
        >
          <ToggleGroupItem value="1">1m</ToggleGroupItem>
          <ToggleGroupItem value="5">5m</ToggleGroupItem>
          <ToggleGroupItem value="15">15m</ToggleGroupItem>
          <ToggleGroupItem value="60">1h</ToggleGroupItem>
        </ToggleGroup>
        <Button
          variant="default"
          onClick={enableBlocking}
          disabled={loadingState === "LOADING"}
          className="bg-green-600 hover:bg-green-700"
        >
          {loadingState === "LOADING" ? <Spinner /> : null} Enable
        </Button>
        <Button
          variant="destructive"
          onClick={disableBlocking}
          disabled={loadingState === "LOADING"}
        >
          {loadingState === "LOADING" ? <Spinner /> : null} Disable
        </Button>
      </div>

      <Item
        className={
          loadingState === "LOADING"
            ? "bg-muted/50"
            : isBlocking
              ? "bg-green-500/20"
              : "bg-red-500/20"
        }
      >
        <ItemMedia>
          {loadingState === "LOADING" ? (
            <LoaderIcon size="16" className="animate-spin" />
          ) : isBlocking ? (
            <ShieldCheckIcon size="16" />
          ) : (
            <ShieldCloseIcon size="16" />
          )}
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            {loadingState === "LOADING"
              ? "Loading..."
              : `Blocking ${isBlocking ? "enabled" : "disabled"}${!isBlocking && timerRemaining !== null && timerRemaining > 0 ? ` (${formatTime(timerRemaining)})` : ""}`}
          </ItemTitle>
        </ItemContent>
      </Item>
    </div>
  );
};
