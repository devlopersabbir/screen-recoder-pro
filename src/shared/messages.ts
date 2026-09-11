import { RecordingState } from "../recorder/types";

export type MessageType =
  | "SRP_START_RECORDING"
  | "SRP_STOP_RECORDING"
  | "SRP_PAUSE_RECORDING"
  | "SRP_RESUME_RECORDING"
  | "SRP_CANCEL_RECORDING"
  | "SRP_STATE_UPDATE"
  | "SRP_GET_STATE"
  | "SRP_TOGGLE_WIDGET";

export interface BaseMessage {
  type: MessageType;
}

export interface ToggleWidgetMessage extends BaseMessage {
  type: "SRP_TOGGLE_WIDGET";
}

export interface StartRecordingMessage extends BaseMessage {
  type: "SRP_START_RECORDING";
  options?: {
    audio?: boolean;
  };
}

export interface StopRecordingMessage extends BaseMessage {
  type: "SRP_STOP_RECORDING";
}

export interface PauseRecordingMessage extends BaseMessage {
  type: "SRP_PAUSE_RECORDING";
}

export interface ResumeRecordingMessage extends BaseMessage {
  type: "SRP_RESUME_RECORDING";
}

export interface CancelRecordingMessage extends BaseMessage {
  type: "SRP_CANCEL_RECORDING";
}

export interface GetStateMessage extends BaseMessage {
  type: "SRP_GET_STATE";
}

export interface StateUpdateMessage extends BaseMessage {
  type: "SRP_STATE_UPDATE";
  state: RecordingState;
  durationMs: number;
  isPaused: boolean;
  startedAt?: number;
}

export type ExtensionMessage =
  | StartRecordingMessage
  | StopRecordingMessage
  | PauseRecordingMessage
  | ResumeRecordingMessage
  | CancelRecordingMessage
  | GetStateMessage
  | StateUpdateMessage
  | ToggleWidgetMessage;
