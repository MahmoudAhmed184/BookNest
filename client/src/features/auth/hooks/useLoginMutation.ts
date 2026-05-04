import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { useAuth } from "./useAuth";
import { routePaths } from "../../../routes/paths";
import { login } from "../services/authService";
import type { LoginPayload } from "../types/auth";
import { authKeys } from "./auth.keys";

interface UseLoginMutationResult {
  isPending: boolean;
  isError: boolean;
  submitLogin: (values: LoginPayload) => Promise<void>;
}

export function useLoginMutation(): UseLoginMutationResult {
  const { userLogin } = useAuth();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationKey: authKeys.login(),
    mutationFn: login,
    onSuccess: (data) => {
      if (data.access) {
        toast.success("Signed in. Welcome back.");
        userLogin(null, data.access);
        navigate(routePaths.explore);
      } else {
        toast.error("Couldn't sign in. Try again.");
      }
    },
    onError: () => {
      toast.error("Couldn't sign in. Check your details.");
    },
  });

  return {
    isPending: mutation.isPending,
    isError: mutation.isError,
    submitLogin: async (values) => {
      await mutation.mutateAsync(values);
    },
  };
}
