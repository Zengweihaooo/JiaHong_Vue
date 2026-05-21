import { getRealtimeSnapshot } from "../../infrastructure/api/appApi.js";
import { buildWaitingQueueFromRecords } from "../../domain/consultationQueue.js";
import { addConsultationRecord, consultationRecords } from "../state/dataStore.js";
import {
  registerConsultationMachine,
  setDoctorStatus,
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
