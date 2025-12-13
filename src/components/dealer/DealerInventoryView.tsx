'use client';

import { useState,useEffect } from "react";
import { Search, Plus, Trash2, Edit2, Loader2, Upload, ArrowLeft, Package, AlertCircle, Save, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addInventoryItem, deleteInventoryItem, uploadProductImage, updateInventoryItem } from "@/actions/inventory_manager";
import { toast } from 'sonner';


interface DealerInventoryViewProps {
  inventory: any[];
}

export default function DealerInventoryView({ inventory }: DealerInventoryViewProps) {
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  
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

  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Search local inventory
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [allCategories, setAllCategories] = useState<string[]>([]); // To store all fetched categories

  useEffect(() => {
    // Fetch categories on mount
    fetch('https://dummyjson.com/products/category-list')
      .then(res => res.json())
      .then(data => setAllCategories(data))
      .catch(err => console.error("Failed to fetch categories", err));
  }, []);

  const handleCategoryChange = (val: string) => {
    setItemForm(prev => ({ ...prev, category: val }));
    if (val.length > 0) {
      const filtered = allCategories.filter(c => c.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
      setCategorySuggestions(filtered);
      setShowCategorySuggestions(true);
    } else {
      setShowCategorySuggestions(false);
    }
  };

  const selectCategory = (cat: string) => {
      setItemForm(prev => ({ ...prev, category: cat }));
      setShowCategorySuggestions(false);
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNameChange = async (val: string) => {
    setItemForm(prev => ({ ...prev, name: val }));
    if (val.length > 2) {
      try {
        const res = await fetch(`https://dummyjson.com/products/search?q=${val}`);
        const data = await res.json();
        setActiveSuggestions(data.products.slice(0, 5));
        setShowSuggestions(true);
      } catch (e) { console.error(e); }
    } else { setShowSuggestions(false); }
  };

  const selectSuggestion = (product: any) => {
    setItemForm(prev => ({
      ...prev,
      name: product.title,
      description: product.description,
      category: product.category,
      brand: product.brand,
      sellingPrice: product.price,
      costPrice: (product.price * 0.8).toFixed(2), // Mock margin
      sku: `SKU-${Math.floor(Math.random() * 10000)}`
    }));
    setShowSuggestions(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    try {
      const imageUrl = await uploadProductImage(formData);
      setItemForm(prev => ({ ...prev, image: imageUrl }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (item: any) => {
    setItemForm({
      name: item.name,
      sku: item.sku || "",
      brand: item.brand || "",
      category: item.category || "",
      quantity: item.quantity,
      unit: item.unit || "pcs",
      minStock: item.minStock || "",
      costPrice: item.average_price || "", 
      sellingPrice: item.sellingPrice || "",
      expiryDate: item.expiryDate || "",
      description: item.description || "",
      tags: item.tags ? item.tags.join(', ') : "",
      image: item.image || ""
    });
    setEditingId(item.docId);
    setView('add');
  };

  const handleSave = async () => {
    if (!itemForm.name || !itemForm.quantity || !itemForm.sellingPrice) {
      toast.error("Please fill required fields (Name, Qty, Selling Price)");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...itemForm,
        price: itemForm.sellingPrice 
      };
      
      if (editingId) {
        await updateInventoryItem(editingId, payload);
        toast.success("Product updated successfully");
      } else {
        await addInventoryItem(payload);
        toast.success("Product added successfully");
      }

      setView('list');
      setEditingId(null);
      setItemForm({     
        name: "", sku: "", brand: "", category: "", quantity: "", unit: "pcs",
        minStock: "", costPrice: "", sellingPrice: "", expiryDate: "", description: "", tags: "", image: ""
      });
    } catch (error) {
      console.error(error);
      toast.error(editingId ? "Failed to update product" : "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {view === 'list' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div>
               <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Inventory</h1>
               <p className="text-slate-500 dark:text-slate-400">Manage products you stock and supply.</p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <button 
                 onClick={() => {
                   setEditingId(null);
                   setItemForm({     
                     name: "", sku: "", brand: "", category: "", quantity: "", unit: "pcs",
                     minStock: "", costPrice: "", sellingPrice: "", expiryDate: "", description: "", tags: "", image: ""
                   });
                   setView('add');
                 }}
                 className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap"
              >
                 <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredInventory.map((item) => (
              <motion.div
                key={item.docId}
                layoutId={item.docId}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
              >
                <div className="h-40 bg-gray-100 dark:bg-slate-800 relative">
                   {item.image ? (
                     <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-4xl">{item.emoji || '📦'}</div>
                   )}
                   <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-1.5 bg-white/90 rounded-lg text-slate-600 hover:text-purple-600 shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          toast("Delete this item?", {
                            action: {
                              label: "Delete",
                              onClick: async () => {
                                await deleteInventoryItem(item.docId);
                                toast.success("Item deleted");
                              }
                            },
                            cancel: { label: "Cancel" }
                          });
                        }}
                        className="p-1.5 bg-white/90 rounded-lg text-slate-600 hover:text-red-500 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                   {Number(item.quantity) < 10 && (
                     <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                       <AlertCircle className="w-3 h-3" /> Low Stock
                     </div>
                   )}
                </div>
                <div className="p-4">
                   <h3 className="font-bold text-slate-900 dark:text-white mb-1">{item.name}</h3>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">{item.category} • {item.brand || 'No Brand'}</p>
                   
                   {item.sources && item.sources.length > 0 && (
                     <div className="mb-3 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-md">
                       <Truck className="w-3 h-3 text-purple-500 shrink-0" />
                       <span className="truncate">
                         {item.sources[item.sources.length - 1].type === 'manual' 
                           ? `Added Manually (${item.sources[item.sources.length - 1].date})`
                           : `From: ${item.sources[item.sources.length - 1].from}`
                         }
                       </span>
                     </div>
                   )}
                   
                   <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Stock</p>
                        <p className="font-bold text-slate-900 dark:text-white">{item.quantity} {item.unit || 'pcs'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-0.5">Price</p>
                        <p className="font-bold text-slate-900 dark:text-white">₹{item.sellingPrice}</p>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
           </div>
           
           {filteredInventory.length === 0 && (
             <div className="text-center py-20">
               <Package className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
               <p className="text-slate-500 dark:text-slate-400">No items found. Add some products to get started!</p>
             </div>
           )}
        </>
      )}

      {view === 'add' && (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-500" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Product' : 'Add New Product'}</h1>
                <p className="text-slate-500 dark:text-slate-400">{editingId ? 'Update product details.' : 'Fill in the details to add product to inventory.'}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                   <h3 className="font-bold text-slate-900 dark:text-white mb-4">Product Details</h3>
                   
                   <div className="relative">
                     <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Product Name *</label>
                     <input 
                       value={itemForm.name}
                       onChange={(e) => handleNameChange(e.target.value)}
                       className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                       placeholder="Enter product name"
                     />
                     {showSuggestions && (
                       <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-20 mt-1 max-h-48 overflow-y-auto">
                          {activeSuggestions.map((suggestion: any) => (
                            <div 
                               key={suggestion.id} 
                               onClick={() => selectSuggestion(suggestion)}
                               className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-100 dark:border-slate-700/50 last:border-0"
                            >
                               <p className="font-medium text-sm text-slate-900 dark:text-white">{suggestion.title}</p>
                               <p className="text-xs text-slate-500">{suggestion.category} • {suggestion.brand}</p>
                            </div>
                          ))}
                       </div>
                     )}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">SKU / Barcode</label>
                        <input 
                          value={itemForm.sku}
                          onChange={(e) => setItemForm({...itemForm, sku: e.target.value})}
                          className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5"
                          placeholder="e.g. SKU-12345"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Brand</label>
                        <input 
                          value={itemForm.brand}
                          onChange={(e) => setItemForm({...itemForm, brand: e.target.value})}
                          className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5"
                          placeholder="e.g. Nike, Nestle"
                        />
                      </div>
                   </div>
                   
                   <div className="relative">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Category</label>
                      <input 
                        value={itemForm.category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5"
                        placeholder="e.g. Electronics, Groceries"
                        onFocus={() => {
                            if (allCategories.length > 0) handleCategoryChange(itemForm.category);
                        }}
                      />
                      {showCategorySuggestions && categorySuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-20 mt-1 max-h-48 overflow-y-auto">
                           {categorySuggestions.map((cat) => (
                             <div 
                                key={cat} 
                                onClick={() => selectCategory(cat)}
                                className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-100 dark:border-slate-700/50 last:border-0 capitalize"
                             >
                                <span className="text-sm text-slate-900 dark:text-white">{cat.replace('-', ' ')}</span>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>

                   <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Description</label>
                      <textarea 
                        value={itemForm.description}
                        onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                        rows={4}
                        className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5"
                        placeholder="Product description and details..."
                      />
                   </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                   <h3 className="font-bold text-slate-900 dark:text-white mb-4">Inventory & Pricing</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Quantity *</label>
                        <input 
                          type="number"
                          value={itemForm.quantity}
                          onChange={(e) => setItemForm({...itemForm, quantity: e.target.value})}
                          className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Unit</label>
                        <select 
                          value={itemForm.unit}
                          onChange={(e) => setItemForm({...itemForm, unit: e.target.value})}
                          className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5"
                        >
                          <option value="pcs">Pieces (pcs)</option>
                          <option value="kg">Kilogram (kg)</option>
                          <option value="g">Gram (g)</option>
                          <option value="ltr">Liter (ltr)</option>
                        </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Cost Price (₹)</label>
                        <input 
                          type="number"
                          value={itemForm.costPrice}
                          onChange={(e) => setItemForm({...itemForm, costPrice: e.target.value})}
                          className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Selling Price (₹) *</label>
                        <input 
                          type="number"
                          value={itemForm.sellingPrice}
                          onChange={(e) => setItemForm({...itemForm, sellingPrice: e.target.value})}
                          className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5"
                          placeholder="0.00"
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Low Stock Alert</label>
                        <input 
                          type="number"
                          value={itemForm.minStock}
                          onChange={(e) => setItemForm({...itemForm, minStock: e.target.value})}
                          className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5"
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Expiry Date</label>
                        <input 
                          type="date"
                          value={itemForm.expiryDate}
                          onChange={(e) => setItemForm({...itemForm, expiryDate: e.target.value})}
                          className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5 text-slate-500"
                        />
                      </div>
                   </div>
                </div>
              </div>

              {/* Right Column: Media & Extras */}
              <div className="space-y-6">
                 <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Product Image</h3>
                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group">
                       <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} accept="image/*" />
                       
                       {uploadingImage ? (
                         <div className="flex flex-col items-center">
                           <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
                           <span className="text-sm text-slate-500">Uploading...</span>
                         </div>
                       ) : itemForm.image ? (
                         <div className="relative w-full h-48 rounded-lg overflow-hidden">
                           <img src={itemForm.image} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-sm font-medium">Change Image</span>
                           </div>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center text-slate-500">
                           <Upload className="w-10 h-10 mb-3 text-slate-400" />
                           <span className="font-medium text-slate-700 dark:text-slate-300">Click to upload</span>
                           <span className="text-xs mt-1">SVG, PNG, JPG or GIF</span>
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Tags</h3>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Product Tags</label>
                    <input 
                      value={itemForm.tags}
                      onChange={(e) => setItemForm({...itemForm, tags: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2.5"
                      placeholder="e.g. spicy, organic, new (comma separated)"
                    />
                    <p className="text-xs text-slate-500 mt-2">Tags help in searching and filtering products.</p>
                 </div>

                 <div>
                    <button 
                      onClick={handleSave}
                      disabled={loading || uploadingImage}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {editingId ? 'Update Product' : 'Save Product'}
                    </button>
                    <button 
                      onClick={() => setView('list')}
                      className="w-full py-3 mt-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
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
