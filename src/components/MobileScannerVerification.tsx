import React, { useState, useEffect } from 'react';
import {
  ScanLine,
  Camera,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Upload,
  Search,
  Building2,
  X,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Asset, Organization, Room, PhysicalVerification, VerificationStatus } from '../types';

interface MobileScannerVerificationProps {
  assets: Asset[];
  organizations: Organization[];
  rooms: Room[];
  onSaveVerification: (verification: PhysicalVerification) => Promise<void>;
  onClose?: () => void;
}

export const MobileScannerVerification: React.FC<MobileScannerVerificationProps> = ({
  assets,
  organizations,
  rooms,
  onSaveVerification,
  onClose
}) => {
  const [scannedAssetTag, setScannedAssetTag] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('Present');
  const [locationMatched, setLocationMatched] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [photoProof, setPhotoProof] = useState<string | null>(null);
  const [verifierName, setVerifierName] = useState('V. Naresh Kumar');
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [cameraActive, setCameraActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Capture Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Location permission disabled or unavailable')
      );
    }
  }, []);

  // HTML5 Camera QR Scanner
  useEffect(() => {
    if (!cameraActive) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader-div',
      { fps: 10, qrbox: { width: 220, height: 220 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        let tag = decodedText;
        try {
          const parsed = JSON.parse(decodedText);
          if (parsed.assetTag) tag = parsed.assetTag;
          if (parsed.tag) tag = parsed.tag;
        } catch {
          // Plain text tag
        }

        const found = assets.find((a) => a.assetTag.toLowerCase() === tag.toLowerCase());
        if (found) {
          setSelectedAsset(found);
          setScannedAssetTag(found.assetTag);
          setCameraActive(false);
          scanner.clear();
        } else {
          setScannedAssetTag(tag);
        }
      },
      (error) => {
        // scan frame error
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [cameraActive, assets]);

  // Manual Tag Search
  const handleSearchAsset = (tagInput: string) => {
    setScannedAssetTag(tagInput);
    const found = assets.find(
      (a) => a.assetTag.toLowerCase() === tagInput.trim().toLowerCase() || a.id === tagInput.trim()
    );
    if (found) setSelectedAsset(found);
  };

  // Submit Audit
  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    setIsSubmitting(true);
    const auditRecord: PhysicalVerification = {
      id: `ver-${Date.now()}`,
      assetId: selectedAsset.id,
      assetTag: selectedAsset.assetTag,
      assetName: selectedAsset.particulars,
      verifiedBy: verifierName,
      verifiedDate: new Date().toISOString(),
      verificationStatus,
      locationMatched,
      actualRoomId: selectedAsset.roomId,
      photoCaptured: photoProof || selectedAsset.assetPhoto,
      remarks,
      latitude: coords.lat,
      longitude: coords.lng
    };

    await onSaveVerification(auditRecord);
    setIsSubmitting(false);
    setSuccessMessage(`Physical verification logged for ${selectedAsset.assetTag}!`);
    setTimeout(() => {
      setSuccessMessage(null);
      setSelectedAsset(null);
      setScannedAssetTag('');
      setRemarks('');
    }, 2000);
  };

  // Sample photo upload simulation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoProof(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Mobile Friendly Card Shell */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 text-amber-400 p-3 rounded-2xl border border-amber-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Physical Asset Audit Scanner</h1>
              <p className="text-slate-400 text-xs">Scan asset QR code or enter tag to perform physical audit</p>
            </div>
          </div>

          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-xl cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 p-4 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Step 1: Scan / Search Input */}
        <div className="space-y-3 bg-slate-850 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Scan Tag or Enter Asset ID</span>
            <button
              onClick={() => setCameraActive(!cameraActive)}
              className="text-amber-400 text-xs flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{cameraActive ? 'Close Camera' : 'Open Camera Scanner'}</span>
            </button>
          </p>

          {/* Camera Viewfinder */}
          {cameraActive && (
            <div className="bg-black rounded-xl p-2 border border-amber-500/40">
              <div id="qr-reader-div" className="w-full text-white"></div>
            </div>
          )}

          {/* Search Bar Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Scan or type asset tag e.g. ARG-ARVD-IT-2026-0001"
                value={scannedAssetTag}
                onChange={(e) => handleSearchAsset(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Recognized Asset Display */}
        {selectedAsset ? (
          <form onSubmit={handleSubmitAudit} className="space-y-5 animate-in fade-in duration-300">
            
            <div className="bg-slate-800/80 border border-amber-500/30 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-extrabold text-amber-400">{selectedAsset.assetTag}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
                  {selectedAsset.assetStatus}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">{selectedAsset.particulars}</h3>
              <p className="text-slate-400 text-xs">{selectedAsset.description}</p>
              
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-750 text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>Location: {selectedAsset.assetLocationCode}</span>
                <span className="text-slate-400">S/N: {selectedAsset.assetSerialNumber}</span>
              </div>
            </div>

            {/* Audit Status Buttons */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider">
                Mark Physical Status *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'Present', label: 'Present & OK', color: 'bg-emerald-500/20 border-emerald-500 text-emerald-300' },
                  { id: 'Missing', label: 'Missing / Not Found', color: 'bg-rose-500/20 border-rose-500 text-rose-300' },
                  { id: 'Damaged', label: 'Damaged', color: 'bg-amber-500/20 border-amber-500 text-amber-300' },
                  { id: 'Repair Needed', label: 'Repair Needed', color: 'bg-orange-500/20 border-orange-500 text-orange-300' },
                  { id: 'Disposed', label: 'Scrapped / Disposed', color: 'bg-slate-800 border-slate-600 text-slate-300' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setVerificationStatus(s.id as VerificationStatus)}
                    className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      verificationStatus === s.id ? `${s.color} ring-2 ring-amber-500/50` : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Checkbox */}
            <label className="flex items-center gap-2 bg-slate-850 p-3 rounded-xl border border-slate-800 text-xs text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={locationMatched}
                onChange={(e) => setLocationMatched(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>Asset is located in assigned Room / Area</span>
            </label>

            {/* Photo Attachment */}
            <div className="space-y-1">
              <label className="block text-slate-400 text-xs font-semibold">Capture Photo Proof</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>
              {photoProof && (
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-amber-500 mt-2">
                  <img src={photoProof} alt="Proof" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1">Verifier Remarks / Notes</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Note down any physical tags issues, damage details, or location mismatch..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* GPS Metadata */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-850 p-2.5 rounded-xl border border-slate-800 font-mono">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>GPS: {coords.lat ? `${coords.lat.toFixed(4)}, ${coords.lng?.toFixed(4)}` : 'Acquiring GPS...'}</span>
              </span>
              <span>Verifier: {verifierName}</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-2xl text-xs shadow-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Submit Verification Audit Log</span>
            </button>

          </form>
        ) : (
          <div className="text-center py-10 space-y-2">
            <ScanLine className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
            <p className="text-slate-400 text-xs font-semibold">Scan QR code sticker on physical asset to start audit</p>
          </div>
        )}

      </div>

    </div>
  );
};
