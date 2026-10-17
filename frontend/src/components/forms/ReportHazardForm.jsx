import React, { useState } from "react";
import { AlertCircle, Camera, CheckCircle, Loader2, X } from "lucide-react";
import { HAZARD_CATEGORIES } from "../../utils/hazardConstants";
import { LocationPickerMap } from "../map/LocationPickerMap";
import { hazardService } from "../../services/apiClient";

export function ReportHazardForm({ onSuccess, onCancel }) {
  const [category, setCategory] = useState("flooding");
  const [locationLabel, setLocationLabel] = useState("");
  const [description, setDescription] = useState("");
  // Default to central Lagos coordinates (Victoria Island / Marina area)
  const [latitude, setLatitude] = useState(6.4531);
  const [longitude, setLongitude] = useState(3.3958);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLocationChange = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    if (errors.coordinates) {
      setErrors((prev) => ({ ...prev, coordinates: null }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size on frontend (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        photo: "Photo file size cannot exceed 5 MB.",
      }));
      return;
    }

    setPhoto(file);
    setErrors((prev) => ({ ...prev, photo: null }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const validate = () => {
    const errs = {};
    if (!category) errs.category = "Please select a hazard category.";
    if (!description.trim() || description.trim().length < 5) {
      errs.description = "Please describe the condition in at least 5 characters.";
    }
    if (description.length > 1000) {
      errs.description = "Description cannot exceed 1000 characters.";
    }
    if (!latitude || !longitude) {
      errs.coordinates = "Please tap the map to place the hazard pin.";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("location_label", locationLabel.trim());
      formData.append("description", description.trim());
      formData.append("latitude", latitude.toString());
      formData.append("longitude", longitude.toString());
      if (photo) {
        formData.append("photo", photo);
      }

      const created = await hazardService.createHazard(formData);
      setIsSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(created);
      }, 1200);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setServerError("You must be signed in to submit a hazard report. Please sign in and try again.");
      } else if (err.response && err.response.data) {
        setErrors(err.response.data);
        setServerError(
          "Please correct the highlighted fields and try submitting again."
        );
      } else {
        setServerError(
          "We could not save the report right now. Check your internet connection and try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#142533] rounded-lg border border-[#DCE4E8] dark:border-slate-800 space-y-4 shadow-sm transition-colors">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mx-auto text-[#27865B] dark:text-emerald-300">
          <CheckCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-[#142B3B] dark:text-white">Report submitted</h3>
        <p className="text-sm text-[#667784] dark:text-slate-300 max-w-sm mx-auto">
          Thank you for helping road users know what lies ahead. Your report is now live for the community.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#142533] rounded-lg border border-[#DCE4E8] dark:border-slate-800 p-5 space-y-5 transition-colors shadow-sm">
      <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-[#142B3B] dark:text-white">Report a road hazard</h2>
          <p className="text-xs text-[#667784] dark:text-slate-400">
            Share timely road conditions to help fellow road users and commuters.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-[#667784] dark:text-slate-400 hover:text-[#142B3B] dark:hover:text-white rounded"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {serverError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-[#D64545] dark:text-red-300 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Category Selection */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200">
          Hazard category <span className="text-[#D64545]">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HAZARD_CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.id);
                  setErrors((prev) => ({ ...prev, category: null }));
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-[#087F8C] bg-[#087F8C]/10 dark:bg-[#087F8C]/20 ring-2 ring-[#087F8C]/30"
                    : "border-[#DCE4E8] dark:border-slate-700 bg-white dark:bg-[#1A2E3D] hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="text-xs font-bold text-[#142B3B] dark:text-white">{cat.label}</div>
                <div className="text-[10px] text-[#667784] dark:text-slate-400 line-clamp-1 mt-0.5">
                  {cat.description}
                </div>
              </button>
            );
          })}
        </div>
        {errors.category && (
          <p className="text-xs text-[#D64545] mt-1">{errors.category}</p>
        )}
      </div>

      {/* Map location picker */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200">
          Location on map <span className="text-[#D64545]">*</span>
        </label>
        <LocationPickerMap
          latitude={latitude}
          longitude={longitude}
          onLocationChange={handleLocationChange}
          className="h-56 w-full"
        />
        {errors.coordinates && (
          <p className="text-xs text-[#D64545] mt-1">{errors.coordinates}</p>
        )}
      </div>

      {/* Location Landmark / Road name */}
      <div className="space-y-1.5">
        <label htmlFor="locationLabel" className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200">
          Street name or landmark <span className="text-xs font-normal text-[#667784] dark:text-slate-400">(optional)</span>
        </label>
        <input
          id="locationLabel"
          type="text"
          value={locationLabel}
          onChange={(e) => setLocationLabel(e.target.value)}
          placeholder="e.g. Lekki-Epe Expressway by Jakande Roundabout"
          maxLength={150}
          className="w-full text-xs p-2.5 bg-[#F7F9FA] dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 text-[#142B3B] dark:text-slate-100 rounded-md focus:outline-none focus:border-[#087F8C] focus:bg-white dark:focus:bg-[#152735]"
        />
        {errors.location_label && (
          <p className="text-xs text-[#D64545]">{errors.location_label}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label htmlFor="hazardDesc" className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200">
            Description <span className="text-[#D64545]">*</span>
          </label>
          <span className="text-[10px] text-[#667784] dark:text-slate-400 font-mono">
            {description.length}/1000
          </span>
        </div>
        <textarea
          id="hazardDesc"
          rows={3}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) {
              setErrors((prev) => ({ ...prev, description: null }));
            }
          }}
          placeholder="Describe what you see: depth of water, which lanes are affected, or dangerous road edges."
          maxLength={1000}
          className="w-full text-xs p-2.5 bg-[#F7F9FA] dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 text-[#142B3B] dark:text-slate-100 rounded-md focus:outline-none focus:border-[#087F8C] focus:bg-white dark:focus:bg-[#152735]"
        />
        {errors.description && (
          <p className="text-xs text-[#D64545]">{errors.description}</p>
        )}
      </div>

      {/* Photo Upload */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200">
          Optional photo evidence <span className="text-xs font-normal text-[#667784] dark:text-slate-400">(JPEG, PNG, WebP up to 5MB)</span>
        </label>

        {photoPreview ? (
          <div className="relative inline-block border border-[#DCE4E8] dark:border-slate-700 rounded-lg overflow-hidden">
            <img
              src={photoPreview}
              alt="Uploaded hazard preview"
              className="h-28 w-44 object-cover"
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full"
              aria-label="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#DCE4E8] dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
            <Camera className="w-5 h-5 text-[#667784] dark:text-slate-400 mb-1" />
            <span className="text-xs font-medium text-[#087F8C] dark:text-teal-400">Select or capture a photo</span>
            <span className="text-[10px] text-[#667784] dark:text-slate-400 mt-0.5">Never take photos while driving</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
        )}
        {errors.photo && (
          <p className="text-xs text-[#D64545]">{errors.photo}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#DCE4E8] dark:border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-[#142B3B] dark:text-slate-200 bg-white dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-md shadow-sm transition-all disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting report...
            </>
          ) : (
            "Submit report"
          )}
        </button>
      </div>
    </form>
  );
}

export default ReportHazardForm;
