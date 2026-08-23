"use client";

import toast from "react-hot-toast";

export function showSuccessToast(message: string) {
  toast.success(message, {
    duration: 3000,
  });
}

export function showErrorToast(message: string) {
  toast.error(message, {
    duration: 4500,
  });
}

export function showLoadingToast(message: string) {
  return toast.loading(message);
}

export function dismissToast(toastId?: string) {
  if (toastId) {
    toast.dismiss(toastId);
    return;
  }
  toast.dismiss();
}
