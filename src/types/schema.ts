import z from "zod";

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().nullable().optional(), // 이메일 null 가능 시
  displayName: z.string(),
  handle: z.string(),
  bio: z.string().nullable().optional(),
  trustScore: z.number(),
  verifiedFlags: z.record(z.boolean()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // firebaseUid: z.string(),
});

export const MeResponseSchema = z.object({
  message: z.string(),
  data: z.object({ user: UserSchema }),
});

export const SignupRequestSchema = z
  .object({
    email: z.string().email("유효한 이메일을 입력해주세요"),
    handle: z
      .string()
      .min(3, "핸들은 최소 3자리 이상이어야 합니다")
      .max(20, "핸들은 최대 20자리까지 입력 가능합니다")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "핸들은 영문, 숫자, 언더스코어만 사용 가능합니다"
      ),
    password: z.string().min(6, "비밀번호는 최소 6자리 이상이어야 합니다"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

export const UpdateUserSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  bio: z.string().max(160).nullable().optional(),
  handle: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
});
export const ProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "표시 이름을 입력해주세요")
    .max(30, "최대 30자")
    .nullable(),
  bio: z.string().max(200, "자기소개는 200자 이내").nullable(),
});

export const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url("NEXT_PUBLIC_API_BASE_URL must be a valid URL")
    .min(1, "NEXT_PUBLIC_API_BASE_URL is required"),

  NEXT_PUBLIC_APP_NAME: z
    .string()
    .min(1, "NEXT_PUBLIC_APP_NAME is required")
    .default("Acorn"),

  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL when provided")
    .optional()
    .or(z.literal("")),

  NEXT_PUBLIC_APP_VERSION: z
    .string()
    .regex(
      /^\d+\.\d+\.\d+$/,
      "NEXT_PUBLIC_APP_VERSION must be in semver format (x.y.z)"
    )
    .default("1.0.0"),

  // 환경 구분
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // 로그 레벨
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // 분석 도구
  ENABLE_ANALYTICS: z
    .string()
    .transform((val: string) => val === "true")
    .default("false"),

  // 외부 서비스 (선택적)
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  INFINITE_SCROLL_PAGE_SIZE: z.number().min(1),
});

export type User = z.infer<typeof UserSchema>;
export type Session = { user: User | null; isAuthenticated: boolean };
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type ProfileForm = z.infer<typeof ProfileSchema>;
export type Env = z.infer<typeof envSchema>;
