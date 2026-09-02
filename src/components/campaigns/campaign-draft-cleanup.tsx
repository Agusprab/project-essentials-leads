"use client";

import { useEffect } from "react";

const draftStorageKey = "lead-dashboard:create-campaign-draft";
const campaignMediaDatabaseName = "lead-dashboard-campaign-media";
const campaignMediaStoreName = "attachments";
const campaignMediaKey = "new-campaign";

export function CampaignDraftCleanup() {
  useEffect(() => {
    window.localStorage.removeItem(draftStorageKey);
    void clearPersistedMedia();
  }, []);

  return null;
}

async function clearPersistedMedia(): Promise<void> {
  const database = await openCampaignMediaDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(campaignMediaStoreName, "readwrite");
    const store = transaction.objectStore(campaignMediaStoreName);
    const request = store.delete(campaignMediaKey);

    request.addEventListener("success", () => resolve());
    request.addEventListener("error", () => reject(request.error));
  });
}

function openCampaignMediaDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(campaignMediaDatabaseName, 1);

    request.addEventListener("upgradeneeded", () => {
      request.result.createObjectStore(campaignMediaStoreName);
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}
