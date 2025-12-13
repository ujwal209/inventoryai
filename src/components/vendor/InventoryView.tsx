import { useState, useEffect } from "react";
import { Search, Plus, Trash2, Edit2, X, Save, Upload, Loader2, Image as ImageIcon, CheckCircle, Tag, AlertCircle, ChevronDown, Filter, ArrowLeft, Package, DollarSign, Barcode, Scale, Calendar, ScanLine, Sparkles, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { addInventoryItem, updateInventoryItem, deleteInventoryItem, uploadProductImage, scanProductImage, generateProductImage } from "@/actions/inventory_manager";

interface InventoryViewProps {
  inventory: any[];
}

export default function InventoryView({ inventory }: InventoryViewProps) {
  const [localInventory, setLocalInventory] = useState(inventory);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Sync with prop updates (background revalidation)
  useEffect(() => {
    setLocalInventory(inventory);
  }, [inventory]);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [itemForm, setItemForm] = useState({
    name: "",
    sku: "",
    brand: "",
    category: "",
    quantity: "",
    unit: "pcs",
    minStock: "",
    costPrice: "",
    sellingPrice: "",
    expiryDate: "",
    description: "",
    tags: "",
    image: ""
  });

  const categories = ["All", ...Array.from(new Set(localInventory.map(item => item.category)))];

  const filteredInventory = localInventory.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term);
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddNew = () => {
    setEditingId(null);
    setItemForm({
      name: "", sku: "", brand: "", category: "", quantity: "", unit: "pcs",
      minStock: "", costPrice: "", sellingPrice: "", expiryDate: "", description: "", tags: "", image: ""
    });
    setView('form');
  };

  const handleEdit = (item: any) => {
    setEditingId(item.docId);
    setItemForm({
      name: item.name || "",
      sku: item.sku || "",
      brand: item.brand || "",
      category: item.category || "",
      quantity: item.quantity || "",
      unit: item.unit || "pcs",
      minStock: item.minStock || "",
      costPrice: item.costPrice || "", 
      sellingPrice: item.sellingPrice || item.average_price || "",
      expiryDate: item.expiryDate || "",
      description: item.description || "",
      tags: item.tags ? (Array.isArray(item.tags) ? item.tags.join(', ') : item.tags) : "",
      image: item.image || ""
    });
    setView('form');
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsScanning(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    
    try {
      toast.info("Scanning product details...");
      const { data, imageUrl } = await scanProductImage(formData);
      
      setItemForm(prev => ({
        ...prev,
        name: data.name || prev.name,
        brand: data.brand || prev.brand,
        category: data.category || prev.category,
        description: data.description || prev.description,
        quantity: data.quantity ? String(data.quantity) : prev.quantity,
        unit: data.unit || prev.unit,
        sellingPrice: data.sellingPrice ? String(data.sellingPrice) : prev.sellingPrice,
        costPrice: data.costPrice ? String(data.costPrice) : prev.costPrice,
        sku: data.sku || prev.sku,
        expiryDate: data.expiryDate || prev.expiryDate,
        minStock: data.minStock ? String(data.minStock) : prev.minStock,
        image: imageUrl || prev.image
      }));
      toast.success("Product details extracted!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to scan product");
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  const handleGenerateImage = async () => {
    if (!itemForm.name) {
      toast.error("Please enter a product name first");
      return;
    }
    setGeneratingImage(true);
    try {
      toast.info("Generating AI image... (this may take a few seconds)");
      const description = itemForm.description || (`${itemForm.name} ${itemForm.brand} ${itemForm.category}`);
      const imageUrl = await generateProductImage(description);
      setItemForm(prev => ({ ...prev, image: imageUrl }));
      toast.success("AI Image generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate image");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    try {
      const imageUrl = await uploadProductImage(formData);
      setItemForm(prev => ({ ...prev, image: imageUrl }));
      toast.success("Image uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!itemForm.name || !itemForm.quantity || !itemForm.sellingPrice) {
      toast.error("Please fill required fields (Name, Qty, Selling Price)");
      return;
    }
    setLoading(true);
    try {
      // Parse numbers
      const payload = {
        ...itemForm,
        quantity: Number(itemForm.quantity),
        sellingPrice: Number(itemForm.sellingPrice),
        costPrice: itemForm.costPrice ? Number(itemForm.costPrice) : 0,
        minStock: itemForm.minStock ? Number(itemForm.minStock) : 0,
        tags: itemForm.tags.split(',').map(t => t.trim()).filter(t => t),
        updatedAt: new Date().getTime()
      };

      let result: any;
      if (editingId) {
        result = await updateInventoryItem(editingId, payload);
        // Instant Local Update
        setLocalInventory(prev => prev.map(item => item.docId === editingId ? { ...item, ...result.item } : item));
        toast.success("Product updated successfully");
      } else {
        result = await addInventoryItem(payload);
        // Instant Local Add
        setLocalInventory(prev => [result.item, ...prev]);
        toast.success("Product added successfully");
      }
      setView('list');
    } catch (error) {
      console.error(error);
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (docId: string) => {
    toast("Delete this item?", {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
             // Optimistic Update can be tricky if it fails, but for deletion it's usually safe to wait for promise headers
             const promise = deleteInventoryItem(docId);
             
             toast.promise(promise, {
               loading: 'Deleting...',
               success: () => {
                 setLocalInventory(prev => prev.filter(i => i.docId !== docId));
                 return "Item deleted";
               },
               error: "Failed to delete"
             });
          } catch (error) {
            // Error handled by promise toast
          }
        }
      },
      cancel: { label: "Cancel", onClick: () => {} }
    });
  };

  return (
    <div className="space-y-6 relative h-full">
      {view === 'list' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
           {/* Header & Filters */}
           <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              
              <div className="flex gap-2 items-center overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                {categories.slice(0, 4).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat 
                        ? 'bg-blue-600 text-white shadow-md scale-105' 
                        : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                <button 
                  onClick={handleAddNew}
                  className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
           </div>

           {/* Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
              {filteredInventory.map((item) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={item.docId}
                  className="group bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                   <div className="relative h-48 bg-gray-100 dark:bg-slate-800 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-tr from-gray-50 to-gray-200 dark:from-slate-800 dark:to-slate-700">
                           {item.emoji || '📦'}
                        </div>
                      )}
                      
                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                         <button 
                           onClick={() => handleEdit(item)}
                           className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg"
                           title="Edit"
                         >
                           <Edit2 className="w-5 h-5" />
                         </button>
                         <button 
                           onClick={() => handleDelete(item.docId)}
                           className="p-3 bg-white text-red-500 rounded-full hover:scale-110 transition-transform shadow-lg"
                           title="Delete"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          {item.category}
                        </span>
                      </div>
                   </div>

                   <div className="p-5">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 truncate">{item.name}</h3>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[2.5em]">{item.description || "No description provided."}</p>
                      
                      <div className="flex items-end justify-between border-t border-gray-100 dark:border-slate-800 pt-4">
                         <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Stock</p>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${item.quantity < (item.minStock || 10) ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                {item.quantity} {item.unit || 'pcs'}
                              </span>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Selling Price</p>
                            <p className="font-bold text-blue-600 dark:text-blue-400 text-xl">₹{item.sellingPrice || item.average_price || 0}</p>
                         </div>
                      </div>
                   </div>
                </motion.div>
              ))}
              </AnimatePresence>
           </div>
           
           {filteredInventory.length === 0 && (
             <div className="text-center py-24 opacity-50">
               <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
               <p className="text-xl font-medium text-slate-500">No products found</p>
             </div>
           )}
        </div>
      )}

      {view === 'form' && (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
           {/* Form Header */}
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('list')}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </button>
              <div>
                 <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                   {editingId ? 'Edit Product' : 'New Product'}
                 </h1>
                 <p className="text-slate-500 dark:text-slate-400">
                   {editingId ? 'Update product details and inventory.' : 'Add a new product to your inventory.'}
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Details */}
              <div className="lg:col-span-2 space-y-6">
                 {/* Basic Info */}
                 <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-500" /> Basic Information
                      </h3>
                      <button 
                        onClick={() => document.getElementById('scan-input')?.click()}
                        disabled={isScanning}
                        className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-md shadow-purple-500/20 flex items-center gap-2 hover:scale-105"
                      >
                        {isScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Auto-fill from Image
                      </button>
                      <input 
                        id="scan-input" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleScan} 
                      />
                    </div>
                    
                    <div className="space-y-4">
                       <div>
                         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Product Name *</label>
                         <input 
                           value={itemForm.name}
                           onChange={e => setItemForm({...itemForm, name: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                           placeholder="e.g. Premium Basmati Rice"
                         />
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Category</label>
                            <div className="relative">
                               <input 
                                 value={itemForm.category}
                                 onChange={e => setItemForm({...itemForm, category: e.target.value})}
                                 className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                 placeholder="e.g. Grains"
                               />
                               <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Brand</label>
                            <input 
                               value={itemForm.brand}
                               onChange={e => setItemForm({...itemForm, brand: e.target.value})}
                               className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                               placeholder="e.g. India Gate"
                            />
                          </div>
                       </div>

                       <div>
                         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
                         <textarea 
                           value={itemForm.description}
                           onChange={e => setItemForm({...itemForm, description: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-3 min-h-[100px] focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y"
                           placeholder="Describe the product features..."
                         />
                       </div>
                    </div>
                 </div>

                 {/* Pricing & Inventory */}
                 <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                       <DollarSign className="w-5 h-5 text-green-500" /> Pricing & Inventory
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div>
                         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Selling Price (₹) *</label>
                         <input 
                           type="number"
                           value={itemForm.sellingPrice}
                           onChange={e => setItemForm({...itemForm, sellingPrice: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-3 text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                           placeholder="0.00"
                         />
                       </div>
                       <div>
                         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Cost Price (₹)</label>
                         <input 
                           type="number"
                           value={itemForm.costPrice}
                           onChange={e => setItemForm({...itemForm, costPrice: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                           placeholder="0.00"
                         />
                       </div>

                       <div>
                         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Quantity *</label>
                         <input 
                           type="number"
                           value={itemForm.quantity}
                           onChange={e => setItemForm({...itemForm, quantity: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                           placeholder="0"
                         />
                       </div>
                       <div>
                         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Unit</label>
                         <select 
                            value={itemForm.unit}
                            onChange={e => setItemForm({...itemForm, unit: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                         >
                            <option value="pcs">Pieces (pcs)</option>
                            <option value="kg">Kilogram (kg)</option>
                            <option value="g">Gram (g)</option>
                            <option value="ltr">Liter (ltr)</option>
                            <option value="box">Box</option>
                         </select>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Right Column: Meta & Actions */}
              <div className="space-y-6">
                  {/* Image Upload */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white">Product Image</h3>
                        <button 
                          onClick={handleGenerateImage}
                          disabled={generatingImage || uploadingImage}
                          className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors font-medium"
                        >
                          {generatingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                          Generate with AI
                        </button>
                      </div>
                      <div className="relative group cursor-pointer">
                         <input 
                           type="file" 
                           accept="image/*"
                           onChange={handleImageUpload}
                           className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                           disabled={uploadingImage}
                         />
                         <div className={`border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-4 text-center transition-all ${itemForm.image ? 'bg-gray-50 dark:bg-slate-950' : 'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'}`}>
                            {uploadingImage ? (
                               <div className="py-8 flex flex-col items-center">
                                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                  <span className="text-sm text-slate-500">Uploading...</span>
                               </div>
                            ) : itemForm.image ? (
                               <div className="relative h-48 w-full rounded-lg overflow-hidden">
                                  <img src={itemForm.image} className="w-full h-full object-contain bg-white dark:bg-black/20" />
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                     <span className="text-white text-sm font-medium flex items-center gap-2">
                                       <Upload className="w-4 h-4" /> Change Image
                                     </span>
                                  </div>
                               </div>
                            ) : (
                               <div className="py-10 flex flex-col items-center">
                                  <ImageIcon className="w-10 h-10 text-slate-300 mb-3" />
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload Image</span>
                                  <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</span>
                               </div>
                            )}
                         </div>
                      </div>
                  </div>

                  {/* Extra Meta */}
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                      <h3 className="font-bold text-slate-900 dark:text-white">Additional Details</h3>
                      
                      <div>
                         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block flex items-center gap-2">
                           <Barcode className="w-4 h-4" /> SKU / Barcode
                         </label>
                         <input 
                           value={itemForm.sku}
                           onChange={e => setItemForm({...itemForm, sku: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                           placeholder="AUTO-GEN"
                         />
                      </div>

                      <div>
                         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block flex items-center gap-2">
                           <AlertCircle className="w-4 h-4" /> Low Stock Alert
                         </label>
                         <input 
                           type="number"
                           value={itemForm.minStock}
                           onChange={e => setItemForm({...itemForm, minStock: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                           placeholder="e.g. 10"
                         />
                      </div>

                      <div>
                         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block flex items-center gap-2">
                           <Calendar className="w-4 h-4" /> Expiry Date
                         </label>
                         <input 
                           type="date"
                           value={itemForm.expiryDate}
                           onChange={e => setItemForm({...itemForm, expiryDate: e.target.value})}
                           className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-500"
                         />
                      </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pt-2">
                     <button 
                       onClick={handleSave}
                       disabled={loading || uploadingImage}
                       className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                     >
                       {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                       {editingId ? 'Update Product' : 'Save Product'}
                     </button>
                     <button 
                       onClick={() => setView('list')}
                       className="w-full py-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors"
                     >
                       Cancel
                     </button>
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
