const CART_API = "http://localhost:5000/api/cart";
// Removed static token to prevent stale auth issues

/* =========================
   GET USER CART
========================= */
async function getBackendCart() {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return [];
    try {
        const res = await fetch(CART_API, {
            headers: { "Authorization": `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error("Failed to fetch cart");
        return await res.json();
    } catch (error) {
        console.error("Error fetching cart:", error);
        return [];
    }
}

/* =========================
   ADD TO CART
========================= */
async function addToCart(productId, quantity = 1, size = null, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
        Swal.fire({
            icon: 'info',
            title: 'Login Required',
            text: 'Please login to add items to your cart.',
            confirmButtonText: 'Login',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = "login.html";
            }
        });
        return;
    }

    // ✅ If size is required but not provided (e.g. from Home/Shop page)
    if (size === null) {
        try {
            const productRes = await fetch(`http://localhost:5000/api/products/public/${productId}`);
            const productData = await productRes.json();
            
            if (productData.sizes && Object.keys(productData.sizes).length > 0) {
                const availableSizes = Object.keys(productData.sizes).filter(s => productData.sizes[s] > 0);
                
                if (availableSizes.length > 0) {
                    const { value: selectedSize } = await Swal.fire({
                        title: 'Select Size',
                        input: 'select',
                        inputOptions: availableSizes.reduce((acc, s) => { acc[s] = s; return acc; }, {}),
                        inputPlaceholder: 'Choose a size',
                        showCancelButton: true,
                        confirmButtonText: 'Add to Cart',
                        inputValidator: (value) => {
                            return new Promise((resolve) => {
                                if (value) resolve();
                                else resolve('You need to select a size');
                            });
                        }
                    });

                    if (selectedSize) {
                        return addToCart(productId, quantity, selectedSize, event);
                    } else {
                        return; // User cancelled
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching product sizes:", err);
        }
    }

    try {
        const res = await fetch(CART_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentToken}`
            },
            body: JSON.stringify({ productId, quantity, size })
        });

        const data = await res.json();

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Added to Cart',
                text: 'Product added to your cart!',
                timer: 2000,
                showConfirmButton: false
            });
            updateCartIcon();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || "Failed to add to cart."
            });
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred. Please try again.'
        });
    }
}

/* =========================
   REMOVE FROM CART
========================= */
async function removeFromCart(productId, size = null) {
    const currentToken = localStorage.getItem("token");
    try {
        let url = `${CART_API}/${productId}`;
        if (size) url += `?size=${size}`;

        const res = await fetch(url, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${currentToken}` }
        });

        if (res.ok) {
            if (window.location.pathname.includes('cart.html')) {
                renderCartPage();
            }
            updateCartIcon();
        } else {
            const data = await res.json();
            Swal.fire({ icon: 'error', title: 'Error', text: data.message || "Failed to remove item." });
        }
    } catch (error) {
        console.error("Error removing from cart:", error);
    }
}

/* =========================
   UPDATE CART QUANTITY
========================= */
async function updateCartQuantity(productId, newQty, size = null) {
    if (newQty < 1) return;
    const currentToken = localStorage.getItem("token");
    try {
        const res = await fetch(`${CART_API}/${productId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentToken}`
            },
            body: JSON.stringify({ quantity: newQty, size })
        });

        if (res.ok) {
            if (window.location.pathname.includes('cart.html')) {
                renderCartPage();
            }
            updateCartIcon();
        } else {
            const data = await res.json();
            Swal.fire({ icon: 'error', title: 'Error', text: data.message || "Failed to update quantity." });
            if (window.location.pathname.includes('cart.html')) {
                renderCartPage(); // Reset input value to backend cart value
            }
        }
    } catch (error) {
        console.error("Error updating quantity:", error);
    }
}

/* =========================
   RENDER CART PAGE
========================= */
async function renderCartPage() {
    const container = document.getElementById('cartItemsContainer');
    if (!container) return;

    const items = await getBackendCart();
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-final-total');
    const headerRow = document.querySelector('.cart-header-row');

    if (items.length === 0) {
        if (headerRow) headerRow.style.display = 'none';
        container.innerHTML = '<p style="padding: 40px; text-align: center; font-size: 18px; font-weight: 500;">Your cart is empty.</p>';
        if (subtotalEl) subtotalEl.innerText = '₹0';
        if (totalEl) totalEl.innerText = '₹0';
        return;
    }
    
    if (headerRow) headerRow.style.display = 'grid';

    let subtotal = 0;
    container.innerHTML = items.map(item => {
        const p = item.product;
        if (!p) return "";
        
        const hasDiscount = p.discountValue > 0;
        const displayPrice = hasDiscount 
            ? (p.discountType === 'percent' ? p.price - (p.price * p.discountValue / 100) : p.price - p.discountValue)
            : p.price;

        const itemTotal = displayPrice * item.quantity;
        subtotal += itemTotal;

        return `
            <div class="cart-item-row">
                <div class="product-col">
                    <div class="product-thumb">
                        <img src="${p.image}" alt="${p.name}" onerror="this.src='../img/logo.png'">
                        <div class="remove-icon-overlay" onclick="removeFromCart('${p._id}', '${item.size || ""}')">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    <span class="product-name-label">${p.name} ${item.size ? `(${item.size})` : ''}</span>
                </div>
                <div class="cart-col-mobile" data-label="Price">
                    ₹${displayPrice.toFixed(2)}
                    ${hasDiscount ? `<span class="old-price">₹${p.price.toFixed(2)}</span>` : ''}
                </div>
                <div class="cart-col-mobile" data-label="Quantity">
                    <div class="qty-wrapper-cart">
                        <button class="qty-btn-cart" onclick="updateCartQuantity('${p._id}', ${item.quantity - 1}, '${item.size || ""}')"><i class="fas fa-minus"></i></button>
                        <input type="number" class="qty-input" value="${item.quantity}" 
                            onchange="updateCartQuantity('${p._id}', this.value, '${item.size || ""}')" min="1">
                        <button class="qty-btn-cart" onclick="updateCartQuantity('${p._id}', ${item.quantity + 1}, '${item.size || ""}')"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <div class="cart-col-mobile" data-label="Subtotal">
                    <span class="item-total-val">₹${itemTotal.toFixed(2)}</span>
                </div>
            </div>
        `;
    }).join("");

    if (subtotalEl) subtotalEl.innerText = `₹${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.innerText = `₹${subtotal.toFixed(2)}`;
}

/* =========================
   UPDATE CART ICON
========================= */
async function updateCartIcon() {
    const items = await getBackendCart();
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    // Removed restrictive page checks to allow global updates

    const cartLinks = document.querySelectorAll('a[href="cart.html"]');
    cartLinks.forEach(link => {
        let badge = link.querySelector('.icon-badge');
        if (totalItems > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'icon-badge';
                link.appendChild(badge);
            }
            badge.innerText = totalItems;
            badge.style.display = 'flex';
        } else {
            if (badge) badge.style.display = 'none';
        }
    });
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    updateCartIcon();
    if (document.getElementById('cartItemsContainer')) {
        renderCartPage();
    }
});
