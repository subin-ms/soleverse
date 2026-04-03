const WISHLIST_API = "http://localhost:5000/api/wishlist";
const token = localStorage.getItem("token");

/* =========================
   ADD TO WISHLIST
========================= */
async function addToWishlist(productId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
        Swal.fire({
            icon: 'info',
            title: 'Login Required',
            text: 'Please login to add items to your wishlist.',
            confirmButtonText: 'Login',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = "login.html";
            }
        });
        return;
    }

    try {
        const res = await fetch(WISHLIST_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentToken}`
            },
            body: JSON.stringify({ productId })
        });

        const data = await res.json();

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Product added to wishlist!',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: data.message || "Failed to add to wishlist."
            });
        }
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred. Please try again.'
        });
    }
}

/* =========================
   REMOVE FROM WISHLIST
========================= */
async function removeFromWishlist(productId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;

    try {
        const res = await fetch(`${WISHLIST_API}/${productId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${currentToken}`
            }
        });

        if (res.ok) {
            // If we are on the wishlist page, reload the list
            if (typeof loadWishlist === "function") {
                loadWishlist();
            }
        } else {
            const data = await res.json();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || "Failed to remove from wishlist."
            });
        }
    } catch (error) {
        console.error("Error removing from wishlist:", error);
    }
}

/* =========================
   LOAD WISHLIST
========================= */
async function loadWishlist() {
    const grid = document.getElementById("wishlistGrid");
    const countBadge = document.querySelector(".section-title");

    if (!grid) return;

    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Please login to view your wishlist.</p>';
        return;
    }

    try {
        const res = await fetch(WISHLIST_API, {
            headers: {
                "Authorization": `Bearer ${currentToken}`
            }
        });

        if (!res.ok) throw new Error("Failed to fetch wishlist");

        const items = await res.json();

        if (countBadge) {
            countBadge.innerText = `Wishlist`;
        }

        if (items.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Your wishlist is empty.</p>';
            return;
        }

        grid.innerHTML = items.map(item => {
            const p = item.product;
            if (!p) return "";
            
            const hasDiscount = p.discountValue > 0;
            const displayPrice = hasDiscount 
                ? (p.discountType === 'percent' ? p.price - (p.price * p.discountValue / 100) : p.price - p.discountValue)
                : p.price;

            const isOutOfStock = p.status === 'Out of Stock' || p.stock <= 0;
            
            return `
    <div class="product-card ${isOutOfStock ? 'status-out-of-stock' : ''}">
      <div class="card-image">
        <img src="${p.image}" alt="${p.name}" onclick="window.location.href='product.html?id=${p._id}'" style="cursor: pointer; ${isOutOfStock ? 'filter: grayscale(0.5); opacity: 0.6;' : ''}">
        <button class="add-to-cart-btn" ${isOutOfStock ? 'disabled' : ''} onclick="addToCart('${p._id}')" ${isOutOfStock ? 'style="background: #ccc; cursor: not-allowed;"' : ''}>
            <i class="fas fa-shopping-cart"></i> ${isOutOfStock ? 'Out of Stock' : 'Add To Cart'}
        </button>
        <div class="card-actions-top">
            <div class="icon-action" onclick="removeFromWishlist('${p._id}', event)">
                <i class="far fa-trash-alt"></i>
            </div>
        </div>
      </div>
      <div class="card-details">
        <h3 class="product-name" onclick="window.location.href='product.html?id=${p._id}'" style="cursor: pointer;">${p.name}</h3>
        <div class="product-price">
            ₹${displayPrice.toFixed(2)}
            ${hasDiscount ? `<span class="old-price" style="text-decoration: line-through; color: #999; font-size: 14px; margin-left: 8px;">₹${p.price.toFixed(2)}</span>` : ''}
        </div>
      </div>
    </div>`;
        }).join("");

        return items;
    } catch (error) {
        console.error("Error loading wishlist:", error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Error loading wishlist.</p>';
        return [];
    }
}

/* =========================
   LOAD RECOMMENDATIONS
========================= */
async function loadRecommendations(wishlistItems = []) {
    const grid = document.getElementById("recommendationsGrid");
    if (!grid) return;

    try {
        let url = "http://localhost:5000/api/products/public?limit=4";
        
        // Try to find a category from the wishlist to show "related" items
        if (wishlistItems.length > 0) {
            const firstItemWithCat = wishlistItems.find(item => item.product && item.product.category);
            if (firstItemWithCat) {
                const catId = firstItemWithCat.product.category._id || firstItemWithCat.product.category;
                url += `&category=${catId}`;
            }
        }

        const res = await fetch(url);
        const data = await res.json();
        const products = data.products || [];

        if (products.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No recommendations found.</p>';
            return;
        }

        grid.innerHTML = products.map(p => {
            const hasDiscount = p.discountValue > 0;
            const displayPrice = hasDiscount 
                ? (p.discountType === 'percent' ? p.price - (p.price * p.discountValue / 100) : p.price - p.discountValue)
                : p.price;

            const isOutOfStock = p.status === 'Out of Stock' || p.stock <= 0;

            return `
    <div class="product-card ${isOutOfStock ? 'status-out-of-stock' : ''}">
      <div class="card-image">
        <img src="${p.image}" alt="${p.name}" onclick="window.location.href='product.html?id=${p._id}'" style="cursor: pointer; ${isOutOfStock ? 'filter: grayscale(0.5); opacity: 0.6;' : ''}">
        <button class="add-to-cart-btn" ${isOutOfStock ? 'disabled' : ''} onclick="addToCart('${p._id}')" ${isOutOfStock ? 'style="background: #ccc; cursor: not-allowed;"' : ''}>
            <i class="fas fa-shopping-cart"></i> ${isOutOfStock ? 'Out of Stock' : 'Add To Cart'}
        </button>
        <div class="card-actions-top">
            <div class="icon-action" onclick="addToWishlist('${p._id}', event)">
                <i class="far fa-heart"></i>
            </div>
        </div>
      </div>
      <div class="card-details">
        <h3 class="product-name" onclick="window.location.href='product.html?id=${p._id}'" style="cursor: pointer;">${p.name}</h3>
        <div class="product-price">
            ₹${displayPrice.toFixed(2)}
            ${hasDiscount ? `<span class="old-price" style="text-decoration: line-through; color: #999; font-size: 14px; margin-left: 8px;">₹${p.price.toFixed(2)}</span>` : ''}
        </div>
      </div>
    </div>`;
        }).join("");

    } catch (error) {
        console.error("Error loading recommendations:", error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Error loading recommendations.</p>';
    }
}

/* =========================
   MOVE ALL TO BAG
========================= */
async function moveAllToBag() {
    Swal.fire({
        icon: 'info',
        title: 'Coming Soon',
        text: 'Functionality to move all items to bag is coming soon!'
    });
}

// Automatically load wishlist if on the wishlist page
document.addEventListener("DOMContentLoaded", async () => {
    if (document.getElementById("wishlistGrid")) {
        const items = await loadWishlist();
        loadRecommendations(items);
    }
    
    const btnMove = document.querySelector('.btn-move-all');
    if (btnMove) {
        btnMove.onclick = moveAllToBag;
    }
});
