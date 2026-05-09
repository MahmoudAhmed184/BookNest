import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { useAuth } from "./useAuth";
import { routePaths } from "../../../routes/paths";
import { createProfile, register } from "../services/authService";
import type { RegisterPayload } from "../types/auth";
import { authKeys } from "./auth.keys";

interface UseRegisterMutationResult {
  isPending: boolean;
  isError: boolean;
  errorMessage: string | null;
  submitRegister: (values: RegisterPayload) => Promise<void>;
}

const registerErrorFallback = "We couldn't create your account. Check your details.";

function getRegisterErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return registerErrorFallback;
}

export function useRegisterMutation(): UseRegisterMutationResult {
  const { userLogin } = useAuth();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationKey: authKeys.register(),
    mutationFn: async (values: RegisterPayload) => {
      const data = await register(values);

      if (data.access) {
        await createProfile({ handle: values.handle.trim() }, data.access);
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.access) {
        toast.success("Account created. Welcome to BookNest.");
        userLogin(data.user, data.access, data.refresh);
        navigate(routePaths.explore);
      } else {
        toast.error("Couldn't create your account. Try again.");
      }
    },
    onError: (error) => {
      toast.error(getRegisterErrorMessage(error));
    },
  });

  return {
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage: mutation.isError
      ? getRegisterErrorMessage(mutation.error)
      : null,
    submitRegister: async (values) => {
      await mutation.mutateAsync(values);
    },
  };
}
