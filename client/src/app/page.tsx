import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h1 className="text-4xl font-bold mb-4 text-gray-900">Recruitment & Applicant Tracking System</h1>
      <p className="text-xl text-gray-500 mb-8">Secure, Efficient, and Reliable.</p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button>Login</Button>
        </Link>
        <Link href="/register">
          <Button variant="outline" className="text-white hover:text-black">Register</Button>
        </Link>
      </div>
    </div>
  );
}
