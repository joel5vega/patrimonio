// src/lib/wallbitSnapshotClient.js

import {
  getFunctions,
  httpsCallable,
} from "firebase/functions";

const functions = getFunctions(
  undefined,
  "asia-east1",
);

const refreshWallbitSnapshotCallable =
  httpsCallable(
    functions,
    "refreshWallbitSnapshotOnDemand",
  );

function normalizeCallableError(error) {
  const message =
    error?.details ||
    error?.message ||
    "No se pudo actualizar Wallbit.";

  return new Error(message);
}

export async function refreshWallbitSnapshot({
  slot = "manual",
} = {}) {
  try {
    const response =
      await refreshWallbitSnapshotCallable({
        slot,
      });
    // console.log(
    //   "refreshWallbitSnapshot response:",
    //   response,
    // );
    return response.data;
  } catch (error) {
    throw normalizeCallableError(error);
  }
}