"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const [resources, setResources] = useState<any[]>([]);

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<any>(null);

    // Form States
    const [createForm, setCreateForm] = useState({ name: "", content: "", sensitivityLevel: "internal" });
    const [shareForm, setShareForm] = useState({ email: "", permission: "read" });
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchResources();
        }
    }, [user]);

    const fetchResources = async () => {
        try {
            const res = await api.get("/resources");
            setResources(res.data.data);
        } catch (error) {
            console.error("Failed to fetch resources", error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("/resources", createForm);
            setIsCreateOpen(false);
            setCreateForm({ name: "", content: "", sensitivityLevel: "internal" });
            fetchResources();
            setSuccessMsg("Resource created successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to create resource");
        }
    };

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await api.put(`/resources/${selectedResource._id}/share`, shareForm);
            setIsShareOpen(false);
            setShareForm({ email: "", permission: "read" });
            setSuccessMsg("Resource shared successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to share resource");
        }
    };

    const openView = async (id: string) => {
        try {
            const res = await api.get(`/resources/${id}`);
            setSelectedResource(res.data.data);
            setIsViewOpen(true);
        } catch (err: any) {
            alert(err.response?.data?.error || "Access Denied");
        }
    };

    const openShare = (resource: any) => {
        setSelectedResource(resource);
        setIsShareOpen(true);
    };

    if (loading || !user) {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600">Welcome back, {user.name} ({user.role})</p>
                    </div>
                    <div className="space-x-4">
                        <Button onClick={() => setIsCreateOpen(true)}>Create Resource</Button>
                        <Button onClick={logout} variant="secondary">Logout</Button>
                    </div>
                </div>

                {successMsg && (
                    <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">
                        {successMsg}
                    </div>
                )}

                <div className="grid gap-6">
                    <Card>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Resources</h2>
                        {resources.length === 0 ? (
                            <p className="text-gray-500">No resources found.</p>
                        ) : (
                            <ul className="space-y-3">
                                {resources.map((res: any) => (
                                    <li key={res._id} className="p-4 border rounded-md bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{res.name}</h3>
                                            <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${res.sensitivityLevel === 'public' ? 'bg-green-100 text-green-800' :
                                                res.sensitivityLevel === 'internal' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {res.sensitivityLevel}
                                            </span>
                                        </div>
                                        <div className="space-x-2">
                                            <Button variant="outline" onClick={() => openView(res._id)}>View</Button>
                                            {(user.role === 'admin' || res.owner === user._id) && (
                                                <Button variant="secondary" onClick={() => openShare(res)}>Share</Button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>

                {/* Create Modal */}
                <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Resource">
                    <form onSubmit={handleCreate} className="space-y-4">
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <Input
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                            <textarea
                                className="w-full p-2 border rounded-md text-gray-900"
                                value={createForm.content}
                                onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sensitivity Level</label>
                            <select
                                className="w-full p-2 border rounded-md text-gray-900"
                                value={createForm.sensitivityLevel}
                                onChange={(e) => setCreateForm({ ...createForm, sensitivityLevel: e.target.value })}
                            >
                                <option value="public">Public</option>
                                <option value="internal">Internal</option>
                                <option value="confidential">Confidential</option>
                            </select>
                        </div>
                        <Button type="submit" className="w-full">Create</Button>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={selectedResource?.name || "Resource"}>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Content</h4>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedResource?.content}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Sensitivity</h4>
                            <p className="text-gray-900 capitalize">{selectedResource?.sensitivityLevel}</p>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => setIsViewOpen(false)}>Close</Button>
                        </div>
                    </div>
                </Modal>

                {/* Share Modal */}
                <Modal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} title="Share Resource">
                    <form onSubmit={handleShare} className="space-y-4">
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <p className="text-sm text-gray-600">Sharing: <strong>{selectedResource?.name}</strong></p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User Email or Username</label>
                            <Input
                                value={shareForm.email}
                                onChange={(e) => setShareForm({ ...shareForm, email: e.target.value })}
                                placeholder="Enter email or username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Permission</label>
                            <select
                                className="w-full p-2 border rounded-md text-gray-900"
                                value={shareForm.permission}
                                onChange={(e) => setShareForm({ ...shareForm, permission: e.target.value })}
                            >
                                <option value="read">Read</option>
                                <option value="write">Write</option>
                            </select>
                        </div>
                        <Button type="submit" className="w-full">Share</Button>
                    </form>
                </Modal>
            </div>
        </div>
    );
}
