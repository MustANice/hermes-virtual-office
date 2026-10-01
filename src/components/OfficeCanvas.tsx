import React, { useEffect, useRef } from 'react';
import { OfficeEngine } from '../engine/OfficeEngine';
import { useOfficeStore } from '../store/useOfficeStore';
import { OfficeUpdatePayload } from '../types/office';

export const OfficeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<OfficeEngine | null>(null);

  const { 
    setOfficeData, 
    setSelectedAgentId, 
    selectedAgentId, 
    camera, 
    simSpeed, 
    setIsConnected, 
    setFps 
  } = useOfficeStore();

  // 1. Initialize Engine on Mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new OfficeEngine(canvasRef.current);
    engineRef.current = engine;

    engine.onSelectAgent = (agentId) => {
      setSelectedAgentId(agentId);
    };

    engine.onFpsUpdate = (fps) => {
      setFps(fps);
    };

    engine.start();

    return () => {
      engine.stop();
    };
  }, []);

  // 2. Sync Camera & SimSpeed changes from Store
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setCamera(camera.x, camera.y, camera.zoom);
    }
  }, [camera]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.simSpeed = simSpeed;
    }
  }, [simSpeed]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSelectedAgent(selectedAgentId);
    }
  }, [selectedAgentId]);

  // 3. Connect to Realtime SSE Stream (/api/stream)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        const streamUrl = `${window.location.origin}/api/stream`;
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          setIsConnected(true);
          if (pollInterval) clearInterval(pollInterval);
        };

        eventSource.onmessage = (event) => {
          try {
            const data: OfficeUpdatePayload = JSON.parse(event.data);
            setOfficeData(data);
            if (engineRef.current) {
              engineRef.current.updateAgentsData(data);
            }
          } catch (err) {
            console.error('[SSE Parse Error]:', err);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          // Fallback to polling /api/status every 2 seconds if SSE drops
          if (!pollInterval) {
            pollInterval = setInterval(fetchSnapshot, 2000);
          }
          // Retry SSE in 4 seconds
          setTimeout(connectSSE, 4000);
        };
      } catch (err) {
        console.error('[SSE Connection Error]:', err);
        pollInterval = setInterval(fetchSnapshot, 2000);
      }
    };

    const fetchSnapshot = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data: OfficeUpdatePayload = await res.json();
          setOfficeData(data);
          setIsConnected(true);
          if (engineRef.current) {
            engineRef.current.updateAgentsData(data);
          }
        }
      } catch (_) {
        setIsConnected(false);
      }
    };

    // Initial fetch
    fetchSnapshot();
    connectSSE();

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B0D11]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
