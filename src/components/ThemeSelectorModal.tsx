import React, { useState, useMemo } from 'react';
import {
  Palette,
  Check,
  Sparkles,
  Moon,
  Sun,
  ShieldCheck,
  X,
  Search,
  Award,
  SlidersHorizontal,
  Building,
  Briefcase,
  Layers
} from 'lucide-react';
import { AppTheme, THEME_OPTIONS, ThemeMeta, ThemeCategory } from '../types';

interface ThemeSelectorModalProps {
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  currentTheme,
  onSelectTheme,
  isOpen,
  onClose
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Official & Enterprise');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'Official & Enterprise', label: 'Official & Enterprise', count: 8, icon: Briefcase },
    { id: 'Executive Dark', label: 'Executive Dark', count: 3, icon: Moon },
    { id: 'Specialized & Modern', label: 'Specialized & Modern', count: 5, icon: Layers },
    { id: 'ALL', label: 'All Themes', count: THEME_OPTIONS.length, icon: SlidersHorizontal }
  ];

  const filteredThemes = useMemo(() => {
    return THEME_OPTIONS.filter((theme) => {
      const matchesCategory =
        activeCategory === 'ALL' || theme.category === activeCategory;
      const matchesSearch =
        searchTerm.trim() === '' ||
        theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        theme.tagline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (theme.badgeLabel && theme.badgeLabel.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  const selectedThemeMeta = useMemo(() => {
    return THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];
  }, [currentTheme]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Front-End Theme & Visual Architecture
                </h2>
                <span className="bg-blue-500/10 text-blue-400 text-[11px] px-2 py-0.5 rounded font-semibold border border-blue-500/30">
                  16 Enterprise Themes
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[11px] px-2 py-0.5 rounded font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Official Standards Included
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Select an official corporate, government, or high-contrast theme. Changes apply instantly across all tables, headers, and modules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search theme by name, SAP, NOC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full transition-all"
            />
          </div>
        </div>

        {/* Current Active Preview Strip */}
        <div className="mb-4 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-slate-400 font-medium text-[11px] shrink-0">Currently Applied:</span>
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0"
                style={{ backgroundColor: selectedThemeMeta.accentColor }}
              />
              <span className="font-bold text-white truncate">{selectedThemeMeta.name}</span>
              {selectedThemeMeta.badgeLabel && (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded font-medium border border-amber-500/30 shrink-0 hidden sm:inline">
                  {selectedThemeMeta.badgeLabel}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
              Mode: {selectedThemeMeta.isDark ? 'Dark / NOC' : 'Light / Enterprise'}
            </span>
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
              <span
                className="w-3 h-3 rounded-sm border border-slate-700"
                style={{ backgroundColor: selectedThemeMeta.primaryBg }}
                title="Canvas Background"
              />
              <span
                className="w-3 h-3 rounded-sm border border-slate-700"
                style={{ backgroundColor: selectedThemeMeta.headerBg }}
                title="Header Background"
              />
              <span
                className="w-3 h-3 rounded-sm border border-slate-700"
                style={{ backgroundColor: selectedThemeMeta.cardBg }}
                title="Card Panel Surface"
              />
              <span
                className="w-3 h-3 rounded-sm border border-slate-700"
                style={{ backgroundColor: selectedThemeMeta.accentColor }}
                title="Accent Color"
              />
            </div>
          </div>
        </div>

        {/* Theme Grid Options */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
          {filteredThemes.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => onSelectTheme(theme.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div>
                  {/* Top line with Icon, Title and Selected Checkmark */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {theme.isDark ? (
                        <Moon className="w-4 h-4 text-sky-400 shrink-0" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                        {theme.name}
                      </span>
                      {theme.isOfficial && (
                        <span className="bg-blue-600/20 text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-bold border border-blue-500/30 flex items-center gap-1">
                          <Award className="w-2.5 h-2.5" /> Official
                        </span>
                      )}
                    </div>

                    {isSelected ? (
                      <div className="bg-amber-500 text-slate-950 p-1 rounded-full shrink-0 shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTheme(theme.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-slate-300 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 px-2 py-0.5 rounded transition-all"
                      >
                        Apply
                      </button>
                    )}
                  </div>

                  {/* Tagline / Rationale */}
                  <p className="text-[11px] text-slate-400 leading-snug mb-3">
                    {theme.tagline}
                  </p>
                </div>

                {/* Micro Visual Preview & Swatch Bar */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Simulated Miniature UI Representation */}
                    <div className="flex items-center border border-slate-700 rounded overflow-hidden shadow-inner w-16 h-4 bg-slate-900">
                      <div
                        className="w-4 h-full"
                        style={{ backgroundColor: theme.headerBg }}
                        title="Header Tone"
                      />
                      <div
                        className="flex-1 h-full flex items-center justify-center px-1"
                        style={{ backgroundColor: theme.cardBg }}
                      >
                        <div
                          className="w-3 h-1.5 rounded-xs"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                      </div>
                    </div>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded-full border border-slate-700"
                        style={{ backgroundColor: theme.primaryBg }}
                        title={`Canvas: ${theme.primaryBg}`}
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-slate-700"
                        style={{ backgroundColor: theme.cardBg }}
                        title={`Card: ${theme.cardBg}`}
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-slate-700"
                        style={{ backgroundColor: theme.accentColor }}
                        title={`Accent: ${theme.accentColor}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {theme.badgeLabel && (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700">
                        {theme.badgeLabel}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        theme.isDark
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-slate-100 text-slate-900 font-bold border border-slate-300'
                      }`}
                    >
                      {theme.isDark ? 'Dark' : 'Light'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & Done Button */}
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">
              Selected theme is instantly saved in browser local storage and applied across all modules.
            </span>
            <span className="sm:hidden">
              Theme saved in local storage.
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs transition-all shadow-md cursor-pointer shrink-0"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
