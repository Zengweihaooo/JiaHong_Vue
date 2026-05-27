import { getRealtimeSnapshot } from "../../infrastructure/api/appApi.js";
import { buildWaitingQueueFromRecords } from "../../domain/consultationQueue.js";
import { getNextOngoingVideoConsultationRecord } from "../../domain/consultationQueue.js";
import { addConsultationRecord, consultationRecords } from "../state/dataStore.js";
import {
  activeVideoConsultationState,
  registerConsultationMachine,
  setDoctorStatus,
  setActiveVideoConsultation,
  setWaitingQueue
} from "../state/runtimeState.js";

export async function refreshRealtimeState() {
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
