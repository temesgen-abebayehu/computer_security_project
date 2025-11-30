"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function LoginPage() {
    const { login, verifyOtp } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"login" | "otp">("login");
    const [userId, setUserId] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            if (step === "login") {
                const res = await login(email, password);
                if (res && res.mfaRequired) {
                    setStep("otp");
                    setUserId(res.userId);
                }
            } else {
                await verifyOtp(userId, otp);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "An error occurred");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 text-gray-900">
            <Card className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
                    {step === "login" ? "Login" : "Enter OTP"}
                </h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {step === "login" ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
                                <Input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                            <Input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                placeholder="123456"
                            />
                            <p className="text-xs text-gray-500 mt-1">Check your email for the code.</p>
                        </div>
                    )}
                    <Button type="submit" className="w-full">
                        {step === "login" ? "Sign In" : "Verify"}
                    </Button>
                </form>
                {step === "login" && (
                    <p className="text-center mt-4 text-sm text-gray-600">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-blue-600 hover:underline">
                            Register
                        </Link>
                    </p>
                )}
            </Card>
        </div>
    );
}
