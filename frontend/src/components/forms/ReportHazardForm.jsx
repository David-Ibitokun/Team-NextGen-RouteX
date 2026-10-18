import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle,
  CircleDot,
  Droplets,
  HelpCircle,
  Loader2,
  Sliders,
  Sparkles,
  TreePine,
  X,
} from "lucide-react";
import { RouteXLogo } from "../common/RouteXLogo";
import { HAZARD_CATEGORIES } from "../../utils/hazardConstants";
import { LocationPickerMap } from "../map/LocationPickerMap";
import { hazardService } from "../../services/apiClient";
import { convertToWebP, formatFileSize } from "../../utils/imageOptimizer";

const CATEGORY_ICONS = {
  flooding: Droplets,
  pothole: CircleDot,
  blocked_road: AlertTriangle,
  fallen_tree: TreePine,
  other: HelpCircle,
};

export function ReportHazardForm({ onSuccess, onCancel, isModal = false }) {
  const [category, setCategory] = useState("flooding");
  const [locationLabel, setLocationLabel] = useState("");
  const [description, setDescription] = useState("");
  // Start with a neutral location until the user selects a point.
  const [latitude, setLatitude] = useState(6.4531);
  const [longitude, setLongitude] = useState(3.3958);

  // Manual Coordinates Input Toggle
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [latInput, setLatInput] = useState("6.453100");
  const [lngInput, setLngInput] = useState("3.395800");

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [optimizingPhoto, setOptimizingPhoto] = useState(false);
  const [photoStats, setPhotoStats] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLocationChange = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    setLatInput(Number(lat).toFixed(6));
    setLngInput(Number(lng).toFixed(6));
    if (errors.coordinates || errors.latitude || errors.longitude) {
      setErrors((prev) => ({
        ...prev,
        coordinates: null,
        latitude: null,
        longitude: null,
      }));
    }
  };

  const handleApplyManualCoords = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setLatitude(lat);
      setLongitude(lng);
      setErrors((prev) => ({
        ...prev,
        coordinates: null,
        latitude: null,
        longitude: null,
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        coordinates: "Please enter valid coordinates (-90 to 90 lat, -180 to 180 lng).",
      }));
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        photo: "Please select a valid image file (JPEG, PNG, WebP).",
      }));
      return;
    }

    setOptimizingPhoto(true);
    setErrors((prev) => ({ ...prev, photo: null }));

    try {
      // Compress and convert to high-efficiency WebP format
      const optimized = await convertToWebP(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.82,
      });

      setPhoto(optimized.file);
      setPhotoPreview(optimized.previewUrl);
      setPhotoStats(optimized);
    } catch (err) {
      // Fallback to original file if conversion encountered an issue
      setPhoto(file);
      setPhotoStats(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setOptimizingPhoto(false);
    }
  };

  const removePhoto = () => {
    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhoto(null);
    setPhotoPreview(null);
    setPhotoStats(null);
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
    if (!locationLabel.trim() || locationLabel.trim().length < 3) {
      errs.location_label = "Please provide the road or landmark name (minimum 3 characters).";
    }
    if (locationLabel.trim().length > 150) {
      errs.location_label = "Road or landmark name cannot exceed 150 characters.";
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
      formData.append("latitude", Number(latitude).toFixed(6));
      formData.append("longitude", Number(longitude).toFixed(6));
      if (photo) {
        formData.append("photo", photo);
      }

      const created = await hazardService.createHazard(formData);
      setIsSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(created);
      }, 1200);
    } catch (err) {
      if (err.response?.data?.detail) {
        setServerError(err.response.data.detail);
      } else if (err.response && err.response.data && typeof err.response.data === "object") {
        setErrors(err.response.data);
        const errorMessages = Object.entries(err.response.data)
          .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(", ") : String(msg)}`)
          .join(" | ");
        setServerError(
          errorMessages || "Please correct the highlighted fields and try submitting again."
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
      <div className="p-8 text-center bg-white dark:bg-[#142533] rounded-2xl border border-[#DCE4E8] dark:border-slate-800 space-y-4 shadow-sm transition-colors my-auto">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mx-auto text-[#27865B] dark:text-emerald-300">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#142B3B] dark:text-white">Report Submitted</h3>
        <p className="text-xs sm:text-sm text-[#667784] dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
          Thank you for helping road users know what lies ahead. Your report is now live for the community.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white dark:bg-[#142533] flex flex-col overflow-hidden transition-colors ${
        isModal
          ? "h-full max-h-full"
          : "rounded-2xl border border-[#DCE4E8] dark:border-slate-800 shadow-sm"
      }`}
    >
      {/* Pinned Sticky Header: Always visible on small and large screens */}
      <div className="sticky top-0 bg-white dark:bg-[#142533] z-20 px-4 py-3 sm:px-6 sm:py-4 border-b border-[#DCE4E8] dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="pr-2 min-w-0 flex items-center gap-2.5">
          <RouteXLogo size="md" />
          <div className="min-w-0">
            <h2
              id="report-hazard-title"
              className="text-base sm:text-lg font-bold text-[#142B3B] dark:text-white truncate"
            >
              Report a Road Hazard
            </h2>
            <p className="text-[11px] sm:text-xs text-[#667784] dark:text-slate-400 truncate">
              Share timely road conditions to help fellow road users.
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 -mr-1 text-[#667784] dark:text-slate-400 hover:text-[#142B3B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none shrink-0"
            aria-label="Close dialog"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Form Body: Smooth touch scrolling on mobile */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 space-y-4">
        {serverError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-[#D64545] dark:text-red-300 rounded-lg flex items-center gap-2">
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
              const IconComponent = CATEGORY_ICONS[cat.id] || HelpCircle;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    setErrors((prev) => ({ ...prev, category: null }));
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-[#087F8C] bg-[#087F8C]/10 dark:bg-[#087F8C]/20 ring-2 ring-[#087F8C] shadow-xs"
                      : "border-[#DCE4E8] dark:border-slate-700/80 bg-white dark:bg-[#1A2E3D] hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <IconComponent
                      className={`w-4 h-4 ${
                        isSelected ? "text-[#087F8C] dark:text-teal-400" : "text-[#667784] dark:text-slate-400"
                      }`}
                    />
                    <span className="text-xs font-bold text-[#142B3B] dark:text-white truncate">
                      {cat.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#667784] dark:text-slate-400 line-clamp-1">
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

        {/* Map Location Picker */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200">
              Location on map <span className="text-[#D64545]">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowManualCoords((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#087F8C] dark:text-teal-400 hover:underline"
            >
              <Sliders className="w-3 h-3" />
              <span>{showManualCoords ? "Hide manual coordinates" : "Enter location manually"}</span>
            </button>
          </div>
          <LocationPickerMap
            latitude={latitude}
            longitude={longitude}
            onLocationChange={handleLocationChange}
            className="h-44 sm:h-52 w-full"
          />

          {/* Collapsible Manual Coordinate Inputs */}
          {showManualCoords && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#142B3B] dark:text-slate-200">
                  Manual Coordinates (Decimal Degrees)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Current: {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <div className="sm:col-span-2">
                  <label htmlFor="manualLat" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Latitude (-90 to 90)
                  </label>
                  <input
                    id="manualLat"
                    type="number"
                    step="any"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    placeholder="e.g. 6.453100"
                    className="w-full text-xs font-mono p-2 bg-white dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 text-[#142B3B] dark:text-slate-100 rounded-lg focus:outline-none focus:border-[#087F8C]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="manualLng" className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Longitude (-180 to 180)
                  </label>
                  <input
                    id="manualLng"
                    type="number"
                    step="any"
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    placeholder="e.g. 3.395800"
                    className="w-full text-xs font-mono p-2 bg-white dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 text-[#142B3B] dark:text-slate-100 rounded-lg focus:outline-none focus:border-[#087F8C]"
                  />
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={handleApplyManualCoords}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-lg transition-colors shadow-xs"
                  >
                    Set Pin
                  </button>
                </div>
              </div>
            </div>
          )}

          {errors.coordinates && (
            <p className="text-xs text-[#D64545] mt-1">{errors.coordinates}</p>
          )}
          {errors.latitude && (
            <p className="text-xs text-[#D64545] mt-1">Latitude: {Array.isArray(errors.latitude) ? errors.latitude[0] : errors.latitude}</p>
          )}
          {errors.longitude && (
            <p className="text-xs text-[#D64545] mt-1">Longitude: {Array.isArray(errors.longitude) ? errors.longitude[0] : errors.longitude}</p>
          )}
        </div>

        {/* Landmark / Street Name */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="locationLabel"
              className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200"
            >
              Road or landmark name <span className="text-[#D64545]">*</span>
            </label>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              Compulsory
            </span>
          </div>
          <p className="text-[11px] text-[#667784] dark:text-slate-400">
            Crucial for unnamed roads on the map: specify street name, nearest junction, or notable landmark.
          </p>
          <input
            id="locationLabel"
            type="text"
            required
            value={locationLabel}
            onChange={(e) => {
              setLocationLabel(e.target.value);
              if (errors.location_label) {
                setErrors((prev) => ({ ...prev, location_label: null }));
              }
            }}
            placeholder="e.g. Apatira Street by Market / Lekki-Epe by Jakande"
            maxLength={150}
            className="w-full text-xs p-2.5 bg-[#F7F9FA] dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 text-[#142B3B] dark:text-slate-100 rounded-lg focus:outline-none focus:border-[#087F8C] focus:bg-white dark:focus:bg-[#152735]"
          />
          {errors.location_label && (
            <p className="text-xs text-[#D64545]">{errors.location_label}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="hazardDesc"
              className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200"
            >
              Description <span className="text-[#D64545]">*</span>
            </label>
            <span className="text-[10px] text-[#667784] dark:text-slate-400 font-mono">
              {description.length}/1000
            </span>
          </div>
          <textarea
            id="hazardDesc"
            rows={2}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: null }));
              }
            }}
            placeholder="Describe what you see: depth of water, which lanes are affected, or dangerous road edges."
            maxLength={1000}
            className="w-full text-xs p-2.5 bg-[#F7F9FA] dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 text-[#142B3B] dark:text-slate-100 rounded-lg focus:outline-none focus:border-[#087F8C] focus:bg-white dark:focus:bg-[#152735]"
          />
          {errors.description && (
            <p className="text-xs text-[#D64545]">{errors.description}</p>
          )}
        </div>

        {/* Photo Evidence (With Client-Side WebP Conversion) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[#142B3B] dark:text-slate-200">
              Optional photo evidence{" "}
              <span className="text-xs font-normal text-[#667784] dark:text-slate-400">
                (auto-converted to WebP)
              </span>
            </label>
            {photoStats && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3 h-3" />
                <span>WebP Optimized</span>
              </span>
            )}
          </div>

          {optimizingPhoto ? (
            <div className="flex items-center justify-center gap-2 p-5 border-2 border-dashed border-[#087F8C]/40 bg-[#087F8C]/5 dark:bg-[#087F8C]/10 rounded-xl text-xs text-[#087F8C] dark:text-teal-300">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Optimizing photo to lightweight WebP format...</span>
            </div>
          ) : photoPreview ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-2.5 border border-[#DCE4E8] dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40">
              <div className="relative shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 w-24 h-20 bg-slate-100 dark:bg-slate-800">
                <img
                  src={photoPreview}
                  alt="Hazard photo preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                  aria-label="Remove photo"
                  title="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="flex-1 min-w-0 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-[#142B3B] dark:text-white truncate max-w-[180px]">
                    {photo?.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#087F8C]/10 text-[#087F8C] dark:bg-[#087F8C]/20 dark:text-teal-300">
                    WEBP
                  </span>
                </div>

                {photoStats && (
                  <p className="text-[11px] text-[#667784] dark:text-slate-400">
                    {formatFileSize(photoStats.compressedSize)}
                    {photoStats.savingsPercent > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium ml-1">
                        (was {formatFileSize(photoStats.originalSize)}, -{photoStats.savingsPercent}%)
                      </span>
                    )}
                  </p>
                )}

                <button
                  type="button"
                  onClick={removePhoto}
                  className="text-[11px] text-red-500 hover:text-red-600 hover:underline inline-block"
                >
                  Change photo
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#DCE4E8] dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
              <Camera className="w-5 h-5 text-[#667784] dark:text-slate-400 mb-1" />
              <span className="text-xs font-medium text-[#087F8C] dark:text-teal-400">
                Select or capture a photo
              </span>
              <span className="text-[10px] text-[#667784] dark:text-slate-400 mt-0.5">
                Automatically compressed to WebP &bull; High resolution, low data
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          )}

          {errors.photo && (
            <p className="text-xs text-[#D64545]">{errors.photo}</p>
          )}
        </div>
      </div>

      {/* Pinned Sticky Footer: Always visible on small and large screens */}
      <div className="sticky bottom-0 bg-white/95 dark:bg-[#142533]/95 backdrop-blur-xs z-20 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[#DCE4E8] dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-[#142B3B] dark:text-slate-200 bg-white dark:bg-[#1B3142] border border-[#DCE4E8] dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || optimizingPhoto}
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#0aa3b3] rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting report...</span>
            </>
          ) : optimizingPhoto ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing photo...</span>
            </>
          ) : (
            <span>Submit report</span>
          )}
        </button>
      </div>
    </form>
  );
}

export default ReportHazardForm;
