import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const Offer = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("adminToken");

  const [offers, setOffers] = useState([]);

  // ✅ Data for dropdown selections
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [festivals, setFestivals] = useState([]);

  // ✅ Form state
  const [form, setForm] = useState({
    title: "",
    type: "percent", // percent | flat
    value: "",
    appliesTo: "all", // all | selected | category | festival
    products: [],
    categories: [],
    festivals: [],
    startDate: "",
    endDate: "",
  });

  const [loading, setLoading] = useState(false);

  /* =======================
      FETCHING FUNCTIONS
  ======================= */
  const fetchOffers = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/offers`);
      setOffers(res.data || []);
    } catch (err) {
      console.log("FETCH OFFERS ERROR:", err);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/menu/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenuItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("FETCH MENU ITEMS ERROR:", err);
      setMenuItems([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/categories`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("FETCH CATEGORIES ERROR:", err);
      setCategories([]);
    }
  };

  const fetchFestivals = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/festivals`);
      setFestivals(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("FETCH FESTIVALS ERROR:", err);
      setFestivals([]);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchMenuItems();
    fetchCategories();
    fetchFestivals();
  }, []);

  /* =======================
      HELPERS
  ======================= */
  const resetForm = () => {
    setForm({
      title: "",
      type: "percent",
      value: "",
      appliesTo: "all",
      products: [],
      categories: [],
      festivals: [],
      startDate: "",
      endDate: "",
    });
  };

  const handleMultiSelectChange = (e, fieldName) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    setForm((prev) => ({ ...prev, [fieldName]: selected }));
  };

  const visibleSelector = useMemo(() => {
    if (form.appliesTo === "selected") return "products";
    if (form.appliesTo === "category") return "categories";
    if (form.appliesTo === "festival") return "festivals";
    return null;
  }, [form.appliesTo]);

  /* =======================
      CREATE OFFER
  ======================= */
  const createOffer = async (e) => {
    e.preventDefault();

    if (!form.title || !form.type || !form.value || !form.startDate || !form.endDate) {
      return alert("❌ Please fill all required fields");
    }

    // ✅ extra validation
    if (form.appliesTo === "selected" && form.products.length === 0) {
      return alert("❌ Please select at least 1 product");
    }

    if (form.appliesTo === "category" && form.categories.length === 0) {
      return alert("❌ Please select at least 1 category");
    }

    if (form.appliesTo === "festival" && form.festivals.length === 0) {
      return alert("❌ Please select at least 1 festival");
    }

    try {
      setLoading(true);

      // ✅ send only relevant list
      const payload = {
        title: form.title,
        type: form.type,
        value: Number(form.value),
        appliesTo: form.appliesTo,
        startDate: form.startDate,
        endDate: form.endDate,
      };

      if (form.appliesTo === "selected") payload.products = JSON.stringify(form.products);
      if (form.appliesTo === "category") payload.categories = JSON.stringify(form.categories);
      if (form.appliesTo === "festival") payload.festivals = JSON.stringify(form.festivals);

      const res = await axios.post(`${BACKEND_URL}/api/offers`, payload);

      if (res.data?.success) {
        alert("✅ Offer created!");
        resetForm();
        fetchOffers();
      } else {
        alert("❌ Failed to create offer");
      }
    } catch (err) {
      console.log("CREATE OFFER ERROR:", err);
      alert(err.response?.data?.message || "❌ Failed to create offer");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
      DELETE OFFER
  ======================= */
  const deleteOffer = async (id) => {
    if (!confirm("Delete this offer?")) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/offers/${id}`);
      fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || "❌ Failed to delete offer");
    }
  };

  /* =======================
      TOGGLE OFFER
  ======================= */
  const toggleOffer = async (id) => {
    try {
      await axios.patch(`${BACKEND_URL}/api/offers/toggle/${id}`);
      fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || "❌ Failed to toggle offer");
    }
  };

  /* =======================
      UI
  ======================= */
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-6">🎁 Offers</h1>

      {/* ======================
          CREATE OFFER FORM
      ====================== */}
      <form
        onSubmit={createOffer}
        className="bg-white rounded-xl shadow-sm border p-4 md:p-6 mb-8"
      >
        <h2 className="text-lg font-semibold mb-4">Create New Offer</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium">Title *</label>
            <input
              className="w-full mt-1 border rounded-lg px-3 py-2"
              placeholder="Eg: Ramadan Offer / Summer Sale"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium">Discount Type *</label>
            <select
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat Amount</option>
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="text-sm font-medium">Value *</label>
            <input
              type="number"
              className="w-full mt-1 border rounded-lg px-3 py-2"
              placeholder={form.type === "percent" ? "Eg: 10" : "Eg: 50"}
              value={form.value}
              onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
            />
          </div>

          {/* Applies To */}
          <div>
            <label className="text-sm font-medium">Applies To *</label>
            <select
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={form.appliesTo}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  appliesTo: e.target.value,
                  products: [],
                  categories: [],
                  festivals: [],
                }))
              }
            >
              <option value="all">All Products</option>
              <option value="selected">Selected Products</option>
              <option value="category">Category Wise</option>
              <option value="festival">Festival Wise</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-sm font-medium">Start Date *</label>
            <input
              type="date"
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-sm font-medium">End Date *</label>
            <input
              type="date"
              className="w-full mt-1 border rounded-lg px-3 py-2"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>

        {/* ✅ Conditional Selectors */}
        {visibleSelector === "products" && (
          <div className="mt-4">
            <label className="text-sm font-medium">Select Products *</label>
            <select
              multiple
              className="w-full mt-1 border rounded-lg px-3 py-2 h-44"
              value={form.products}
              onChange={(e) => handleMultiSelectChange(e, "products")}
            >
              {menuItems.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold <b>Ctrl</b> / <b>Cmd</b> to select multiple
            </p>
          </div>
        )}

        {visibleSelector === "categories" && (
          <div className="mt-4">
            <label className="text-sm font-medium">Select Categories *</label>
            <select
              multiple
              className="w-full mt-1 border rounded-lg px-3 py-2 h-44"
              value={form.categories}
              onChange={(e) => handleMultiSelectChange(e, "categories")}
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold <b>Ctrl</b> / <b>Cmd</b> to select multiple
            </p>
          </div>
        )}

        {visibleSelector === "festivals" && (
          <div className="mt-4">
            <label className="text-sm font-medium">Select Festivals *</label>
            <select
              multiple
              className="w-full mt-1 border rounded-lg px-3 py-2 h-44"
              value={form.festivals}
              onChange={(e) => handleMultiSelectChange(e, "festivals")}
            >
              {festivals.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold <b>Ctrl</b> / <b>Cmd</b> to select multiple
            </p>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Offer"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </form>

      {/* ======================
          OFFERS LIST
      ====================== */}
      <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">All Offers</h2>

        {offers.length === 0 ? (
          <p className="text-gray-500">No offers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Title</th>
                  <th className="py-2">Applies To</th>
                  <th className="py-2">Value</th>
                  <th className="py-2">Dates</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>

              <tbody>
                {offers.map((offer) => (
                  <tr key={offer._id} className="border-b">
                    <td className="py-3 font-medium">{offer.title}</td>

                    <td className="py-3 capitalize">
                      {offer.appliesTo || "all"}
                    </td>

                    <td className="py-3">
                      {offer.type === "percent"
                        ? `${offer.value}%`
                        : `$${offer.value}`}
                    </td>

                    <td className="py-3 text-xs text-gray-600">
                      <div>Start: {offer.startDate?.slice(0, 10)}</div>
                      <div>End: {offer.endDate?.slice(0, 10)}</div>
                    </td>

                    <td className="py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          offer.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {offer.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>

                    <td className="py-3 flex gap-2">
                      <button
                        onClick={() => toggleOffer(offer._id)}
                        className="px-3 py-1 rounded-lg bg-yellow-500 text-white text-xs hover:bg-yellow-600"
                      >
                        Toggle
                      </button>

                      <button
                        onClick={() => deleteOffer(offer._id)}
                        className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Offer;
