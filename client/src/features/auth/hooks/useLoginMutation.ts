import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

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

interface LoginRedirectState {
  from?: unknown;
}

function getSafeRedirectPath(state: unknown): string {
  const from = (state as LoginRedirectState | null)?.from;

  if (typeof from !== "string") {
    return routePaths.explore;
  }

  if (!from.startsWith("/") || from.startsWith("//")) {
    return routePaths.explore;
  }

  return from;
}

export function useLoginMutation(): UseLoginMutationResult {
  const { userLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = getSafeRedirectPath(location.state);
  const mutation = useMutation({
    mutationKey: authKeys.login(),
    mutationFn: login,
    onSuccess: (data) => {
      if (data.access) {
        toast.success("Signed in. Welcome back.");
        userLogin(data.user, data.access, data.refresh);
        navigate(redirectPath, { replace: true });
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
