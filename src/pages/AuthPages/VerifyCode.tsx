import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { getErrorMessage, postJson } from "../../config/api";

type VerifyCodeResponse = {
  access?: string;
  refresh?: string;
  token?: string;
  access_token?: string;
  refresh_token?: string;
  data?: {
    access?: string;
    refresh?: string;
    token?: string;
    access_token?: string;
    refresh_token?: string;
    user?: unknown;
  };
};

export default function VerifyCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => code.trim().length > 0 && !loading, [code, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const email = localStorage.getItem("auth_email");

      const data = await postJson<VerifyCodeResponse>(
        "accounts/verify-code/",
        {
          code: code.trim(),
          ...(email ? { email } : {}),
        },
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const tokenPayload = data.data ?? data;
      const nextToken =
        tokenPayload.access ??
        tokenPayload.token ??
        tokenPayload.access_token ??
        null;
      const nextRefresh =
        tokenPayload.refresh ?? tokenPayload.refresh_token ?? null;

      if (nextToken) localStorage.setItem("auth_token", nextToken);
      if (nextRefresh) localStorage.setItem("auth_refresh", nextRefresh);
      const anyPayload = tokenPayload as any;
      if (anyPayload?.user) {
        localStorage.setItem("auth_user", JSON.stringify(anyPayload.user));
      }

      localStorage.setItem("auth_verified", "true");
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta title="Verify Code" description="Verify SMS code" />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <div className="mb-5 sm:mb-8">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                  SMS Code Check
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter the code we sent you.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      Code <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                    />
                  </div>

                  <div>
                    <Button className="w-full" size="sm" disabled={!canSubmit}>
                      {loading ? "Checking..." : "Verify"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}

