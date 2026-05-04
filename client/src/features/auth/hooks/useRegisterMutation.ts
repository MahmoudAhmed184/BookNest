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
  submitRegister: (values: RegisterPayload) => Promise<void>;
}

export function useRegisterMutation(): UseRegisterMutationResult {
  const { userLogin } = useAuth();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationKey: authKeys.register(),
    mutationFn: register,
    onSuccess: async (data) => {
      if (data.access) {
        toast.success("Account created. Welcome to BookNest.");
        userLogin(null, data.access);
        await createProfile();
        navigate(routePaths.explore);
      } else {
        toast.error("Couldn't create your account. Try again.");
      }
    },
    onError: () => {
      toast.error("Couldn't create your account. Check your details.");
    },
  });

  return {
    isPending: mutation.isPending,
    isError: mutation.isError,
    submitRegister: async (values) => {
      await mutation.mutateAsync(values);
    },
  };
}
