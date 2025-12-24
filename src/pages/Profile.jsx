import React, { useState, useEffect } from "react";
import { Camera, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";

/* ---------------- Avatar fallback ---------------- */
// This helper generates a placeholder if no avatar exists in the DB
const avatarFromName = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "U"
  )}&background=4f46e5&color=fff`;

const Profile = ({ currentUser }) => {
  const { updateUser } = useAuthStore();

  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    // Use saved avatar from DB, otherwise use fallback
    avatar: currentUser?.avatar || avatarFromName(currentUser?.name),
    currentPassword: "",
    newPassword: "",
  });

  const [loadingImage, setLoadingImage] = useState(false);
  const [status, setStatus] = useState(null);

  /* ---------------- Image Upload Logic ---------------- */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: Only allow images under 2MB (if using Base64)
    if (file.size > 2000000) {
      setStatus({ type: "error", message: "Image must be less than 2MB" });
      return;
    }

    setLoadingImage(true);

    // To store in MongoDB without a dedicated file server, 
    // we convert the image to a Base64 String
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setForm((p) => ({ ...p, avatar: reader.result }));
      setLoadingImage(false);
      setStatus({ type: "success", message: "Photo uploaded. Don't forget to Save Changes!" });
    };
  };

  /* ---------------- Save to Backend ---------------- */
  const handleSave = async (e) => {
    e.preventDefault();
    setStatus(null);

    try {
      // This calls your Zustand store, which should perform an axios.put to /api/users/profile
      await updateUser({
        name: form.name,
        avatar: form.avatar,
        // currentPassword and newPassword would go here if you implemented password logic
      });

      setStatus({ type: "success", message: "Profile updated successfully" });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Failed to update profile" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Account Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ================= LEFT PANEL ================= */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="relative w-32 h-32 mx-auto">
              <img
                src={form.avatar}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover border-4 border-slate-50 shadow-inner"
              />

              <label className="absolute bottom-0 right-0 bg-indigo-600 p-2.5 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
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

            <h3 className="mt-5 text-xl font-bold text-slate-800">{currentUser.name}</h3>
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
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <p className="text-xs opacity-70 uppercase font-bold">Win Rate</p>
                <p className="text-2xl font-bold">24%</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSave} className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-5 pb-2 border-b">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input
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

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-5 pb-2 border-b">Security</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="password"
                  placeholder="Current Password"
                  className="p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  className="p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </section>

            {status && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${
                  status.type === "success"
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
                className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
              >
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