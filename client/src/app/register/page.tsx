"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const { register, user } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        captchaToken: "",
        otpEnabled: false,
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    useEffect(() => {
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.captchaToken) {
            setError("Please complete the reCAPTCHA");
            return;
        }

        try {
            await register(formData);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || "Registration failed");
            recaptchaRef.current?.reset();
            setFormData({ ...formData, captchaToken: "" });
        }
    };

    const onCaptchaChange = (token: string | null) => {
        setFormData({ ...formData, captchaToken: token || "" });
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <h2 className="text-2xl font-bold mb-4 text-green-600">Registration Successful!</h2>
                    <p className="text-gray-700 mb-6">
                        An email has been sent to <strong>{formData.email}</strong>.
                        <br />
                        Please check your inbox and click the verification link to activate your account.
                    </p>
                    <Link href="/login">
                        <Button variant="outline">Go to Login</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 text-gray-900 font-sime-bold">
            <Card className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Create Account</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <Input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Must contain uppercase, lowercase, number, special char.</p>
                    </div>

                    <div className="flex justify-center">
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Test Site Key
                            onChange={onCaptchaChange}
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="otpEnabled"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={formData.otpEnabled}
                            onChange={(e) => setFormData({ ...formData, otpEnabled: e.target.checked })}
                        />
                        <label htmlFor="otpEnabled" className="ml-2 block text-sm text-gray-900">
                            Enable Two-Factor Authentication (OTP)
                        </label>
                    </div>
                    <Button type="submit" className="w-full">
                        Register
                    </Button>
                </form>
                <p className="text-center mt-4 text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Login
                    </Link>
                </p>
            </Card>
        </div>
    );
}
