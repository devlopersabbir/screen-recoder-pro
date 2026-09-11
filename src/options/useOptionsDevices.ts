import { useState, useEffect, useRef } from "react";
import { RecorderSettings } from "../utils/settings";

export const useOptionsDevices = (settings: RecorderSettings) => {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [hasUnlabeledDevices, setHasUnlabeledDevices] = useState(false);

  // Live Microphone Test State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const micTestRef = useRef<{ ctx: AudioContext; stream: MediaStream; animId: number } | null>(null);

  // Sound Output Test State
  const [isPlayingTestTone, setIsPlayingTestTone] = useState(false);

  const loadDevices = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === "audioinput");
        const outputs = devices.filter((d) => d.kind === "audiooutput");
        setAudioInputs(inputs);
        setAudioOutputs(outputs);
        const unlabeled = inputs.some((d) => !d.label) || outputs.some((d) => !d.label);
        setHasUnlabeledDevices(unlabeled);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadDevices();

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", loadDevices);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
      };
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  const requestDevicePermission = async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach((t) => t.stop());
        await loadDevices();
      }
    } catch {
      // ignore
    }
  };

  const startMicTest = async () => {
    if (isTestingMic) {
      stopMicTest();
      return;
    }
    try {
      const constraints =
        settings.micDeviceId && settings.micDeviceId !== "default"
          ? { deviceId: { ideal: settings.micDeviceId } }
          : true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsTestingMic(true);

      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicLevel(normalized);
        const id = requestAnimationFrame(checkLevel);
        if (micTestRef.current) {
          micTestRef.current.animId = id;
        }
      };

      const animId = requestAnimationFrame(checkLevel);
      micTestRef.current = { ctx, stream, animId };
    } catch {
      setIsTestingMic(false);
    }
  };

  const stopMicTest = () => {
    if (micTestRef.current) {
      cancelAnimationFrame(micTestRef.current.animId);
      micTestRef.current.stream.getTracks().forEach((t) => t.stop());
      try {
        micTestRef.current.ctx.close();
      } catch {
        // ignore
      }
      micTestRef.current = null;
    }
    setIsTestingMic(false);
    setMicLevel(0);
  };

  const playTestTone = async () => {
    if (isPlayingTestTone) return;
    setIsPlayingTestTone(true);
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();

      if (
        settings.audioOutputDeviceId &&
        settings.audioOutputDeviceId !== "default" &&
        typeof (audioCtx as any).setSinkId === "function"
      ) {
        try {
          await (audioCtx as any).setSinkId(settings.audioOutputDeviceId);
        } catch {
          // ignore
        }
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.55);

      setTimeout(() => {
        try {
          audioCtx.close();
        } catch {
          // ignore
        }
        setIsPlayingTestTone(false);
      }, 650);
    } catch {
      setIsPlayingTestTone(false);
    }
  };

  return {
    audioInputs,
    audioOutputs,
    hasUnlabeledDevices,
    isTestingMic,
    micLevel,
    isPlayingTestTone,
    requestDevicePermission,
    startMicTest,
    stopMicTest,
    playTestTone,
  };
};
