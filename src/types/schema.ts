import z from "zod";

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().nullable().optional(), // 이메일 null 가능 시
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

export type User = z.infer<typeof UserSchema>;
export type Session = { user: User | null; isAuthenticated: boolean };
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
