import React, { useState } from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Tags, Plus, Layers, Trash2, X, PlusCircle } from 'lucide-react';
import { AssetCategory, AssetSubCategory } from '../types';

interface CategoryMasterProps {
  categories: AssetCategory[];
  subCategories: AssetSubCategory[];
  onSaveCategory: (cat: AssetCategory) => Promise<void>;
  onSaveSubCategory: (subCat: AssetSubCategory) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
  onDeleteSubCategory?: (id: string) => Promise<void>;
}

export const CategoryMaster: React.FC<CategoryMasterProps> = ({
  categories,
  subCategories,
  onSaveCategory,
  onSaveSubCategory,
  onDeleteCategory,
  onDeleteSubCategory
}) => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDescription, setCatDescription] = useState('');

  // SubCategory Form State
  const [selectedParentCatId, setSelectedParentCatId] = useState('');
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCat: AssetCategory = {
      id: `cat-${Date.now()}`,
      name: catName,
      code: catCode.toUpperCase(),
      description: catDescription
    };
    await onSaveCategory(newCat);
    setShowCategoryModal(false);
    setCatName('');
    setCatCode('');
    setCatDescription('');
  };

  const handleCreateSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentCatId) return;
    const newSub: AssetSubCategory = {
      id: `sub-${Date.now()}`,
      categoryId: selectedParentCatId,
      name: subName,
      code: subCode.toUpperCase()
    };
    await onSaveSubCategory(newSub);
    setShowSubModal(false);
    setSubName('');
    setSubCode('');
  };

  const openAddSubForCategory = (catId: string) => {
    setSelectedParentCatId(catId);
    setShowSubModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Tags className="w-6 h-6 text-amber-400" />
            <span>Asset Categories & Subcategories Master</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage asset classification schemas, parent categories & detailed subcategory tags</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (categories.length > 0) setSelectedParentCatId(categories[0].id);
              setShowSubModal(true);
            }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold px-3.5 py-2 rounded-xl text-xs shadow-md cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>+ Add Subcategory</span>
          </button>

          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Main Category</span>
          </button>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const subs = subCategories.filter((s) => s.categoryId === cat.id);
          return (
            <div key={cat.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    CODE: {cat.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">{subs.length} Subcategories</span>
                    {onDeleteCategory && (
                      <button
                        onClick={() => {
                          setDeleteConfirm({
                            isOpen: true,
                            title: `Delete Category "${cat.name}"`,
                            message: `Are you sure you want to delete category "${cat.name}" and its subcategories?`,
                            onConfirm: () => onDeleteCategory(cat.id)
                          });
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-white text-base tracking-tight">{cat.name}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{cat.description || 'General asset classification group'}</p>
              </div>

              {/* Subcategories section */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-400" /> Subcategories
                  </p>
                  <button
                    onClick={() => openAddSubForCategory(cat.id)}
                    className="text-[11px] text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Add Sub</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                  {subs.map((s) => (
                    <span
                      key={s.id}
                      className="group inline-flex items-center gap-1 bg-slate-800/90 text-slate-200 border border-slate-700/80 text-[11px] px-2.5 py-1 rounded-lg font-medium shadow-sm hover:border-amber-500/50 transition-all"
                    >
                      <span>{s.name}</span>
                      <span className="text-[9px] text-amber-400 font-mono font-bold">({s.code})</span>
                      {onDeleteSubCategory && (
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              title: `Delete Subcategory "${s.name}"`,
                              message: `Are you sure you want to remove subcategory "${s.name}"?`,
                              onConfirm: () => onDeleteSubCategory(s.id)
                            });
                          }}
                          className="text-slate-400 hover:text-rose-400 ml-0.5 cursor-pointer"
                          title="Delete Subcategory"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {subs.length === 0 && (
                    <span className="text-slate-500 text-[11px] italic">No subcategories defined for this group.</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Tags className="w-5 h-5 text-amber-400" />
                <span>Create Asset Category</span>
              </h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. CCTV & Security Equipment"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Category Short Code *</label>
                <input
                  type="text"
                  required
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SEC"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  placeholder="General asset group scope and usage specs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SUBCATEGORY MODAL */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>Create New Subcategory</span>
              </h2>
              <button onClick={() => setShowSubModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Parent Category *</label>
                <select
                  required
                  value={selectedParentCatId}
                  onChange={(e) => setSelectedParentCatId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Subcategory Name *</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. 4K Dome IP Camera / Modular Workstation"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Subcategory Short Code *</label>
                <input
                  type="text"
                  required
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CAM / DSK / LAP"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        onConfirm={deleteConfirm.onConfirm}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};
