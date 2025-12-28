// src/pages/Profile.jsx (Final)

import React, { useState, useEffect } from "react";
import { Camera, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/api"; // Ensure authService is imported for password change

/* ---------------- Avatar fallback ---------------- */
const avatarFromName = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "U"
  )}&background=4f46e5&color=fff`;

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
  const [selectedFile, setSelectedFile] = useState(null);

  const [passwordStatus, setPasswordStatus] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const preview = URL.createObjectURL(file);
    setForm((p) => ({ ...p, avatar: preview }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!form.name.trim()) {
      return setStatus({ type: "error", message: "Name cannot be empty." });
    }

    setLoadingImage(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);

      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      await updateUser(formData);

      setStatus({ type: "success", message: "Profile saved successfully" });
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to update profile" });
    } finally {
      setLoadingImage(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);
    setPasswordLoading(true);

    if (!form.currentPassword || !form.newPassword) {
      setPasswordStatus({ type: "error", message: "Both password fields are required." });
      setPasswordLoading(false);
      return;
    }

    if (form.newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "New password must be at least 6 characters long." });
      setPasswordLoading(false);
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setPasswordStatus({ type: "error", message: "New password cannot be the same as current password." });
      setPasswordLoading(false);
      return;
    }

    try {
      await authService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });

      setPasswordStatus({ type: "success", message: "Password updated successfully." });
      setForm(p => ({ ...p, currentPassword: '', newPassword: '' })); // Clear fields

    } catch (err) {
      setPasswordStatus({ type: "error", message: err.response?.data?.message || "Password change failed." });
    } finally {
      setPasswordLoading(false);
    }
  };


  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 font-sans">
      <h1 className="text-xl sm:text-3xl font-bold mb-8 text-slate-800">Account Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ================= LEFT PANEL ================= */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">

            {/* AVATAR SIZE INCREASED: w-40 h-40 on small screens, w-48 h-48 on larger */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto">
              <img
                src={form.avatar}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover border-4 border-slate-50 shadow-inner"
              />

              <label className="absolute bottom-0 right-0 bg-indigo-600 p-2 sm:p-2.5 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                <Camera size={18} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </label>

              {loadingImage && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-full">
                  <Loader2 className="animate-spin text-indigo-600" />
                </div>
              )}
            </div>

            <h3 className="mt-5 text-lg sm:text-xl font-bold text-slate-800">{currentUser.name}</h3>
            <p className="text-slate-500 text-sm">{currentUser.email}</p>

            <span className="inline-block mt-3 px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              {currentUser.role}
            </span>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl p-6 shadow-md">
            <h4 className="font-semibold mb-4 opacity-90">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <p className="text-xs opacity-70 uppercase font-bold">Deals</p>
                <p className="text-xl sm:text-2xl font-bold">12</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <p className="text-xs opacity-70 uppercase font-bold">Win Rate</p>
                <p className="text-xl sm:text-2xl font-bold">24%</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">

          {/* Profile Information Form */}
          <form onSubmit={handleSaveProfile} className="space-y-6 mb-8 pb-8 border-b border-slate-100">
            <section>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-5 pb-2 border-b">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                  <input
                    required
                    className="mt-1 w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input
                    disabled
                    className="mt-1 w-full p-3 border border-slate-100 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed"
                    value={form.email}
                  />
                </div>
              </div>
            </section>

            {status && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${status.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                  }`}
              >
                {status.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {status.message}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loadingImage}
                className="px-8 sm:px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 text-sm disabled:opacity-50"
              >
                {loadingImage ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>

          {/* Security / Change Password Form */}
          <form onSubmit={handleChangePassword} className="space-y-6">
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-5 pb-2 border-b">Change Password</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <input
                    required
                    type={showCurrentPassword ? "text" : "password"}
                    minLength="6"
                    placeholder="Current Password *"
                    className="w-full p-3 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={form.currentPassword}
                    onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    required
                    type={showNewPassword ? "text" : "password"}
                    minLength="6"
                    placeholder="New Password (min 6 characters) *"
                    className="w-full p-3 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </section>

            {passwordStatus && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${passwordStatus.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                  }`}
              >
                {passwordStatus.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {passwordStatus.message}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-8 sm:px-10 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95 text-sm disabled:opacity-50"
              >
                {passwordLoading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;