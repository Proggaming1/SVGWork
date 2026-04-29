// Child Business Store Logic

let currentUser = null;
let userRole = null;
let myStoreId = null;
let myProducts = {};
let childrenList = {};
let cart = {};
let cartTotal = 0;

window.addEventListener('load', () => {
    userRole = localStorage.getItem('userRole');
    currentUser = localStorage.getItem('userId');

    if (!userRole || !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Get family info
    const familyRef = firebase.database().ref('families');
    familyRef.orderByChild('children/' + currentUser).equalTo(true).once('value').then((snapshot) => {
        snapshot.forEach((familySnapshot) => {
            const family = familySnapshot.val();
            childrenList = family.children || {};
        });
    });

    if (userRole === 'child') {
        document.getElementById('my-store-panel').style.display = 'block';
        document.getElementById('shop-panel').style.display = 'block';
        initMyStore();
        loadAvailableStores();
    }
});

// ========== MY STORE FUNCTIONS ==========

function initMyStore() {
    // Get or create my store
    const storeRef = firebase.database().ref('child_stores/' + currentUser);
    storeRef.once('value').then((snapshot) => {
        if (snapshot.exists()) {
            myStoreId = currentUser;
            loadMyProducts();
            loadSalesHistory();
        } else {
            // Create new store
            const storeData = {
                ownerId: currentUser,
                storeName: childrenList[currentUser]?.name + "'s Store" || "My Store",
                createdAt: new Date().toISOString(),
                totalSales: 0,
                itemsSold: 0
            };
            storeRef.set(storeData).then(() => {
                myStoreId = currentUser;
                loadMyProducts();
            });
        }
    });
}

function loadMyProducts() {
    const productsRef = firebase.database().ref('child_stores/' + currentUser + '/products');
    productsRef.on('value', (snapshot) => {
        myProducts = {};
        const listElement = document.getElementById('my-products-list');
        listElement.innerHTML = '';

        snapshot.forEach((productSnapshot) => {
            const product = productSnapshot.val();
            const productId = productSnapshot.key;
            myProducts[productId] = product;

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-emoji">${product.emoji}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">Rp ${product.price.toLocaleString('id-ID')}</div>
                <div class="product-stock">Stock: ${product.stock}</div>
                <button class="btn-action btn-edit" onclick="editProduct('${productId}')">✏️ Edit</button>
                <button class="btn-action btn-delete" onclick="deleteProduct('${productId}')">🗑️ Delete</button>
            `;
            listElement.appendChild(card);
        });
    });
}

function addProduct() {
    const name = document.getElementById('product-name').value;
    const price = parseInt(document.getElementById('product-price').value);
    const emoji = document.getElementById('product-emoji').value;
    const stock = parseInt(document.getElementById('product-stock').value);
    const desc = document.getElementById('product-desc').value;

    if (!name || !price || !emoji || stock === '') {
        alert('Please fill all required fields');
        return;
    }

    const productId = firebase.database().ref('child_stores/' + currentUser + '/products').push().key;
    const productData = {
        id: productId,
        name: name,
        price: price,
        emoji: emoji,
        stock: stock,
        description: desc,
        createdAt: new Date().toISOString()
    };

    firebase.database().ref('child_stores/' + currentUser + '/products/' + productId).set(productData).then(() => {
        alert('✅ Product added!');
        document.getElementById('product-name').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-emoji').value = '';
        document.getElementById('product-stock').value = '';
        document.getElementById('product-desc').value = '';
    });
}

function deleteProduct(productId) {
    if (confirm('Delete this product?')) {
        firebase.database().ref('child_stores/' + currentUser + '/products/' + productId).remove();
    }
}

function loadSalesHistory() {
    const salesRef = firebase.database().ref('child_business_transactions');
    salesRef.orderByChild('sellerId').equalTo(currentUser).limitToLast(20).on('value', (snapshot) => {
        const historyElement = document.getElementById('sales-history');
        historyElement.innerHTML = '';
        let totalSales = 0;
        let itemsSold = 0;

        snapshot.forEach((transSnapshot) => {
            const trans = transSnapshot.val();
            totalSales += trans.amount;
            itemsSold += trans.quantity;

            const item = document.createElement('div');
            item.className = 'transaction-item sold';
            item.innerHTML = `
                <div>
                    <strong>${trans.productName}</strong><br>
                    <small>${new Date(trans.timestamp).toLocaleDateString('id-ID')}</small>
                </div>
                <div style="text-align: right;">
                    <strong>+Rp ${trans.amount.toLocaleString('id-ID')}</strong><br>
                    <small>x${trans.quantity}</small>
                </div>
            `;
            historyElement.appendChild(item);
        });

        document.getElementById('total-sales').textContent = 'Rp ' + totalSales.toLocaleString('id-ID');
        document.getElementById('items-sold').textContent = itemsSold;
    });
}

// ========== SHOPPING FUNCTIONS ==========

function loadAvailableStores() {
    const storesRef = firebase.database().ref('child_stores');
    storesRef.on('value', (snapshot) => {
        const storesElement = document.getElementById('available-stores');
        storesElement.innerHTML = '';

        snapshot.forEach((storeSnapshot) => {
            const store = storeSnapshot.val();
            const storeOwnerId = storeSnapshot.key;

            // Don't show own store
            if (storeOwnerId === currentUser) return;

            const storeCard = document.createElement('div');
            storeCard.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px; cursor: pointer;';
            storeCard.innerHTML = `
                <h4>${store.storeName}</h4>
                <p style="color: #666; margin: 10px 0;">Owner: ${childrenList[storeOwnerId]?.name || 'Unknown'}</p>
                <button class="btn-action btn-buy" onclick="viewStoreProducts('${storeOwnerId}')">👀 Browse</button>
            `;
            storesElement.appendChild(storeCard);
        });
    });
}

function viewStoreProducts(storeOwnerId) {
    const productsRef = firebase.database().ref('child_stores/' + storeOwnerId + '/products');
    productsRef.once('value').then((snapshot) => {
        const storesElement = document.getElementById('available-stores');
        storesElement.innerHTML = '';

        const backBtn = document.createElement('button');
        backBtn.textContent = '← Back';
        backBtn.className = 'btn-primary';
        backBtn.style.background = '#6c757d';
        backBtn.onclick = loadAvailableStores;
        storesElement.appendChild(backBtn);

        const productsGrid = document.createElement('div');
        productsGrid.className = 'product-grid';
        productsGrid.style.marginTop = '15px';

        snapshot.forEach((productSnapshot) => {
            const product = productSnapshot.val();
            const productId = productSnapshot.key;

            if (product.stock > 0) {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-emoji">${product.emoji}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">Rp ${product.price.toLocaleString('id-ID')}</div>
                    <div class="product-stock">Stock: ${product.stock}</div>
                    <button class="btn-action btn-buy" onclick="addToCart('${storeOwnerId}', '${productId}', '${product.name}', ${product.price})">🛒 Buy</button>
                `;
                productsGrid.appendChild(card);
            }
        });

        storesElement.appendChild(productsGrid);
    });
}

function addToCart(storeOwnerId, productId, productName, price) {
    const cartKey = storeOwnerId + '_' + productId;
    
    if (!cart[cartKey]) {
        cart[cartKey] = {
            storeOwnerId: storeOwnerId,
            productId: productId,
            productName: productName,
            price: price,
            quantity: 0
        };
    }
    
    cart[cartKey].quantity++;
    updateCartDisplay();
    alert('✅ Added to cart!');
}

function updateCartDisplay() {
    const cartElement = document.getElementById('cart-summary');
    const items = Object.values(cart);

    if (items.length === 0) {
        cartElement.innerHTML = '<p style="text-align: center; color: #999;">Cart is empty</p>';
        return;
    }

    let html = '';
    cartTotal = 0;

    items.forEach(item => {
        const subtotal = item.price * item.quantity;
        cartTotal += subtotal;
        html += `
            <div style="display: flex; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 5px; margin-bottom: 8px;">
                <span>${item.productName} x${item.quantity}</span>
                <strong>Rp ${subtotal.toLocaleString('id-ID')}</strong>
            </div>
        `;
    });

    html += `
        <div style="border-top: 2px solid #667eea; padding-top: 10px; margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.1em; color: #667eea;">
                <span>Total:</span>
                <span>Rp ${cartTotal.toLocaleString('id-ID')}</span>
            </div>
        </div>
    `;

    cartElement.innerHTML = html;
}

function checkoutCart() {
    if (Object.keys(cart).length === 0) {
        alert('Cart is empty!');
        return;
    }

    // Create transactions for each store
    Object.keys(cart).forEach(cartKey => {
        const item = cart[cartKey];
        const transactionId = firebase.database().ref('child_business_transactions').push().key;
        const transaction = {
            id: transactionId,
            buyerId: currentUser,
            sellerId: item.storeOwnerId,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            amount: item.price * item.quantity,
            timestamp: new Date().toISOString()
        };

        firebase.database().ref('child_business_transactions/' + transactionId).set(transaction);
    });

    alert('✅ Purchase complete!');
    cart = {};
    updateCartDisplay();
}

function searchStores() {
    const searchTerm = document.getElementById('search-store').value.toLowerCase();
    // Implement search functionality
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}