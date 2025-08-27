// app/settings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { usersApi, authApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { z } from "zod";

const ProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "표시 이름을 입력해주세요")
    .max(30, "최대 30자"),
  bio: z.string().max(200, "자기소개는 200자 이내"),
});
type ProfileForm = z.infer<typeof ProfileSchema>;

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: session, isLoading: sessionLoading } = useSession();
  const isAuthenticated = session?.isAuthenticated === true;
  const me = session?.user ?? null;

  // 최신 프로필 (세션에 충분하면 생략 가능)
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await authApi.getMe(); // { user: {...} }
      return res.data.user;
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const initial = useMemo(() => {
    const base = profileData ?? me;
    return {
      handle: base?.handle ?? "",
      email: base?.email ?? "",
      displayName: base?.displayName ?? "",
      bio: base?.bio ?? "",
    };
  }, [profileData, me]);

  const [form, setForm] = useState<ProfileForm>({ displayName: "", bio: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiMsg, setApiMsg] = useState("");

  useEffect(() => {
    setForm({
      displayName: initial.displayName || "",
      bio: initial.bio || "",
    });
  }, [initial.displayName, initial.bio]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: ProfileForm) => {
      const parsed = ProfileSchema.parse(payload);
      return usersApi.updateProfile(parsed);
    },
    onSuccess: async () => {
      setApiMsg("프로필이 저장되었습니다");
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.refetchQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({ queryKey: ["session"] });
      await qc.refetchQueries({ queryKey: ["session"] });
    },
    onError: (e: any) => setApiMsg(e?.message || "프로필 저장에 실패했습니다"),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => authApi.logout(),
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ["session"] });
      await qc.refetchQueries({ queryKey: ["session"] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => authApi.deleteAccount(),
    onSuccess: async () => {
      setApiMsg("계정이 삭제되었습니다");
      await qc.invalidateQueries({ queryKey: ["session"] });
      await qc.refetchQueries({ queryKey: ["session"] });
      // 필요하면 router.push("/goodbye");
    },
    onError: (e: any) => setApiMsg(e?.message || "계정 삭제에 실패했습니다"),
  });

  const setField = (k: keyof ProfileForm, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
    setApiMsg("");
  };

  const onSaveProfile = () => {
    try {
      setErrors({});
      ProfileSchema.parse(form);
      updateProfileMutation.mutate(form);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        const f: Record<string, string> = {};
        e.errors.forEach((er) => (f[String(er.path[0])] = er.message));
        setErrors(f);
      } else {
        setApiMsg(e?.message || "유효성 검사 중 오류");
      }
    }
  };

  const busy =
    sessionLoading ||
    profileLoading ||
    updateProfileMutation.isPending ||
    logoutMutation.isPending ||
    deleteAccountMutation.isPending;

  if (!isAuthenticated && !sessionLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h1 className="text-3xl font-bold mb-3">로그인이 필요합니다</h1>
        <p className="text-muted-foreground">
          설정 페이지는 로그인 사용자만 이용할 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="mt-2 text-muted-foreground">계정과 프로필을 관리하세요</p>
      </div>

      {/* 상태 메시지 */}
      {apiMsg && (
        <div className="text-sm text-center text-foreground/80 border border-border rounded-md py-2 px-3 bg-card">
          {apiMsg}
        </div>
      )}

      {/* 프로필 섹션 */}
      <section className="border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">프로필</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">
              핸들 (수정 불가)
            </label>
            <Input value={initial.handle} disabled className="w-full" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">표시 이름</label>
            <Input
              placeholder="표시 이름"
              value={form.displayName}
              onChange={(e) => setField("displayName", e.target.value)}
              error={errors.displayName}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">자기소개</label>
            <textarea
              placeholder="한 줄 소개를 입력하세요"
              value={form.bio}
              onChange={(e) => setField("bio", e.target.value)}
              className={cn(
                "w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none",
                errors.bio && "border-destructive"
              )}
            />
            {errors.bio && (
              <p className="text-xs text-destructive">{errors.bio}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={busy}
              onClick={() => {
                setForm({
                  displayName: initial.displayName || "",
                  bio: initial.bio || "",
                });
                setErrors({});
                setApiMsg("");
              }}
            >
              되돌리기
            </Button>
            <Button type="button" disabled={busy} onClick={onSaveProfile}>
              저장
            </Button>
          </div>
        </div>
      </section>

      {/* 계정 섹션 */}
      <section className="border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">계정</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">
              이메일 (로그인용)
            </label>
            <Input value={initial.email} disabled className="w-full" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => logoutMutation.mutate()}
            >
              로그아웃
            </Button>
          </div>
        </div>
      </section>

      {/* 위험 구역 */}
      <section className="border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-destructive">
          위험 구역
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            계정 삭제는 되돌릴 수 없습니다. 모든 게시물과 데이터가 영구 삭제될
            수 있습니다.
          </p>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => {
              const ok = window.confirm(
                "정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
              );
              if (ok) deleteAccountMutation.mutate();
            }}
          >
            계정 삭제
          </Button>
        </div>
      </section>
    </div>
  );
}
