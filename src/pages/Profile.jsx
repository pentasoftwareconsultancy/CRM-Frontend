import React, { useState } from "react";
import { Camera, CheckCircle, AlertCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";

/* ---------------- Avatar fallback ---------------- */
const avatarFromName = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "U"
  )}&background=4f46e5&color=fff`;

/* ---------------- Profile Page ---------------- */
const Profile = ({ currentUser }) => {
  const { updateUser } = useAuthStore();

  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    avatar: currentUser?.avatar || avatarFromName(currentUser?.name),
    currentPassword: "",
    newPassword: "",
  });

  const [loadingImage, setLoadingImage] = useState(false);
  const [status, setStatus] = useState(null);

  /* ---------------- Image Upload ---------------- */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingImage(true);

    const preview = URL.createObjectURL(file);
    setForm((p) => ({ ...p, avatar: preview }));

    setTimeout(() => {
      setLoadingImage(false);
      setStatus({ type: "success", message: "Profile photo updated" });
    }, 1200);
  };

  /* ---------------- Save ---------------- */
  const handleSave = (e) => {
    e.preventDefault();

    updateUser({
      name: form.name,
      avatar: form.avatar,
    });

    setStatus({ type: "success", message: "Profile saved successfully" });
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ================= LEFT PANEL ================= */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white border rounded-xl p-6 text-center">
            <div className="relative w-32 h-32 mx-auto">
              <img
                src={form.avatar}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover border"
              />

              {/* Upload Button */}
              <label className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full cursor-pointer hover:bg-indigo-700">
                <Camera size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </label>

              {/* Loader */}
              {loadingImage && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            <h3 className="mt-4 text-xl font-semibold">{currentUser.name}</h3>
            <p className="text-slate-500">{currentUser.email}</p>

            <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">
              {currentUser.role}
            </span>
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl p-6">
            <h4 className="font-semibold mb-4">Performance</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/15 rounded-lg p-4 text-center">
                <p className="text-sm opacity-80">Deals</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="bg-white/15 rounded-lg p-4 text-center">
                <p className="text-sm opacity-80">Conversion</p>
                <p className="text-2xl font-bold">24%</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="lg:col-span-2 bg-white border rounded-xl p-8">
          <form onSubmit={handleSave} className="space-y-8">
            {/* Personal Info */}
            <section>
              <h2 className="text-lg font-semibold mb-4">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    className="mt-1 w-full p-3 border rounded-lg"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    disabled
                    className="mt-1 w-full p-3 border rounded-lg bg-slate-100"
                    value={form.email}
                  />
                </div>
              </div>
            </section>

            {/* Security */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Security</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="password"
                  placeholder="Current Password"
                  className="p-3 border rounded-lg"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  className="p-3 border rounded-lg"
                />
              </div>
            </section>

            {/* Status */}
            {status && (
              <div
                className={`p-4 rounded-lg flex items-center gap-2 text-sm ${
                  status.type === "success"
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {status.message}
              </div>
            )}

            {/* Save */}
            <div className="flex justify-end">
              <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
