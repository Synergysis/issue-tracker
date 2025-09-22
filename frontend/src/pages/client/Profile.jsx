import React, { useEffect, useState } from "react";
import api from "../../api/apiService";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get("/client/profile")
      .then((res) => {
        // Support both { success, client } and { ...profile fields }
        const data = res.data.client ? res.data.client : res.data;
        setProfile(data);
        setProfileForm(data);
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = () => {
    setEditMode(true);
    setError("");
    setSuccess("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    api
      .put("/client/profile", profileForm)
      .then((res) => {
        // Support both { success, client } and { ...profile fields } after update
        const data = res.data.client ? res.data.client : res.data;
        setProfile(data);
        setSuccess("Profile updated successfully.");
        setEditMode(false);
      })
      .catch(() => setError("Failed to update profile."))
      .finally(() => setLoading(false));
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="w-full max-w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Profile
            </h1>
            <p className="text-gray-600">
              View and update your account information.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
              <p className="text-gray-600 font-medium">
                Loading your profile...
              </p>
            </div>
          </div>
        </div>
      </div>
    );

  if (!profile) return null;
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className=" mx-auto">
        {/* Header with decorative element */}
        <div className="relative mb-8 pb-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600 max-w-2xl">
            View and manage your personal information
          </p>
          {/* <div className="absolute bottom-0 left-0 h-1 w-24 bg-gradient-to-r from-green-500 to-green-300 rounded-full"></div> */}
        </div>

        {/* Notification area */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 text-green-700 p-4 rounded-r-lg mb-6 animate-fade-in flex items-center shadow-sm">
            <svg
              className="w-5 h-5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              ></path>
            </svg>
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-r-lg mb-6 animate-fade-in flex items-center shadow-sm">
            <svg
              className="w-5 h-5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              ></path>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Main content card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Card header with decorative accent */}
          {/* <div className="h-2 bg-gradient-to-r from-green-400 to-green-600"></div> */}

          <div className="p-8">
            {editMode ? (
              <form
                onSubmit={handleSave}
                className="max-w-2xl mx-auto space-y-6 animate-fade-in-up"
              >
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Edit Your Profile
                  </h2>
                  <p className="text-sm text-gray-500">
                    Update your personal information below
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 cursor-not-allowed pl-10"
                      required
                      disabled
                    />
                    <svg
                      className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 12a4 4 0 10-8 0 4 4 0 018 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    companyName
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="companyName"
                      value={profileForm.companyName || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition duration-200"
                      disabled
                    />
                    <svg
                      className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                </div>

                {/* Form actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 mt-8">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 font-medium"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition duration-200 font-medium shadow-sm flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="animate-fade-in-up">
                {/* Profile header with avatar */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-xl font-bold text-white mb-4 sm:mb-0 sm:mr-6">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile.name}
                    </h2>
                    <p className="text-gray-500">{profile.email}</p>
                    {profile.companyName && (
                      <div className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        <svg
                          className="mr-1 h-3 w-3 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        {profile.companyName}
                      </div>
                    )}
                  </div>
                  <div className="ml-auto hidden sm:block">
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition duration-200 font-medium flex items-center shadow-sm"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        ></path>
                      </svg>
                      Edit
                    </button>
                  </div>
                </div>

                {/* Profile information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                        <svg
                          className="w-4 h-4 mr-1.5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Personal Information
                      </h3>
                    </div>
                    <div className="p-6">
                      <dl className="divide-y divide-gray-100">
                        <div className="py-3 flex justify-between">
                          <dt className="text-sm font-medium text-gray-500">
                            Full name
                          </dt>
                          <dd className="text-sm font-semibold text-gray-900">
                            {profile.name || "-"}
                          </dd>
                        </div>
                        <div className="py-3 flex justify-between">
                          <dt className="text-sm font-medium text-gray-500">
                            Email address
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {profile.email || "-"}
                          </dd>
                        </div>
                        <div className="py-3 flex justify-between">
                          <dt className="text-sm font-medium text-gray-500">
                            companyName
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {profile.companyName || (
                              <span className="text-gray-400 italic">
                                Not specified
                              </span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                        <svg
                          className="w-4 h-4 mr-1.5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                          />
                        </svg>
                        Account Details
                      </h3>
                    </div>
                    <div className="p-6">
                      <dl className="divide-y divide-gray-100">
                        <div className="py-3 flex justify-between items-center">
                          <dt className="text-sm font-medium text-gray-500">
                            Account status
                          </dt>
                          <dd>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <span className="w-1 h-1 mr-1.5 bg-green-600 rounded-full"></span>
                              {profile.status || "Active"}
                            </span>
                          </dd>
                        </div>
                        <div className="py-3 flex justify-between">
                          <dt className="text-sm font-medium text-gray-500">
                            Joined on
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {profile.joinedDate
                              ? new Date(profile.joinedDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )
                              : "-"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Mobile edit button */}
                <div className="sm:hidden mt-6 flex justify-center">
                  <button
                    onClick={handleEdit}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition duration-200 font-medium shadow flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      ></path>
                    </svg>
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Profile;
