"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [message, setMessage] = useState("");
    const router = useRouter();
    const { checkAuth } = useAuth();

    // In Next.js 13+ App Router, params are passed as props to the page component
    // However, we need to handle the async nature of params in newer versions or just use the prop directly if it's a server component, 
    // but this is a client component ("use client").
    // Actually, for client components in dynamic routes, we can use `useParams` hook or the props.
    // Let's use the prop `params` but we need to unwrap it if it's a promise (Next.js 15 changes), 
    // or just use `useParams` from `next/navigation`.

    // Let's use `useParams` to be safe and standard for client components.
    const { token } = useParams();

    useEffect(() => {
        if (token) {
            verifyEmail(token as string);
        }
    }, [token]);

    useEffect(() => {
        if (status === "success") {
            const timer = setTimeout(() => {
                router.push("/dashboard");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status, router]);

    const verifyEmail = async (token: string) => {
        try {
            // Call the backend GET route we just updated
            await api.get(`/auth/verifyemail/${token}`);
            await checkAuth(); // Update auth state
            setStatus("success");
        } catch (error: any) {
            setStatus("error");
            setMessage(error.response?.data?.error || "Verification failed. The link may be invalid or expired.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                {status === "verifying" && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Verifying your email...</h2>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                )}

                {status === "success" && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-green-600">Email Verified!</h2>
                        <p className="text-gray-700 mb-6">
                            Your account has been successfully verified. Redirecting to dashboard...
                        </p>
                    </div>
                )}

                {status === "error" && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-red-600">Verification Failed</h2>
                        <p className="text-gray-700 mb-6">{message}</p>
                        <Link href="/login">
                            <Button variant="outline">Back to Login</Button>
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    );
}
