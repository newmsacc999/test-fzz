const CART_KEY = "cart_items";

const getCartItems = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read cart items:", error);
    return [];
  }
};

const saveCartItems = (items) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (error) {
    console.error("Failed to save cart items:", error);
  }
};

const createCartItemId = (item) => {
  const parts = [item.id || item.productId || "", item.color || "", item.size || "", item.storage || ""];
  return parts.join("-").replace(/\s+/g, "_").toLowerCase();
};

const addToCart = (item, qty = 1) => {
  if (!item) return [];
  const cartItems = getCartItems();
  const cartItemId = createCartItemId(item);
  const existing = cartItems.find((cartItem) => cartItem.cartItemId === cartItemId);

  if (existing) {
    existing.qty = (existing.qty || 1) + qty;
  } else {
    cartItems.push({
      ...item,
      qty,
      cartItemId,
      productId: item.id || item.productId || null,
    });
  }

  saveCartItems(cartItems);
  return cartItems;
};

const removeFromCart = (cartItemId) => {
  const cartItems = getCartItems().filter((item) => item.cartItemId !== cartItemId);
  saveCartItems(cartItems);
  return cartItems;
};

const updateCartItemQty = (cartItemId, qty) => {
  if (qty < 1) return removeFromCart(cartItemId);
  const cartItems = getCartItems().map((item) =>
    item.cartItemId === cartItemId ? { ...item, qty } : item,
  );
  saveCartItems(cartItems);
  return cartItems;
};

const clearCart = () => {
  saveCartItems([]);
};

const getCartCount = () => {
  return getCartItems().reduce((total, item) => total + (Number(item.qty) || 1), 0);
};

export const cartService = {
  getCartItems,
  addToCart,
  removeFromCart,
  updateCartItemQty,
  clearCart,
  getCartCount,
};
