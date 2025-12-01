"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (user.role !== 'admin') {
                router.push("/dashboard");
            } else {
                fetchUsers();
            }
        }
    }, [user, loading, router]);

    const fetchUsers = async () => {
        try {
            const res = await api.get("/auth/users");
            setUsers(res.data.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        try {
            await api.put(`/auth/users/${userId}/role`, { role: newRole });
            setMsg(`User role updated to ${newRole}`);
            fetchUsers();
            setTimeout(() => setMsg(""), 3000);
        } catch (error: any) {
            setMsg(error.response?.data?.error || "Failed to update role");
        }
    };

    if (loading || !user || user.role !== 'admin') {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600">Manage Users and Roles</p>
                    </div>
                    <Button onClick={() => router.push("/dashboard")} variant="outline">
                        Back to Dashboard
                    </Button>
                </div>

                {msg && (
                    <div className="bg-blue-100 text-blue-700 p-3 rounded mb-4 text-center">
                        {msg}
                    </div>
                )}

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-100">
                                    <th className="p-4 font-medium text-gray-700">Name</th>
                                    <th className="p-4 font-medium text-gray-700">Username</th>
                                    <th className="p-4 font-medium text-gray-700">Email</th>
                                    <th className="p-4 font-medium text-gray-700">Role</th>
                                    <th className="p-4 font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u: any) => (
                                    <tr key={u._id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 text-gray-900">{u.name}</td>
                                        <td className="p-4 text-gray-900">{u.username}</td>
                                        <td className="p-4 text-gray-900">{u.email}</td>
                                        <td className="p-4">
                                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {u._id !== user._id && (
                                                <select
                                                    className="p-2 border rounded-md text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    value={u.role}
                                                    onChange={(e) => updateUserRole(u._id, e.target.value)}
                                                >
                                                    <option value="user">User</option>
                                                    <option value="employee">Employee</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="hr">HR</option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
