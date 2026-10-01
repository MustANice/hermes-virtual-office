import React, { useEffect, useRef } from 'react';
import { RobloxOffice3D } from '../engine/RobloxOffice3D';
import { CHAIR_REGISTRY, reserveChair, releaseChair } from '../engine/ChairInteractionSystem';
import { useOfficeStore } from '../store/useOfficeStore';
import { OfficeUpdatePayload } from '../types/office';

export const RobloxCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RobloxOffice3D | null>(null);

  const {
    officeData,
    setOfficeData,
    setSelectedAgentId,
    selectedAgentId,
    activeRoomFilter,
    simSpeed,
    setIsConnected,
  } = useOfficeStore();

  // 1. Initialize 3D Roblox Engine on Mount
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new RobloxOffice3D(containerRef.current);
    engineRef.current = engine;
    (window as any).__THREE_RENDERER__ = engine.renderer;
    (window as any).__THREE_ENGINE__ = engine;
    (window as any).__CHAIR_REGISTRY__ = CHAIR_REGISTRY;
    (window as any).__RESERVE_CHAIR__ = reserveChair;
    (window as any).__RELEASE_CHAIR__ = releaseChair;

    engine.onSelectAgent = (agentId) => {
      setSelectedAgentId(agentId);
    };

    engine.start();

    return () => {
      engine.stop();
      if (containerRef.current && engine.renderer.domElement) {
        containerRef.current.removeChild(engine.renderer.domElement);
      }
      engine.renderer.dispose();
    };
  }, []);

  // 2. Room focus camera movement
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.focusRoom(activeRoomFilter);
    }
  }, [activeRoomFilter]);

  // 3. Sim Speed
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.simSpeed = simSpeed;
    }
  }, [simSpeed]);

  // 3b. Agent Selection Synchronization
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSelectedAgent(selectedAgentId);
    }
  }, [selectedAgentId]);

  // 3c. Synchronize officeData immediately when engine or officeData changes
  useEffect(() => {
    if (engineRef.current && officeData) {
      engineRef.current.updateAgentsData(officeData);
    }
  }, [officeData]);

  // 4. SSE Stream connection
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
          if (!pollInterval) {
            pollInterval = setInterval(fetchSnapshot, 2000);
          }
          setTimeout(connectSSE, 4000);
        };
      } catch (err) {
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

    fetchSnapshot();
    connectSSE();

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-[#0A0D14] touch-none select-none"
    />
  );
};
