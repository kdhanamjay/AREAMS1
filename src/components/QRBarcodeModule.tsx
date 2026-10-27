import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  QrCode,
  Barcode,
  Grid,
  Check,
  Building2,
  Sliders,
  Sparkles,
  Download,
  FileText,
  Search,
  CheckSquare,
  Square,
  Layers,
  Copy,
  Tag,
  Filter
} from 'lucide-react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import { Asset, Organization, BarcodeType, LabelPrintConfig } from '../types';

export type LabelTemplateType =
  | '40x20'
  | '50x30'
  | '100x50'
  | 'A4_3x8'
  | 'A4_4x10'
  | 'A4_2x5'
  | 'A4_2x7';

interface QRBarcodeModuleProps {
  assets: Asset[];
  organizations: Organization[];
  preSelectedAsset?: Asset | null;
}

interface TemplateSpec {
  id: LabelTemplateType;
  name: string;
  category: 'Thermal Roll' | 'A4 Sheet Grid';
  widthMm: number;
  heightMm: number;
  cols?: number;
  rows?: number;
  perSheet?: number;
  description: string;
}

const TEMPLATE_SPECS: Record<LabelTemplateType, TemplateSpec> = {
  '40x20': {
    id: '40x20',
    name: '40 x 20 mm',
    category: 'Thermal Roll',
    widthMm: 40,
    heightMm: 20,
    description: 'Compact thermal tag for small IT items & cables'
  },
  '50x30': {
    id: '50x30',
    name: '50 x 30 mm',
    category: 'Thermal Roll',
    widthMm: 50,
    heightMm: 30,
    description: 'Standard enterprise barcode & QR asset label'
  },
  '100x50': {
    id: '100x50',
    name: '100 x 50 mm',
    category: 'Thermal Roll',
    widthMm: 100,
    heightMm: 50,
    description: 'Large high-visibility label for machinery & furniture'
  },
  'A4_3x8': {
    id: 'A4_3x8',
    name: 'A4 Sheet: 3 x 8 Grid (24 Labels)',
    category: 'A4 Sheet Grid',
    widthMm: 63.5,
    heightMm: 33.9,
    cols: 3,
    rows: 8,
    perSheet: 24,
    description: 'Universal Avery L7160 / 24-up sticker sheet (63.5 x 33.9mm)'
  },
  'A4_4x10': {
    id: 'A4_4x10',
    name: 'A4 Sheet: 4 x 10 Grid (40 Labels)',
    category: 'A4 Sheet Grid',
    widthMm: 48.5,
    heightMm: 25.4,
    cols: 4,
    rows: 10,
    perSheet: 40,
    description: 'High-density 40-up sticker sheet (48.5 x 25.4mm)'
  },
  'A4_2x5': {
    id: 'A4_2x5',
    name: 'A4 Sheet: 2 x 5 Grid (10 Labels)',
    category: 'A4 Sheet Grid',
    widthMm: 99.1,
    heightMm: 57.0,
    cols: 2,
    rows: 5,
    perSheet: 10,
    description: 'Large 10-up sticker sheet for detailed inspection tags'
  },
  'A4_2x7': {
    id: 'A4_2x7',
    name: 'A4 Sheet: 2 x 7 Grid (14 Labels)',
    category: 'A4 Sheet Grid',
    widthMm: 99.1,
    heightMm: 38.1,
    cols: 2,
    rows: 7,
    perSheet: 14,
    description: 'Standard 14-up sticker sheet for equipment tracking'
  }
};

export const QRBarcodeModule: React.FC<QRBarcodeModuleProps> = ({
  assets,
  organizations,
  preSelectedAsset
}) => {
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(
    preSelectedAsset ? [preSelectedAsset.id] : assets.slice(0, 4).map((a) => a.id)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [orgFilter, setOrgFilter] = useState('ALL');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Label configuration
  const [template, setTemplate] = useState<LabelTemplateType>('50x30');
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('Code128');
  const [copies, setCopies] = useState<number>(1);

  // Field toggles
  const [showQrCode, setShowQrCode] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showAllocationNo, setShowAllocationNo] = useState(true);
  const [showSerialNo, setShowSerialNo] = useState(true);
  const [showPlaceOfAsset, setShowPlaceOfAsset] = useState(true);
  const [showDivision, setShowDivision] = useState(true);

  const spec = TEMPLATE_SPECS[template];

  // Filtered assets list
  const filteredAssets = assets.filter((a) => {
    const matchesOrg = orgFilter === 'ALL' || a.organizationId === orgFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      a.assetTag.toLowerCase().includes(q) ||
      a.particulars.toLowerCase().includes(q) ||
      a.assetAllocationNumber?.toLowerCase().includes(q) ||
      a.assetSerialNumber?.toLowerCase().includes(q) ||
      a.division?.toLowerCase().includes(q) ||
      a.placeOfAsset?.toLowerCase().includes(q);

    return matchesOrg && matchesSearch;
  });

  const selectedAssets = assets.filter((a) => selectedAssetIds.includes(a.id));

  // Expanded asset queue taking 'copies' into account
  const labelQueue: Asset[] = [];
  selectedAssets.forEach((ast) => {
    for (let c = 0; c < Math.max(1, copies); c++) {
      labelQueue.push(ast);
    }
  });

  // Handle Select All / Deselect All
  const handleSelectAll = () => {
    if (selectedAssetIds.length === filteredAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(filteredAssets.map((a) => a.id));
    }
  };

  // Browser Direct Print
  const handlePrint = () => {
    window.print();
  };

  // High Quality PDF Export Generator using jsPDF
  const handleGeneratePDF = async () => {
    if (labelQueue.length === 0) {
      alert('Please select at least one asset to generate label PDF.');
      return;
    }

    setIsGeneratingPdf(true);

    try {
      // Helper to generate QR data URL
      const getQrDataUrl = async (text: string) => {
        return await QRCode.toDataURL(text, {
          margin: 0,
          width: 300,
          errorCorrectionLevel: 'M'
        });
      };

      // Helper to generate Barcode data URL
      const getBarcodeDataUrl = (codeText: string) => {
        const canvas = document.createElement('canvas');
        try {
          JsBarcode(canvas, codeText, {
            format: barcodeType || 'CODE128',
            width: 2,
            height: 50,
            displayValue: false,
            margin: 0,
            background: '#ffffff',
            lineColor: '#000000'
          });
          return canvas.toDataURL('image/png');
        } catch (err) {
          console.warn('Barcode generation fallback:', err);
          return null;
        }
      };

      if (spec.category === 'Thermal Roll') {
        // Individual continuous / single thermal sticker roll mode
        const pdf = new jsPDF({
          orientation: spec.widthMm >= spec.heightMm ? 'l' : 'p',
          unit: 'mm',
          format: [spec.widthMm, spec.heightMm]
        });

        for (let i = 0; i < labelQueue.length; i++) {
          if (i > 0) {
            pdf.addPage([spec.widthMm, spec.heightMm], spec.widthMm >= spec.heightMm ? 'l' : 'p');
          }

          const asset = labelQueue[i];
          const org = organizations.find((o) => o.id === asset.organizationId);
          await renderSingleLabelOnPdf(
            pdf,
            0,
            0,
            spec.widthMm,
            spec.heightMm,
            asset,
            org,
            getQrDataUrl,
            getBarcodeDataUrl
          );
        }

        pdf.save(`Amara_Raja_Labels_${spec.id}_${labelQueue.length}pcs.pdf`);
      } else {
        // A4 Sheet Grid Layout
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = 210;
        const pageHeight = 297;

        const cols = spec.cols || 3;
        const rows = spec.rows || 8;
        const perPage = cols * rows;

        const labelW = spec.widthMm;
        const labelH = spec.heightMm;

        // Calculate auto margins for standard centered sheets
        const totalGridW = cols * labelW;
        const marginX = (pageWidth - totalGridW) / (cols + 1);
        const gapX = marginX;

        const totalGridH = rows * labelH;
        const marginY = Math.max(10, (pageHeight - totalGridH) / 2);
        const gapY = (pageHeight - marginY * 2 - rows * labelH) / (rows - 1 || 1);

        for (let i = 0; i < labelQueue.length; i++) {
          const pageIndex = Math.floor(i / perPage);
          const itemOnPage = i % perPage;

          if (i > 0 && itemOnPage === 0) {
            pdf.addPage('a4', 'p');
          }

          const col = itemOnPage % cols;
          const row = Math.floor(itemOnPage / cols);

          const x = marginX + col * (labelW + gapX);
          const y = marginY + row * (labelH + (gapY > 0 ? gapY : 0));

          const asset = labelQueue[i];
          const org = organizations.find((o) => o.id === asset.organizationId);

          await renderSingleLabelOnPdf(
            pdf,
            x,
            y,
            labelW,
            labelH,
            asset,
            org,
            getQrDataUrl,
            getBarcodeDataUrl,
            true // Draw boundary outline box
          );
        }

        pdf.save(`Amara_Raja_A4_Sheet_Labels_${labelQueue.length}pcs.pdf`);
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Error generating PDF labels. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Helper method to draw a single sticker label cleanly in jsPDF
  const renderSingleLabelOnPdf = async (
    pdf: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    asset: Asset,
    org?: Organization,
    getQrDataUrl?: (txt: string) => Promise<string>,
    getBarcodeDataUrl?: (txt: string) => string | null,
    drawBorder: boolean = false
  ) => {
    const pad = Math.max(1.5, w * 0.03);

    // Optional border guideline box
    if (drawBorder) {
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.15);
      pdf.rect(x, y, w, h);
    }

    let curY = y + pad + 2;

    // Header Logo Line
    if (showLogo) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(w < 50 ? 6 : w < 80 ? 8 : 10);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('AMARA RAJA GROUP', x + pad, curY);

      pdf.setFontSize(w < 50 ? 5 : 7);
      pdf.setTextColor(180, 83, 9); // amber-700
      pdf.text(org?.shortCode || 'EAMS', x + w - pad, curY, { align: 'right' });

      curY += w < 50 ? 2.5 : 3.5;
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.2);
      pdf.line(x + pad, curY, x + w - pad, curY);
      curY += 2.5;
    }

    // Prepare QR Code & Barcode Data URLs
    const qrText = JSON.stringify({
      tag: asset.assetTag,
      alloc: asset.assetAllocationNumber,
      sn: asset.assetSerialNumber,
      loc: asset.assetLocationCode
    });

    const qrDataUrl = showQrCode && getQrDataUrl ? await getQrDataUrl(qrText) : null;
    const barcodeDataUrl = showBarcode && getBarcodeDataUrl ? getBarcodeDataUrl(asset.assetTag) : null;

    // Calculate QR dimension
    const qrSize = showQrCode ? Math.min(h * 0.45, w * 0.28) : 0;
    const qrX = x + w - pad - qrSize;
    const qrY = curY;

    if (qrDataUrl) {
      pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    }

    // Left Info Column Width
    const infoW = showQrCode ? w - qrSize - pad * 2.5 : w - pad * 2;

    // Asset Tag ID
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(w < 50 ? 7 : w < 80 ? 9 : 11);
    pdf.setTextColor(180, 83, 9); // amber-700
    pdf.text(asset.assetTag, x + pad, curY);
    curY += w < 50 ? 2.5 : 3.5;

    // Particulars
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(w < 50 ? 6 : w < 80 ? 7.5 : 9);
    pdf.setTextColor(15, 23, 42);
    const splitPart = pdf.splitTextToSize(asset.particulars || 'Asset Item', infoW);
    pdf.text(splitPart.slice(0, 1), x + pad, curY);
    curY += w < 50 ? 2.5 : 3.2;

    // Allocation Number
    if (showAllocationNo && asset.assetAllocationNumber) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(w < 50 ? 5 : 6.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Alloc #: ${asset.assetAllocationNumber}`, x + pad, curY);
      curY += w < 50 ? 2.2 : 2.8;
    }

    // Serial Number
    if (showSerialNo && asset.assetSerialNumber) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(w < 50 ? 5 : 6.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`S/N: ${asset.assetSerialNumber}`, x + pad, curY);
      curY += w < 50 ? 2.2 : 2.8;
    }

    // Location & Place of Asset
    if (showLocation && asset.assetLocationCode) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(w < 50 ? 4.5 : 6);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Loc: ${asset.assetLocationCode}`, x + pad, curY);
      curY += w < 50 ? 2 : 2.5;
    }

    if (showPlaceOfAsset && asset.placeOfAsset) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(w < 50 ? 4.5 : 5.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Place: ${asset.placeOfAsset}`, x + pad, curY);
    }

    // 1D Barcode at Bottom
    if (showBarcode && barcodeDataUrl) {
      const barH = Math.min(8, h * 0.22);
      const barW = w - pad * 2;
      const barY = y + h - pad - barH;

      pdf.addImage(barcodeDataUrl, 'PNG', x + pad, barY, barW, barH);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <QrCode className="w-6 h-6 text-amber-400" />
            <span>QR Code & Barcode Label Print Studio</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Format asset sticker labels for Zebra/TVS Thermal Printers (40x20, 50x30, 100x50mm) or A4 Sticker Sheets (24, 40, 10, 14-up).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGeneratePDF}
            disabled={isGeneratingPdf || selectedAssetIds.length === 0}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : `Download Printable PDF (${labelQueue.length} Labels)`}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={selectedAssetIds.length === 0}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Direct Browser Print</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Config Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Label Layout & Paper Template</span>
            </h2>
            <span className="text-[10px] bg-slate-800 text-amber-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              {spec.category}
            </span>
          </div>

          {/* Template Selector Grid */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-2">Select Printer Paper Format</label>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {(Object.keys(TEMPLATE_SPECS) as LabelTemplateType[]).map((tmplKey) => {
                const item = TEMPLATE_SPECS[tmplKey];
                const isSelected = template === tmplKey;

                return (
                  <button
                    key={tmplKey}
                    onClick={() => setTemplate(tmplKey)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{item.name}</span>
                        {item.category === 'A4 Sheet Grid' && (
                          <span className="text-[9px] bg-slate-800 text-emerald-400 px-1.5 rounded">
                            {item.perSheet} Stickers/Page
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Copies & Barcode Format */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1">
                <Copy className="w-3.5 h-3.5 text-amber-400" /> Copies Per Asset
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1">
                <Barcode className="w-3.5 h-3.5 text-amber-400" /> 1D Barcode Standard
              </label>
              <select
                value={barcodeType}
                onChange={(e) => setBarcodeType(e.target.value as BarcodeType)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Code128">Code 128 (Universal)</option>
                <option value="Code39">Code 39 (Alphanumeric)</option>
                <option value="EAN13">EAN 13 (Global Numeric)</option>
              </select>
            </div>
          </div>

          {/* Included Fields Toggles */}
          <div className="space-y-2 border-t border-slate-800 pt-3">
            <p className="text-slate-400 text-xs font-semibold">Included Sticker Elements</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>2D QR Code</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => setShowBarcode(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>1D Barcode</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Group Logo Header</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAllocationNo}
                  onChange={(e) => setShowAllocationNo(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Allocation No.</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showSerialNo}
                  onChange={(e) => setShowSerialNo(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Serial Number</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showLocation}
                  onChange={(e) => setShowLocation(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Location Code</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPlaceOfAsset}
                  onChange={(e) => setShowPlaceOfAsset(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Place of Asset</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDivision}
                  onChange={(e) => setShowDivision(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Division</span>
              </label>
            </div>
          </div>

          {/* Asset Selection Drawer */}
          <div className="border-t border-slate-800 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-xs font-bold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Select Assets to Print ({selectedAssetIds.length}/{filteredAssets.length})</span>
              </span>
              <button
                onClick={handleSelectAll}
                className="text-amber-400 text-[10px] hover:underline cursor-pointer font-bold"
              >
                {selectedAssetIds.length === filteredAssets.length ? 'Deselect All' : 'Select Filtered'}
              </button>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-[11px] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Organizations</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.shortCode}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1 pr-1 text-xs">
              {filteredAssets.map((a) => {
                const isSelected = selectedAssetIds.includes(a.id);
                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedAssetIds(selectedAssetIds.filter((id) => id !== a.id));
                      } else {
                        setSelectedAssetIds([...selectedAssetIds, a.id]);
                      }
                    }}
                    className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="font-mono font-bold text-[11px]">{a.assetTag}</p>
                      <p className="text-[10px] text-slate-400 truncate">{a.particulars}</p>
                      {a.assetAllocationNumber && (
                        <p className="text-[9px] text-slate-500">Alloc: {a.assetAllocationNumber}</p>
                      )}
                    </div>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Live Printable Layout Canvas (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div>
              <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Print Preview Canvas</span>
              </h2>
              <p className="text-slate-400 text-[11px]">
                Showing preview for <strong className="text-amber-300">{spec.name}</strong> ({labelQueue.length} sticker copies queued)
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-200">
                Size: {spec.widthMm}mm x {spec.heightMm}mm
              </span>
            </div>
          </div>

          {/* Interactive Sheet Container */}
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl min-h-[550px] max-h-[700px] overflow-y-auto print:bg-white print:p-0 print:border-none">
            
            {spec.category === 'A4 Sheet Grid' ? (
              <div className="bg-white text-slate-950 p-6 rounded-lg shadow-2xl max-w-[650px] mx-auto min-h-[800px] border border-slate-300 space-y-4">
                <div className="border-b border-slate-200 pb-2 text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest print:hidden">
                  A4 Sticker Sheet Printable Paper Preview ({spec.cols} x {spec.rows} Grid)
                </div>

                <div
                  className="grid gap-3 items-start"
                  style={{
                    gridTemplateColumns: `repeat(${spec.cols || 3}, minmax(0, 1fr))`
                  }}
                >
                  {labelQueue.map((asset, idx) => (
                    <PreviewLabelSticker
                      key={`${asset.id}-${idx}`}
                      asset={asset}
                      organization={organizations.find((o) => o.id === asset.organizationId)}
                      spec={spec}
                      showQrCode={showQrCode}
                      showBarcode={showBarcode}
                      showLogo={showLogo}
                      showLocation={showLocation}
                      showAllocationNo={showAllocationNo}
                      showSerialNo={showSerialNo}
                      showPlaceOfAsset={showPlaceOfAsset}
                      showDivision={showDivision}
                      barcodeType={barcodeType}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 items-start justify-center">
                {labelQueue.map((asset, idx) => (
                  <PreviewLabelSticker
                    key={`${asset.id}-${idx}`}
                    asset={asset}
                    organization={organizations.find((o) => o.id === asset.organizationId)}
                    spec={spec}
                    showQrCode={showQrCode}
                    showBarcode={showBarcode}
                    showLogo={showLogo}
                    showLocation={showLocation}
                    showAllocationNo={showAllocationNo}
                    showSerialNo={showSerialNo}
                    showPlaceOfAsset={showPlaceOfAsset}
                    showDivision={showDivision}
                    barcodeType={barcodeType}
                  />
                ))}
              </div>
            )}

            {labelQueue.length === 0 && (
              <div className="text-center py-28 text-slate-500 text-xs flex flex-col items-center gap-2">
                <QrCode className="w-10 h-10 text-slate-700" />
                <p>No assets currently selected in the left drawer.</p>
                <p className="text-slate-600">Select one or more assets to render label stickers.</p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

// Component for single rendered sticker preview
const PreviewLabelSticker: React.FC<{
  asset: Asset;
  organization?: Organization;
  spec: TemplateSpec;
  showQrCode: boolean;
  showBarcode: boolean;
  showLogo: boolean;
  showLocation: boolean;
  showAllocationNo: boolean;
  showSerialNo: boolean;
  showPlaceOfAsset: boolean;
  showDivision: boolean;
  barcodeType: BarcodeType;
}> = ({
  asset,
  organization,
  spec,
  showQrCode,
  showBarcode,
  showLogo,
  showLocation,
  showAllocationNo,
  showSerialNo,
  showPlaceOfAsset,
  showDivision,
  barcodeType
}) => {
  const qrRef = useRef<HTMLCanvasElement | null>(null);
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (showQrCode && qrRef.current) {
      const qrData = JSON.stringify({
        tag: asset.assetTag,
        alloc: asset.assetAllocationNumber,
        sn: asset.assetSerialNumber,
        loc: asset.assetLocationCode
      });
      QRCode.toCanvas(qrRef.current, qrData, {
        width: spec.widthMm < 50 ? 40 : 60,
        margin: 0
      });
    }

    if (showBarcode && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, asset.assetTag, {
          format: barcodeType || 'CODE128',
          width: 1,
          height: spec.heightMm < 25 ? 18 : 26,
          displayValue: false,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (err) {
        console.warn(err);
      }
    }
  }, [
    asset,
    spec,
    showQrCode,
    showBarcode,
    barcodeType
  ]);

  return (
    <div
      className="bg-white text-slate-950 font-sans border border-slate-300 rounded shadow-md flex flex-col justify-between shrink-0 p-2 overflow-hidden print:break-inside-avoid"
      style={{
        width: `${Math.min(spec.widthMm * 3.8, 320)}px`,
        minHeight: `${Math.min(spec.heightMm * 3.8, 180)}px`
      }}
    >
      {/* Header */}
      {showLogo && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-1 font-bold text-[9px] text-slate-900">
          <span>AMARA RAJA GROUP</span>
          <span className="text-[8px] text-amber-700 font-mono">{organization?.shortCode || 'EAMS'}</span>
        </div>
      )}

      {/* Main Body */}
      <div className="flex items-start justify-between gap-1.5 my-1">
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="font-mono font-bold text-amber-700 text-[10px] leading-tight truncate">
            {asset.assetTag}
          </p>
          <p className="font-extrabold text-slate-950 text-[10px] leading-tight line-clamp-1">
            {asset.particulars}
          </p>

          {showAllocationNo && asset.assetAllocationNumber && (
            <p className="text-[8px] text-slate-600 truncate font-mono">
              Alloc #: {asset.assetAllocationNumber}
            </p>
          )}

          {showSerialNo && asset.assetSerialNumber && (
            <p className="text-[8px] text-slate-600 truncate font-mono">
              S/N: {asset.assetSerialNumber}
            </p>
          )}

          {showLocation && asset.assetLocationCode && (
            <p className="text-[8px] text-slate-500 font-mono truncate">
              Loc: {asset.assetLocationCode}
            </p>
          )}

          {showPlaceOfAsset && asset.placeOfAsset && (
            <p className="text-[7.5px] text-slate-500 truncate">
              Place: {asset.placeOfAsset}
            </p>
          )}
        </div>

        {showQrCode && (
          <div className="shrink-0 bg-white p-0.5 border border-slate-200 rounded">
            <canvas ref={qrRef} className="block" />
          </div>
        )}
      </div>

      {/* Barcode Footer */}
      {showBarcode && (
        <div className="text-center pt-0.5 border-t border-slate-100 flex flex-col items-center">
          <svg ref={barcodeRef} className="max-w-full" />
        </div>
      )}
    </div>
  );
};
