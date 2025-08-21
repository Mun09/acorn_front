// 인증 관련 기능 (로그인, 회원가입)

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Card,
  ErrorMessage,
  SuccessMessage,
} from "@/components/ui";
import { useAuth } from "@/hooks";
import { validatePassword, isValidEmail, isValidHandle } from "@/lib/utils";

// 로그인 폼
export function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
          <p className="mt-2 text-sm text-gray-600">Welcome back to Acorn</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, email: value }))
            }
            disabled={loading}
            className="mt-1"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, password: value }))
            }
            disabled={loading}
            className="mt-1"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={!formData.email || !formData.password}
        >
          Sign In
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <a
              href="/auth/signup"
              className="text-blue-600 hover:text-blue-500"
            >
              Sign up
            </a>
          </p>
        </div>
      </form>
    </Card>
  );
}

// 회원가입 폼
export function SignupForm() {
  const [formData, setFormData] = useState({
    email: "",
    handle: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { signup } = useAuth();
  const router = useRouter();

  // 실시간 유효성 검사
  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = {};

    switch (name) {
      case "email":
        if (value && !isValidEmail(value)) {
          errors.email = "Please enter a valid email address";
        }
        break;
      case "handle":
        if (value && !isValidHandle(value)) {
          errors.handle =
            "Handle must be 3-20 characters, letters, numbers, and underscores only";
        }
        break;
      case "password":
        if (value) {
          const validation = validatePassword(value);
          if (!validation.isValid) {
            errors.password = validation.errors[0];
          }
        }
        break;
      case "confirmPassword":
        if (value && value !== formData.password) {
          errors.confirmPassword = "Passwords do not match";
        }
        break;
    }

    setFieldErrors((prev) => ({ ...prev, ...errors }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 최종 유효성 검사
    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!isValidHandle(formData.handle)) {
      setError("Please enter a valid handle");
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const result = await signup(
        formData.email,
        formData.handle,
        formData.password
      );

      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Signup failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">Join the Acorn community</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, email: value }));
              validateField("email", value);
            }}
            error={fieldErrors.email}
            disabled={loading}
            className="mt-1"
          />
        </div>

        <div>
          <label
            htmlFor="handle"
            className="block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <Input
            id="handle"
            type="text"
            placeholder="Choose a username"
            value={formData.handle}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, handle: value }));
              validateField("handle", value);
            }}
            error={fieldErrors.handle}
            disabled={loading}
            className="mt-1"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, password: value }));
              validateField("password", value);
            }}
            error={fieldErrors.password}
            disabled={loading}
            className="mt-1"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, confirmPassword: value }));
              validateField("confirmPassword", value);
            }}
            error={fieldErrors.confirmPassword}
            disabled={loading}
            className="mt-1"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={
            !formData.email ||
            !formData.handle ||
            !formData.password ||
            !formData.confirmPassword ||
            Object.keys(fieldErrors).length > 0
          }
        >
          Create Account
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/auth/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </p>
        </div>
      </form>
    </Card>
  );
}
