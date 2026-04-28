import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import {
  getAuthHeaders,
  getErrorMessage,
  putFormData,
  putJson,
} from "../../config/api";
import type { Me } from "../../pages/UserProfiles";
import { useMemo, useRef, useState } from "react";

export default function UserMetaCard({
  me,
  onUpdated,
}: {
  me: Me | null;
  onUpdated: () => void;
}) {
  const { isOpen, closeModal } = useModal();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const displayName = useMemo(() => {
    const full = (me?.full_name ?? "").toString().trim();
    return full || (me?.username as string) || (me?.email as string) || "User";
  }, [me]);

  const avatarUrlRaw = (me?.avatar as string | undefined) ?? "/images/user/owner.jpg";
  const avatarUrl = useMemo(() => {
    if (!avatarUrlRaw) return "/images/user/owner.jpg";
    // cache-bust so the new uploaded image shows immediately
    const v = (me?.updated_at as string | undefined) ?? Date.now().toString();
    return avatarUrlRaw.includes("?") ? `${avatarUrlRaw}&v=${encodeURIComponent(v)}` : `${avatarUrlRaw}?v=${encodeURIComponent(v)}`;
  }, [avatarUrlRaw, me?.updated_at]);

  async function handleSaveBasic() {
    setError(null);
    setSaving(true);
    try {
      await putJson<unknown>(
        "accounts/me/",
        {
          full_name: `${firstName} ${lastName}`.trim(),
          phone_number: phone.trim(),
        },
        { headers: getAuthHeaders() }
      );
      closeModal();
      onUpdated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadAvatar(file?: File | null) {
    const f = file ?? avatarFile;
    if (!f) return;
    setError(null);
    setSaving(true);
    try {
      const fd = new FormData();
      // backend naming can differ; sending both is usually safe
      fd.append("avatar", f);
      fd.append("file", f);
      // trailing slash is required when Django APPEND_SLASH=True
      await putFormData<unknown>("accounts/me/avatar/", fd, {
        headers: getAuthHeaders(),
      });
      setAvatarFile(null);
      closeModal();
      onUpdated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="relative w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="group relative block h-full w-full"
                title="Change avatar"
              >
                <img src={avatarUrl} alt="user" className="h-full w-full object-cover" />
                <span className="absolute inset-0 hidden items-center justify-center bg-gray-900/40 text-xs font-medium text-white group-hover:flex">
                  Change
                </span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = (e.target as HTMLInputElement).files?.[0] ?? null;
                  setAvatarFile(f);
                  void handleUploadAvatar(f);
                  // allow selecting same file again
                  (e.target as HTMLInputElement).value = "";
                }}
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {displayName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(me?.email as string) || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end" />
          </div>
          {/* Edit button removed (use Personal Information card instead) */}
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          {error && (
            <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
              {error}
            </div>
          )}
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-1">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input type="text" value={(me?.email as string) || ""} disabled />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={() => void handleSaveBasic()} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
