import { useCallback, useSyncExternalStore } from "react";
import { recorderService } from "../recorder/RecorderService";
import { RecorderOptions } from "../recorder/types";
import { downloadBlob } from "../utils/download";

export function useRecorder() {
  const { state, result, error } = useSyncExternalStore(
    recorderService.subscribe,
    recorderService.getSnapshot
  );

  const startRecording = useCallback(async (options?: RecorderOptions) => {
    await recorderService.startRecording(options);
  }, []);

  const stopRecording = useCallback(() => {
    recorderService.stopRecording();
  }, []);

  const pauseRecording = useCallback(() => {
    recorderService.pauseRecording();
  }, []);

  const resumeRecording = useCallback(() => {
    recorderService.resumeRecording();
  }, []);

  const cancelRecording = useCallback(() => {
    recorderService.cancelRecording();
  }, []);

  const downloadRecording = useCallback(() => {
    if (result) {
      downloadBlob(result.blob, result.filename);
    }
  }, [result]);

  const resetRecording = useCallback(() => {
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }
    recorderService.reset();
  }, [result]);

  return {
    state,
    result,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    stopRecording,
    downloadRecording,
    resetRecording,
    getStartTime: recorderService.getStartTime,
  };
}
