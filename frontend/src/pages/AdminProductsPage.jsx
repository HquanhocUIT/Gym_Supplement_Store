import { Fragment, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eyebrow } from "../components/Brand.jsx";
import ImageUploader from "../components/common/ImageUploader.jsx";
import Pagination from "../components/common/Pagination.jsx";
import ProductPhotoEditor from "../components/common/ProductPhotoEditor.jsx";
import Modal from "../components/ui/Modal.jsx";
import useApiQuery from "../hooks/useApiQuery.js";
import { apiClient, getApiData } from "../lib/apiClient.js";
import useCatalogSearchParams from "../hooks/useCatalogSearchParams.js";

// Cảnh báo tồn kho thấp khi tổng số lượng không quá 20.
const LOW_STOCK_THRESHOLD = 20;
const PAGE_SIZE = 12;

function AdminProductsPage() {
  // Theo dõi trạng thái mở hoặc đóng form thêm sản phẩm.
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Theo dõi nội dung tìm kiếm và bộ lọc danh mục.
  const { search: searchTerm, category: selectedCategory, page, updateFilters, setPage } = useCatalogSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Theo dõi sản phẩm đang mở phần chi tiết variant.
  const [expandedProductId, setExpandedProductId] = useState(null);

  // Lưu giá trị tồn kho đang sửa và trạng thái lưu từng variant.
  const [stockDrafts, setStockDrafts] = useState({});
  const [savingVariantId, setSavingVariantId] = useState(null);
  const [stockErrors, setStockErrors] = useState({});

  // Dùng để tải lại dữ liệu sau khi tạo hoặc sửa sản phẩm.
  const queryClient = useQueryClient();

  // Lưu thông tin sản phẩm mới và các variant trong form.
  const [productForm, setProductForm] = useState({
    name: "",
    categoryId: "",
    description: "",
    imageFile: null,
    variants: [{ flavor: "", size: "", price: "", stock: "" }],
  });

  // Lấy danh sách sản phẩm từ API.
  const {
    data: productPage,
    isLoading,
    isFetching,
    isError,
    error,
  } = useApiQuery({
    queryKey: ["store-products"],
    url: "/store/products",
    params: {
      q: searchTerm.trim() || undefined,
      category: selectedCategory || undefined,
      page,
      limit: PAGE_SIZE,
    },
  });

  // API catalog trả về { items, pagination }; chỉ items mới là mảng sản phẩm.
  const products = productPage?.items ?? [];
  const pagination = productPage?.pagination;

  // Lấy danh sách danh mục để điền vào bộ lọc và form.
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    error: categoriesError,
  } = useApiQuery({
    queryKey: ["store-categories"],
    url: "/store/categories",
  });

  // Lấy danh sách variant riêng cho từng sản phẩm.
  const variantQueries = useQueries({
    queries: products.map((product) => ({
      queryKey: ["store-product-variants", product.id],
      queryFn: ({ signal }) =>
        getApiData(`/store/products/${product.id}/variants`, { signal }),
    })),
  });

  // Backend lọc trên toàn bộ danh mục trước khi phân trang.
  const visibleProducts = products;

  // Cập nhật một trường trong variant của form tạo sản phẩm.
  function updateVariantField(index, field, value) {
    setProductForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    }));
  }

  // Thêm một dòng variant trống vào form.
  function addVariant() {
    setProductForm((current) => ({
      ...current,
      variants: [
        ...current.variants,
        { flavor: "", size: "", price: "", stock: "" },
      ],
    }));
  }

  // Xóa variant theo vị trí trong danh sách.
  function removeVariant(index) {
    setProductForm((current) => ({
      ...current,
      variants: current.variants.filter(
        (_, variantIndex) => variantIndex !== index,
      ),
    }));
  }

  // Tạo sản phẩm, tạo các variant rồi tải ảnh nếu đã chọn.
  async function handleCreateProduct(event) {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    let createdProductId = null;

    try {
      // Tạo sản phẩm trước để lấy ID dùng cho variant và ảnh.
      const productResponse = await apiClient.post("/store/products", {
        name: productForm.name.trim(),
        categoryId: Number(productForm.categoryId),
        description: productForm.description.trim() || null,
      });

      createdProductId = productResponse.data?.data?.id;

      if (!createdProductId) {
        throw new Error("API did not return the new product ID.");
      }

      // Tạo lần lượt các variant thuộc sản phẩm vừa tạo.
      for (const variant of productForm.variants) {
        await apiClient.post(
          `/store/products/${createdProductId}/variants`,
          {
            flavor: variant.flavor.trim() || null,
            size: variant.size.trim(),
            price: Number(variant.price),
            stock: Number(variant.stock),
          },
        );
      }

      // Backend nhận file ảnh qua trường có tên image.
      if (productForm.imageFile) {
        const imageData = new FormData();
        imageData.append("image", productForm.imageFile);

        await apiClient.post(
          `/store/products/${createdProductId}/image`,
          imageData,
        );
      }

      // Tải lại danh sách sản phẩm sau khi lưu thành công.
      setPage(1);
      await queryClient.invalidateQueries({
        queryKey: ["store-products"],
      });

      // Xóa form để lần thêm sau bắt đầu từ trạng thái trống.
      setProductForm({
        name: "",
        categoryId: "",
        description: "",
        imageFile: null,
        variants: [{ flavor: "", size: "", price: "", stock: "" }],
      });

      setIsCreateModalOpen(false);
    } catch (error) {
      // Tải lại danh sách nếu sản phẩm đã tạo nhưng bước sau bị lỗi.
      if (createdProductId) {
        queryClient.invalidateQueries({
          queryKey: ["store-products"],
        });
      }

      setFormError(
        `Could not finish saving: ${error.message}. Check the product list before trying again.`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Kiểm tra và lưu số lượng tồn kho mới cho một variant.
  async function handleSaveStock(productId, variant) {
    const stockValue = stockDrafts[variant.id] ?? variant.stock;
    const stock = Number(stockValue);

    // Chỉ chấp nhận số nguyên không âm.
    if (
      String(stockValue).trim() === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setStockErrors((current) => ({
        ...current,
        [variant.id]: "Stock must be a whole number equal to or greater than 0.",
      }));
      return;
    }

    setStockErrors((current) => ({ ...current, [variant.id]: "" }));
    setSavingVariantId(variant.id);

    try {
      // API cập nhật variant cần nhận cả flavor, size và price.
      await apiClient.put(
        `/store/products/${productId}/variants/${variant.id}`,
        {
          flavor: variant.flavor,
          size: variant.size,
          price: Number(variant.price),
          stock,
        },
      );

      // Xóa giá trị nháp và tải lại tồn kho mới từ API.
      setStockDrafts((current) => {
        const next = { ...current };
        delete next[variant.id];
        return next;
      });

      await queryClient.invalidateQueries({
        queryKey: ["store-product-variants", productId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["store-products"],
      });
    } catch (error) {
      setStockErrors((current) => ({
        ...current,
        [variant.id]: error.message,
      }));
    } finally {
      setSavingVariantId(null);
    }
  }

  return (
    <div>
      {/* Đường dẫn quay lại trang tổng quan */}
      <Link
        className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-ink"
        to="/admin"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to overview
      </Link>

      {/* Tiêu đề trang và nút thêm sản phẩm */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Store inventory</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.05em]">
            Products
          </h1>
          <p className="mt-2 text-sm text-muted">
            Manage the products in your catalog.
          </p>
        </div>

        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white hover:bg-brand-700"
          type="button"
          onClick={() => {
            setFormError("");
            setIsCreateModalOpen(true);
          }}
        >
          <Plus size={17} aria-hidden="true" />
          Add product
        </button>
      </div>

      <section className="mt-7 overflow-hidden rounded-card border border-line bg-white">
        {/* Tìm kiếm và bộ lọc danh mục */}
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <label className="relative block">
            <span className="sr-only">Search products</span>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              size={16}
              aria-hidden="true"
            />
            <input
              className="min-h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-600 sm:w-64"
              placeholder="Search products"
              type="search"
              value={searchTerm}
              onChange={(event) => {
                updateFilters({ q: event.target.value });
              }}
            />
          </label>

          <div className="relative">
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line px-3 text-xs font-bold text-ink hover:bg-paper"
              type="button"
              aria-expanded={isFilterOpen}
              onClick={() => setIsFilterOpen((current) => !current)}
            >
              <SlidersHorizontal size={15} aria-hidden="true" />
              Filter
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-12 z-10 w-56 rounded-xl border border-line bg-white p-3 shadow-lg">
                <label
                  className="mb-1 block text-xs font-semibold"
                  htmlFor="category-filter"
                >
                  Category
                </label>
                <select
                  id="category-filter"
                  className="min-h-10 w-full rounded-lg border border-line bg-white px-2 text-sm"
                  value={selectedCategory}
                  onChange={(event) => {
                    updateFilters({ category: event.target.value });
                  }}
                  disabled={isCategoriesLoading}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {isCategoriesError && (
                  <p className="mt-2 text-xs text-red-700" role="alert">
                    {categoriesError.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bảng sản phẩm */}
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-paper/70 text-[10px] font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Lowest price</th>
                <th className="px-5 py-3">Total stock</th>
                <th className="px-5 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Báo trạng thái khi đang tải danh sách sản phẩm */}
              {isLoading && (
                <tr>
                  <td className="px-5 py-4" colSpan={6}>
                    Loading products...
                  </td>
                </tr>
              )}

              {/* Hiện lỗi nếu API danh sách sản phẩm thất bại */}
              {isError && (
                <tr>
                  <td
                    className="px-5 py-4 text-red-700"
                    colSpan={6}
                    role="alert"
                  >
                    {error.message}
                  </td>
                </tr>
              )}

              {/* Báo khi không có sản phẩm khớp tìm kiếm hoặc bộ lọc */}
              {!isLoading && !isError && visibleProducts.length === 0 && (
                <tr>
                  <td className="px-5 py-4 text-muted" colSpan={6}>
                    No products found.
                  </td>
                </tr>
              )}

              {/* Hiện sản phẩm và dòng chi tiết variant khi được mở */}
              {!isLoading &&
                !isError &&
                visibleProducts.map((product) => {
                  // Tìm vị trí sản phẩm trong danh sách gốc để lấy đúng query variant.
                  const productIndex = products.findIndex(
                    (item) => item.id === product.id,
                  );
                  const variantQuery = variantQueries[productIndex];
                  const variants = variantQuery?.data ?? [];

                  // Cộng tồn kho của tất cả variant.
                  const totalStock = variants.reduce(
                    (total, variant) => total + Number(variant.stock || 0),
                    0,
                  );

                  // Tìm giá thấp nhất trong các variant.
                  const prices = variants
                    .map((variant) => Number(variant.price))
                    .filter(Number.isFinite);

                  const lowestPrice =
                    prices.length > 0 ? Math.min(...prices) : null;

                  // Chọn nhãn trạng thái theo tổng số lượng tồn.
                  const stockStatus =
                    totalStock === 0
                      ? "Out of stock"
                      : totalStock <= LOW_STOCK_THRESHOLD
                        ? "Low stock"
                        : "In stock";

                  const stockStatusClass =
                    totalStock === 0
                      ? "bg-red-50 text-red-700"
                      : totalStock <= LOW_STOCK_THRESHOLD
                        ? "bg-amber-50 text-amber-700"
                        : "bg-brand-50 text-brand-700";

                  const isExpanded = expandedProductId === product.id;

                  return (
                    <Fragment key={product.id}>
                      <tr className="border-t border-line">
                        <td className="px-5 py-4">
                          <p className="font-bold">{product.name}</p>
                          <p className="mt-1 text-xs text-muted">
                            {product.description || "No description"}
                          </p>
                        </td>

                        <td className="px-5 py-4">#{product.id}</td>
                        <td className="px-5 py-4">{product.category_name}</td>

                        <td className="px-5 py-4 font-bold">
                          {variantQuery?.isLoading
                            ? "Loading..."
                            : variantQuery?.isError
                              ? "Could not load"
                              : lowestPrice === null
                                ? "No variants"
                                : `${lowestPrice.toLocaleString("vi-VN")} ₫`}
                        </td>

                        <td className="px-5 py-4">
                          {variantQuery?.isLoading ? (
                            "Loading..."
                          ) : variantQuery?.isError ? (
                            "Could not load"
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{totalStock}</span>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${stockStatusClass}`}
                              >
                                {stockStatus}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink"
                            type="button"
                            aria-label={
                              isExpanded
                                ? `Close ${product.name} variants`
                                : `Open ${product.name} variants`
                            }
                            aria-expanded={isExpanded}
                            onClick={() =>
                              setExpandedProductId(
                                isExpanded ? null : product.id,
                              )
                            }
                          >
                            <ArrowUpRight
                              className={isExpanded ? "rotate-90" : ""}
                              size={16}
                              aria-hidden="true"
                            />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-t border-line bg-paper/30">
                          <td className="px-5 py-4" colSpan={6}>
                            <ProductPhotoEditor product={product} />
                            <h2 className="mb-3 font-bold">
                              Variants for {product.name}
                            </h2>

                            {variantQuery?.isLoading && (
                              <p className="text-sm text-muted">
                                Loading variants...
                              </p>
                            )}

                            {variantQuery?.isError && (
                              <p className="text-sm text-red-700" role="alert">
                                {variantQuery.error.message}
                              </p>
                            )}

                            {!variantQuery?.isLoading &&
                              !variantQuery?.isError &&
                              variants.length === 0 && (
                                <p className="text-sm text-muted">
                                  This product has no variants.
                                </p>
                              )}

                            {!variantQuery?.isLoading &&
                              !variantQuery?.isError &&
                              variants.length > 0 && (
                                <div className="space-y-3">
                                  {variants.map((variant) => (
                                    <div
                                      className="grid gap-3 rounded-lg border border-line bg-white p-3 sm:grid-cols-[1fr_120px_auto] sm:items-end"
                                      key={variant.id}
                                    >
                                      <div>
                                        <p className="font-semibold">
                                          {variant.flavor || "No flavor"}
                                          {variant.size
                                            ? ` · ${variant.size}`
                                            : ""}
                                        </p>
                                        <p className="mt-1 text-xs text-muted">
                                          Price:{" "}
                                          {Number(
                                            variant.price,
                                          ).toLocaleString("vi-VN")}{" "}
                                          ₫
                                        </p>
                                      </div>

                                      <div>
                                        <label
                                          className="mb-1 block text-xs font-semibold"
                                          htmlFor={`stock-${variant.id}`}
                                        >
                                          Stock
                                        </label>
                                        <input
                                          id={`stock-${variant.id}`}
                                          className="min-h-10 w-full rounded-lg border border-line px-3 text-sm"
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={
                                            stockDrafts[variant.id] ??
                                            variant.stock
                                          }
                                          onChange={(event) => {
                                            setStockDrafts((current) => ({
                                              ...current,
                                              [variant.id]: event.target.value,
                                            }));
                                            setStockErrors((current) => ({
                                              ...current,
                                              [variant.id]: "",
                                            }));
                                          }}
                                        />
                                      </div>

                                      <button
                                        className="min-h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white disabled:opacity-60"
                                        type="button"
                                        disabled={
                                          savingVariantId === variant.id
                                        }
                                        onClick={() =>
                                          handleSaveStock(product.id, variant)
                                        }
                                      >
                                        {savingVariantId === variant.id
                                          ? "Saving..."
                                          : "Save stock"}
                                      </button>

                                      {stockErrors[variant.id] && (
                                        <p
                                          className="text-xs text-red-700 sm:col-span-3"
                                          role="alert"
                                        >
                                          {stockErrors[variant.id]}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Dùng tổng số sản phẩm từ API để truy cập được các trang còn lại. */}
        <div className="border-t border-line px-5 py-4 text-xs text-muted">
          {pagination && !isError && (
            <Pagination
              page={pagination.page}
              pageSize={pagination.limit}
              total={pagination.total}
              onPageChange={setPage}
              disabled={isFetching}
            />
          )}
        </div>
      </section>

      {/* Form nhập và lưu sản phẩm mới */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isSaving) {
            setIsCreateModalOpen(false);
          }
        }}
        title="Add product"
        size="lg"
        footer={
          <>
            <button
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold disabled:opacity-60"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              type="submit"
              form="create-product-form"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save product"}
            </button>
          </>
        }
      >
        <form
          id="create-product-form"
          className="space-y-5"
          onSubmit={handleCreateProduct}
        >
          {/* Hiện lỗi khi lưu sản phẩm thất bại */}
          {formError && (
            <p className="text-sm text-red-700" role="alert">
              {formError}
            </p>
          )}

          {/* Nhập tên sản phẩm */}
          <div>
            <label
              className="mb-1 block text-sm font-semibold"
              htmlFor="product-name"
            >
              Product name
            </label>
            <input
              id="product-name"
              className="min-h-11 w-full rounded-lg border border-line px-3 text-sm"
              value={productForm.name}
              onChange={(event) =>
                setProductForm({
                  ...productForm,
                  name: event.target.value,
                })
              }
              maxLength={255}
              required
            />
          </div>

          {/* Chọn danh mục lấy từ API */}
          <div>
            <label
              className="mb-1 block text-sm font-semibold"
              htmlFor="product-category"
            >
              Category
            </label>
            <select
              id="product-category"
              className="min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm"
              value={productForm.categoryId}
              onChange={(event) =>
                setProductForm({
                  ...productForm,
                  categoryId: event.target.value,
                })
              }
              disabled={isCategoriesLoading}
              required
            >
              <option value="">
                {isCategoriesLoading
                  ? "Loading categories..."
                  : "Select category"}
              </option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {isCategoriesError && (
              <p className="mt-1 text-sm text-red-700" role="alert">
                {categoriesError.message}
              </p>
            )}
          </div>

          {/* Nhập mô tả sản phẩm */}
          <div>
            <label
              className="mb-1 block text-sm font-semibold"
              htmlFor="product-description"
            >
              Description
            </label>
            <textarea
              id="product-description"
              className="min-h-24 w-full rounded-lg border border-line p-3 text-sm"
              value={productForm.description}
              onChange={(event) =>
                setProductForm({
                  ...productForm,
                  description: event.target.value,
                })
              }
            />
          </div>

          {/* Chọn ảnh và xem trước ảnh sản phẩm */}
          <ImageUploader
            value={productForm.imageFile}
            onChange={(imageFile) =>
              setProductForm({
                ...productForm,
                imageFile,
              })
            }
          />

          {/* Danh sách variant của sản phẩm */}
          <div className="space-y-4 border-t border-line pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-ink">Product variants</h3>

              <button
                className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-paper"
                type="button"
                onClick={addVariant}
              >
                Add variant
              </button>
            </div>

            {productForm.variants.map((variant, index) => (
              <div
                className="space-y-4 rounded-xl border border-line p-4"
                key={index}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    Variant {index + 1}
                  </h4>

                  {productForm.variants.length > 1 && (
                    <button
                      className="text-sm font-semibold text-red-700 hover:underline"
                      type="button"
                      onClick={() => removeVariant(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Hương vị không bắt buộc */}
                  <div>
                    <label
                      className="mb-1 block text-sm font-semibold"
                      htmlFor={`variant-flavor-${index}`}
                    >
                      Flavor
                    </label>
                    <input
                      id={`variant-flavor-${index}`}
                      className="min-h-11 w-full rounded-lg border border-line px-3 text-sm"
                      value={variant.flavor}
                      onChange={(event) =>
                        updateVariantField(
                          index,
                          "flavor",
                          event.target.value,
                        )
                      }
                      maxLength={100}
                      placeholder="Optional"
                    />
                  </div>

                  {/* Kích cỡ bắt buộc */}
                  <div>
                    <label
                      className="mb-1 block text-sm font-semibold"
                      htmlFor={`variant-size-${index}`}
                    >
                      Size
                    </label>
                    <input
                      id={`variant-size-${index}`}
                      className="min-h-11 w-full rounded-lg border border-line px-3 text-sm"
                      value={variant.size}
                      onChange={(event) =>
                        updateVariantField(index, "size", event.target.value)
                      }
                      maxLength={100}
                      placeholder="For example: 1 kg"
                      required
                    />
                  </div>

                  {/* Giá variant */}
                  <div>
                    <label
                      className="mb-1 block text-sm font-semibold"
                      htmlFor={`variant-price-${index}`}
                    >
                      Price (VND)
                    </label>
                    <input
                      id={`variant-price-${index}`}
                      className="min-h-11 w-full rounded-lg border border-line px-3 text-sm"
                      type="number"
                      min="0"
                      step="1"
                      value={variant.price}
                      onChange={(event) =>
                        updateVariantField(index, "price", event.target.value)
                      }
                      required
                    />
                  </div>

                  {/* Số lượng tồn kho ban đầu */}
                  <div>
                    <label
                      className="mb-1 block text-sm font-semibold"
                      htmlFor={`variant-stock-${index}`}
                    >
                      Stock
                    </label>
                    <input
                      id={`variant-stock-${index}`}
                      className="min-h-11 w-full rounded-lg border border-line px-3 text-sm"
                      type="number"
                      min="0"
                      step="1"
                      value={variant.stock}
                      onChange={(event) =>
                        updateVariantField(index, "stock", event.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminProductsPage;
