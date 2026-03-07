'use client';

import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { analyzeImage } from '@/app/lib/api';
import type { TrashAnalysis } from '@/app/lib/types';
import WasteBar from '@/app/components/WasteBar';
import { getDominantWaste } from '@/app/lib/utils';

export default function UploadPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocationError(null);
        setIsGettingLocation(false);
      },
      (err) => {
        setLocationError(err.message === 'User denied Geolocation' ? 'Location permission denied. Enter coordinates manually.' : 'Could not get location.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);
  const [result, setResult] = useState<TrashAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP, etc.)');
      return;
    }
    setSelectedFile(file);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    const lat = Number(latitude.trim());
    const lng = Number(longitude.trim());
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Latitude and longitude are required.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('latitude', latitude.trim());
      formData.append('longitude', longitude.trim());

      const data = await analyzeImage(formData);
      setResult(data.trash);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
          setLocationError(null);
          setIsGettingLocation(false);
        },
        () => {
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLatitude('');
      setLongitude('');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const dominant = result ? getDominantWaste(result) : null;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Analyze Image</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload a photo to detect and classify waste types using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Upload Image</h2>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
              isDragOver
                ? 'border-emerald-400 bg-emerald-50'
                : selectedFile
                ? 'border-slate-200 bg-slate-50 cursor-default'
                : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer'
            }`}
            style={{ minHeight: '220px' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleInputChange}
            />

            {previewUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full object-contain max-h-64 rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-800/70 hover:bg-slate-800 text-white flex items-center justify-center transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <div className="px-4 pb-3 pt-2 text-xs text-slate-500 truncate">
                  {selectedFile?.name}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-6 h-6 text-slate-400"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {isDragOver ? 'Drop image here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP, GIF up to 20 MB</p>
              </div>
            )}
          </div>

          {/* Coordinates */}
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Location <span className="font-normal text-slate-300">(detected from device)</span>
            </p>
            {isGettingLocation && (
              <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Getting your position…
              </p>
            )}
            {locationError && (
              <p className="text-xs text-amber-600 mb-2">{locationError}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 15.7833"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  readOnly={isGettingLocation}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. -90.2308"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  readOnly={isGettingLocation}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-red-500 mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing || isGettingLocation || !latitude.trim() || !longitude.trim()}
            className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isAnalyzing ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Analyzing with AI…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Analyze Waste
              </>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Analysis Results</h2>

          {!result && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-7 h-7 text-slate-300"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">
                Upload an image and click <strong className="text-slate-500">Analyze Waste</strong> to see results
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-700 text-sm">Processing image…</p>
                <p className="text-slate-400 text-xs mt-1">Claude AI is analyzing waste types</p>
              </div>
            </div>
          )}

          {result && !isAnalyzing && (
            <div className="space-y-6">
              {/* Dominant badge */}
              {dominant && (
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: `${dominant.color}18` }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: dominant.color }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Dominant waste type</p>
                    <p
                      className="font-bold text-lg"
                      style={{ color: dominant.color }}
                    >
                      {dominant.label}
                      <span className="text-sm font-normal text-slate-500 ml-1.5">
                        {dominant.value}%
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Waste breakdown bars */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Waste Breakdown
                </p>
                <WasteBar analysis={result} />
              </div>

              {/* Description */}
              {result.description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Description
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">{result.description}</p>
                </div>
              )}

              {/* Suggested cleanup */}
              {result.suggestedCleanup && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1.5">
                    Suggested Cleanup
                  </p>
                  <p className="text-sm text-emerald-800 leading-relaxed">
                    {result.suggestedCleanup}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  New Analysis
                </button>
                <Link
                  href="/dashboard"
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors text-center"
                >
                  View on Map
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
