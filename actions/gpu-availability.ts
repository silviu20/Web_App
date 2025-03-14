"use server"

// actions/gpu-availability.ts
import { checkAPIHealth } from "@/actions/optimization-actions";

/**
 * Checks if GPU is available for optimizations
 */
export async function checkGPUAvailability(): Promise<{ isAvailable: boolean }> {
  try {
    const healthCheck = await checkAPIHealth();
    return {
      isAvailable: healthCheck.isSuccess && healthCheck.data?.using_gpu
    };
  } catch (error) {
    console.error("Error checking GPU availability:", error);
    return { isAvailable: false };
  }
}