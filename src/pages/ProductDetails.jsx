import { useState, useEffect, useMemo } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import { localService } from "../services/localService";
import { cartService } from "../services/cartService";
import useDisablePinchZoom from "../hooks/useDisablePinchZoom";   // ✅ import
import "./ProductDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();    // ✅ only one call
  const [searchParams] = useSearchParams();

  useDisablePinchZoom();   // ✅ disables pinch-zoom while this page is mounted

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [offerTime, setOfferTime] = useState({ m: 16, s: 31 });
  const [deliveryTime, setDeliveryTime] = useState({ m: 15, s: 10 });
  const [deliveryDate, setDeliveryDate] = useState("");

  const [randomData] = useState(() => {
    const rParam = searchParams.get("r");
    const r1Param = searchParams.get("r1");
    const fallbackRating = (Math.random() * (5 - 4) + 4).toFixed(1);
    const fallbackCount = Math.floor(Math.random() * (9500 - 7500 + 1)) + 7500;

    return {
      stockLeft: Math.floor(Math.random() * (39 - 4 + 1)) + 4,
      randomRating: rParam || fallbackRating,
      ratingReviews: r1Param || fallbackCount,
      peopleOrdered: Math.floor(Math.random() * (39999 - 23999 + 1)) + 23999,
    };
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await localService.getProductById(id);
        if (response.success) {
          setProduct(response);
        } else {
          toast.error("Failed to load product");
        }
      } catch (error) {
        toast.error("Error loading product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 2);
    const options = { weekday: "short", month: "short", day: "numeric" };
    setDeliveryDate(today.toLocaleDateString("en-US", options));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setOfferTime((prev) => {
        if (prev.s === 0) {
          if (prev.m === 0) return { m: 16, s: 31 };
          return { m: prev.m - 1, s: 59 };
        }
        return { ...prev, s: prev.s - 1 };
      });

      setDeliveryTime((prev) => {
        if (prev.s === 0) {
          if (prev.m === 0) return { m: 15, s: 10 };
          return { m: prev.m - 1, s: 59 };
        }
        return { ...prev, s: prev.s - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { variant, images } = useMemo(() => {
    if (!product || !product.verients) return { variant: null, images: [] };
    let v = product.verients[0];
    if (product.colors && product.colors.length > 0) {
      const firstColor = product.colors[0].color_name;
      const matchingVariant = product.verients.find((vr) => vr.color === firstColor);
      if (matchingVariant) v = matchingVariant;
    }
    const imgs = [v.img1, v.img2, v.img3, v.img4, v.img5].filter(Boolean);
    return { variant: v, images: imgs };
  }, [product]);

  useEffect(() => {
    if (images.length < 2) return;
    const interval = setInterval(() => {
      setActiveImgIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images]);

 

useEffect(() => {
  const updateCartCount = () => {
    setCartCount(cartService.getCartCount());
  };

  updateCartCount();

  window.addEventListener("cartUpdated", updateCartCount);

  return () => {
    window.removeEventListener("cartUpdated", updateCartCount);
  };
}, []);

  const handleAddToCart = () => {
    if (!variant) return;
    cartService.addToCart(variant);
    toast.success("Product added to cart");
  };

  const handleBuyAction = () => {
  if (!variant) return;

  const cartItems = cartService.getCartItems();

  const exists = cartItems.find(
    (item) =>
      (item.id || item.productId) === (variant.id || variant.productId) &&
      item.color === variant.color &&
      item.size === variant.size &&
      item.storage === variant.storage
  );

  if (!exists) {
    cartService.addToCart(variant);
  }

  navigate("/address");
};
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!product || !variant) return <div className="flex justify-center items-center h-screen">Product Not Found</div>;

  return (
    <div className="min-h-screen font-sans text-[#212121]">
      {/* Fixed Header */}
      <div className="bg-[#2874f0] text-white py-2 shadow-md sticky top-0 z-[100]">
  <div className="w-full px-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="cursor-pointer p-1"
          onClick={() => navigate(-1)}
        >
          <img
            src="/assets/images/theme/back.svg"
            alt="Back"
            className="w-6 h-6 brightness-0 invert"
          />
        </div>

        <Link to="/">
          <img
            className="w-[75px] h-auto"
            src="/img/Q18Ifxk.png"
            alt="Logo"
          />
        </Link>
      </div>

      <div
        className="cursor-pointer relative mr-1"
        onClick={() => navigate("/cart")}
      >
        <img
          src="/assets/images/shoppings.png"
          alt="Cart"
          className="w-6 h-6 brightness-0 invert"
        />

        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold">
            {cartCount}
          </span>
        )}
      </div>
    </div>
  </div>
</div>

<div className="mx-auto bg-[#F1F2F4] pb-2 shadow-sm">
      
        {/* Image Slider */}
        <div className="bg-white relative">
          <div className="flex justify-center w-full bg-white border-b border-gray-100">
            <div className="relative w-full flex flex-col items-center pt-4">
              <div className="w-full h-[350px] flex items-center justify-center p-4">
                <img
                  src={images[activeImgIndex] || "https://via.placeholder.com/300"}
                  alt="Product"
                  className="max-h-full object-contain"
                />
              </div>
              <div className="flex gap-1.5 justify-center w-full mt-2 mb-4">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImgIndex(idx)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      idx === activeImgIndex ? "bg-blue-600 w-4" : "bg-gray-300"
                    }`}
                  ></div>
                ))}
              </div>
              <div className="w-full text-center py-2 bg-gray-50">
                <h4 className="m-0 font-semibold text-[16px] text-gray-800">
                  Only <span className="text-[#DC3545]">{randomData.stockLeft}</span> Left in Stock
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white mb-2 px-4 py-3">
          <h1 className="text-[15px] font-normal mb-2 leading-snug">
            {variant?.name || product?.name}
          </h1>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-[#388e3c] text-white text-[12px] px-1.5 py-0.5 rounded flex items-center gap-1">
              <span>{randomData.randomRating}</span>
              <span className="text-[10px]">★</span>
            </div>
            <span className="text-[#878787] text-[13px]">
              {randomData.ratingReviews} Ratings
            </span>
            <img src="/assets/images/plue-fassured.png" alt="Assured" className="h-5 ml-auto" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-bold">₹{variant.selling_price}</span>
            <span className="text-gray-500 line-through text-[14px]">₹{variant.mrp}</span>
            <span className="text-[#388e3c] text-[14px] font-semibold">
               {Math.round(((variant.mrp - variant.selling_price) / variant.mrp) * 100)}% off
            </span>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-white mb-2 p-3 flex items-center gap-3">
          <img src="/assets/images/Incresase.svg" alt="Trending" className="w-8 h-8" />
          <div className="text-[13px]">
            <span className="text-[#C70055] font-bold">{randomData.peopleOrdered}</span> people ordered this recently
          </div>
        </div>

        {/* Timer */}
        <div className="bg-[#FFF9F1] border-y border-[#FFE0B2] p-3 text-center">
          <h4 className="text-[15px] text-gray-800">
            Offer ends in <span className="text-[#FB641B] font-bold">
              {String(offerTime.m).padStart(2, "0")}m {String(offerTime.s).padStart(2, "0")}s
            </span>
          </h4>
        </div>

        {/* Delivery */}
        <div className="bg-white p-4 mb-2 flex items-start gap-3">
          <img src="https://i.ibb.co/sd0mx6xW/dd.webp" alt="Truck" className="w-5 h-5 mt-1" />
          <div>
            <div className="text-[14px]">
              <span className="text-[#388e3c] font-bold">FREE Delivery</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="font-bold">Delivery by {deliveryDate}</span>
            </div>
            <div className="text-[12px] text-gray-500 mt-1">
              If ordered within <span className="text-pink-600">{deliveryTime.m}m {deliveryTime.s}s</span>
            </div>
          </div>
        </div>

        {/* Legacy Product Details Section */}
        <div className="bg-white p-4 mb-[60px]">
          <h3 className="text-[16px] font-bold border-b pb-2 mb-3">Product Description</h3>
          <div
            className="text-[14px] leading-relaxed legacy-description"
            dangerouslySetInnerHTML={{ __html: variant.features }}
          />
          <div className="mt-4 space-y-1">
             {[1,2,3,4].map(num => (
               <img key={num} src={`/assets/images/review_${num}.jpg`} alt="Review" className="w-full rounded" />
             ))}
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex z-[100] h-[55px]">
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-white text-[#212121] font-bold text-[15px] border-t border-gray-200"
        >
          Add to Cart
        </button>
        <button
          onClick={handleBuyAction}
          className="flex-1 bg-[#ffc200] text-[#212121] font-bold text-[15px]"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
