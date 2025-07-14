const DEBUG_CART = true;

window.logCart = (...args) => DEBUG_CART && console.log("🛒 [Cart]", ...args);
window.warnCart = (...args) => DEBUG_CART && console.warn("⚠️ [Cart]", ...args);
window.errorCart = (...args) => DEBUG_CART && console.error("❌ [Cart]", ...args);



let renderTimeout;

function saveCart(cart, { render = true } = {}) {
    try {
        localStorage.setItem("savedCart", JSON.stringify(cart));
        updateCartCount();
        logCart("Cart saved to localStorage:", cart);

        if (render) {
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                logCart("Rendering cart after save...");
                renderCart?.();
            }, 50);
        }
    } catch (err) {
        errorCart("Failed to save cart:", err);
    }
}



function adjustQuantity(index, action, { render = true } = {}) {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];

    if (!cart[index]) {
        warnCart(`No item found at index ${index}.`);
        return;
    }

    if (action === "increase") {
        cart[index].qty += 1;
        logCart(`Increased quantity:`, cart[index]);
    } else if (action === "decrease") {
        cart[index].qty -= 1;
        if (cart[index].qty <= 0) {
            const removed = cart.splice(index, 1)[0];
            logCart(`Removed item after qty reached 0:`, removed);
        } else {
            logCart(`Decreased quantity:`, cart[index]);
        }
    } else {
        warnCart(`Invalid action "${action}" passed to adjustQuantity.`);
        return;
    }

    saveCart(cart, { render });
}




function removeFromCart(id, variant, { render = true } = {}) {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const index = cart.findIndex(item => item.id === id && item.variant === variant);

    if (index === -1) {
        warnCart(`Item not found (id: ${id}, variant: ${variant})`);
        return;
    }

    const removed = cart.splice(index, 1)[0];
    logCart(`Removed item from cart:`, removed);
    saveCart(cart, { render });
}


function updateCartQty(id, change, { render = true } = {}) {
    const cart = JSON.parse(localStorage.getItem("savedCart")) || [];
    const index = cart.findIndex(item => item.id === id);

    if (index === -1) {
        warnCart(`Item ID "${id}" not found in cart.`);
        return;
    }

    const action = change > 0 ? "increase" : "decrease";
    logCart(`Updating qty for ID "${id}" → ${action}`);
    adjustQuantity(index, action, { render });
}


function getCart() {
    try {
        return JSON.parse(localStorage.getItem("savedCart")) || [];
    } catch (e) {
        errorCart("Invalid cart in storage:", e);
        return [];
    }
}

function setCart(cart) {
    localStorage.setItem("savedCart", JSON.stringify(cart));
}



// Add at the bottom of cartUtils.js
export { saveCart, getCart, setCart, removeFromCart, updateCartQty };
