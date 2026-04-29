// Mama Food Store Logic

let currentUser = null;
let userRole = null;
let cart = {};
let mamaId = null;
let menuItems = {};

window.addEventListener('load', () => {
    userRole = localStorage.getItem('userRole');
    currentUser = localStorage.getItem('userId');

    if (!userRole || !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Get mama/parent ID from family data
    const familyRef = firebase.database().ref('families');
    familyRef.once('value').then((snapshot) => {
        snapshot.forEach((familySnapshot) => {
            const family = familySnapshot.val();
            if (family.parentId) {
                mamaId = family.parentId;
            }
        });
    });

    if (userRole === 'parent') {
        document.getElementById('mama-panel').style.display = 'block';
        loadMamaMenu();
    } else {
        document.getElementById('child-panel').style.display = 'block';
        loadChildMenu();
    }
});

// Load mama's menu
function loadMamaMenu() {
    const menuRef = firebase.database().ref('mama_store/menu');
    menuRef.on('value', (snapshot) => {
        const listElement = document.getElementById('mama-menu-list');
        listElement.innerHTML = '';
        menuItems = {};

        snapshot.forEach((itemSnapshot) => {
            const item = itemSnapshot.val();
            const itemId = itemSnapshot.key;
            menuItems[itemId] = item;

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-emoji">${item.emoji}</div>
                <div class="product-name">${item.name}</div>
                <div class="product-price">Rp ${item.price.toLocaleString('id-ID')}</div>
                <div class="product-qty">Stock: ${item.stock}</div>
                <button class="btn-delete" onclick="deleteFoodItem('${itemId}')">🗑️ Delete</button>
            `;
            listElement.appendChild(card);
        });
    });
}

// Add food item
function addFoodItem() {
    const name = document.getElementById('food-name').value;
    const price = parseInt(document.getElementById('food-price').value);
    const emoji = document.getElementById('food-emoji').value;
    const stock = parseInt(document.getElementById('food-stock').value);

    if (!name || !price || !emoji || stock === '') {
        alert('Please fill all fields');
        return;
    }

    const itemId = firebase.database().ref('mama_store/menu').push().key;
    const itemData = {
        name: name,
        price: price,
        emoji: emoji,
        stock: stock,
        createdAt: new Date().toISOString()
    };

    firebase.database().ref('mama_store/menu/' + itemId).set(itemData).then(() => {
        alert('✅ Menu item added!');
        document.getElementById('food-name').value = '';
        document.getElementById('food-price').value = '';
        document.getElementById('food-emoji').value = '';
        document.getElementById('food-stock').value = '';
    });
}

// Delete food item
function deleteFoodItem(itemId) {
    if (confirm('Delete this menu item?')) {
        firebase.database().ref('mama_store/menu/' + itemId).remove();
    }
}

// Load menu for child
function loadChildMenu() {
    const menuRef = firebase.database().ref('mama_store/menu');
    menuRef.on('value', (snapshot) => {
        const listElement = document.getElementById('menu-list');
        listElement.innerHTML = '';
        menuItems = {};

        snapshot.forEach((itemSnapshot) => {
            const item = itemSnapshot.val();
            const itemId = itemSnapshot.key;
            menuItems[itemId] = item;

            if (item.stock > 0) {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-emoji">${item.emoji}</div>
                    <div class="product-name">${item.name}</div>
                    <div class="product-price">Rp ${item.price.toLocaleString('id-ID')}</div>
                    <div class="product-qty">
                        <input type="number" id="qty-${itemId}" value="1" min="1" max="${item.stock}">
                    </div>
                    <button class="btn-add" onclick="addToCart('${itemId}', '${item.name}', ${item.price})">🛒 Add</button>
                `;
                listElement.appendChild(card);
            }
        });
    });
}

// Add to cart
function addToCart(itemId, name, price) {
    const qty = parseInt(document.getElementById('qty-' + itemId).value);
    
    if (!cart[itemId]) {
        cart[itemId] = { name, price, qty: 0 };
    }
    
    cart[itemId].qty += qty;
    updateCartDisplay();
}

// Update cart display
function updateCartDisplay() {
    let total = 0;
    let count = 0;

    Object.keys(cart).forEach(itemId => {
        const item = cart[itemId];
        total += item.price * item.qty;
        count += item.qty;
    });

    document.getElementById('order-count').textContent = count;
    document.getElementById('order-total').textContent = 'Rp ' + total.toLocaleString('id-ID');
}

// Checkout order
function checkoutOrder() {
    if (Object.keys(cart).length === 0) {
        alert('Cart is empty!');
        return;
    }

    const orderId = firebase.database().ref('mama_store/orders').push().key;
    let total = 0;
    const items = [];

    Object.keys(cart).forEach(itemId => {
        const item = cart[itemId];
        total += item.price * item.qty;
        items.push({
            itemId: itemId,
            name: item.name,
            price: item.price,
            qty: item.qty
        });
    });

    const order = {
        orderId: orderId,
        childId: currentUser,
        items: items,
        total: total,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    firebase.database().ref('mama_store/orders/' + orderId).set(order).then(() => {
        alert('✅ Order placed! Waiting for delivery...');
        cart = {};
        updateCartDisplay();
    });
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}