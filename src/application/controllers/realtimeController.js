import { getRealtimeSnapshot } from "../../infrastructure/api/appApi.js";
import { buildWaitingQueueFromRecords } from "../../domain/consultationQueue.js";
import { getNextOngoingVideoConsultationRecord } from "../../domain/consultationQueue.js";
import { addConsultationRecord, consultationRecords } from "../state/dataStore.js";
import {
  activeVideoConsultationState,
  isWaitingQueueManuallyCleared,
  registerConsultationMachine,
  setDoctorStatus,
  setActiveVideoConsultation,
  setWaitingQueue,
  waitingQueueState
} from "../state/runtimeState.js?v=20260528-06";

export async function refreshRealtimeState() {
  if (isWaitingQueueManuallyCleared()) {
    return {
      waitingQueue: waitingQueueState,
      newConsultation: null,
      addedConsultation: null
    };
  }

  const snapshot = await getRealtimeSnapshot();
  let addedConsultation = null;

  if (snapshot.newConsultation) {
    const added = addConsultationRecord(snapshot.newConsultation.record, snapshot.newConsultation.chat);
    if (added) {
      registerConsultationMachine(snapshot.newConsultation.record);
      addedConsultation = snapshot.newConsultation;
      if (!activeVideoConsultationState.recordId) {
        const nextVideoRecord = getNextOngoingVideoConsultationRecord(consultationRecords);
        if (nextVideoRecord) {
          setActiveVideoConsultation(nextVideoRecord.id, { silent: true });
        }
      }
    }
  }

  setWaitingQueue(buildWaitingQueueFromRecords(consultationRecords));

  if (snapshot.doctorStatus) {
    setDoctorStatus(snapshot.doctorStatus);
  }

  return {
    ...snapshot,
    addedConsultation
  };
}
