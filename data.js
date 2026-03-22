// data.js handles the simulated database across localStorage.

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Premium Alloy Wheels 18\"",
    price: 45000,
    category: "car",
    image: "assets/alloy_wheel_1774159660877.png",
    inStock: true,
  },
  {
    id: 2,
    name: "Sport Suspension Shock Absorber",
    price: 18500,
    category: "bike",
    image: "assets/bike_suspension_1774159686863.png",
    inStock: true,
  },
  {
    id: 3,
    name: "Carbon Ceramic Brake Pads Pro",
    price: 12000,
    category: "car",
    image: "assets/brake_pads_1774159743562.png",
    inStock: false,
  }
];

// Initialize DB if empty
if (!localStorage.getItem('products')) {
  localStorage.setItem('products', JSON.stringify(DEFAULT_PRODUCTS));
}
let currentUsers = JSON.parse(localStorage.getItem('users') || '[]');
if (currentUsers.length === 0 || !currentUsers.find(u => u.username === 'anjana@gmail.com' && u.role === 'admin')) {
  const fixedAdmin = { username: 'anjana@gmail.com', password: 'Anjana@0000', role: 'admin', mobile: 'N/A' };
  currentUsers = currentUsers.filter(u => u.role !== 'admin');
  currentUsers.push(fixedAdmin);
  if(!currentUsers.find(u => u.role === 'customer')) {
     currentUsers.push({ username: 'user@gmail.com', password: '123', role: 'customer', mobile: '0771234567' });
  }
  localStorage.setItem('users', JSON.stringify(currentUsers));
}
if (!localStorage.getItem('orders')) {
  localStorage.setItem('orders', JSON.stringify([]));
}
if (!localStorage.getItem('cart')) {
  localStorage.setItem('cart', JSON.stringify([]));
}
if (!localStorage.getItem('reviews')) {
  localStorage.setItem('reviews', JSON.stringify([
    { id: 1, customerId: 'user@gmail.com', text: 'Supiri parts! High quality and fast delivery.', rating: 5, date: new Date().toISOString() }
  ]));
}

// Data Utility Functions
window.DB = {
  getProducts: () => JSON.parse(localStorage.getItem('products')),
  addProduct: (product) => {
    const products = DB.getProducts();
    product.id = Date.now();
    products.push(product);
    localStorage.setItem('products', JSON.stringify(products));
  },
  updateProductStock: (id, inStock) => {
    const products = DB.getProducts();
    const index = products.findIndex(p => p.id === id);
    if(index > -1) {
      products[index].inStock = inStock;
      localStorage.setItem('products', JSON.stringify(products));
    }
  },
  deleteProduct: (id) => {
    let products = DB.getProducts();
    products = products.filter(p => p.id !== id);
    localStorage.setItem('products', JSON.stringify(products));
  },
  
  getCart: () => JSON.parse(localStorage.getItem('cart')),
  addToCart: (productId) => {
    const cart = DB.getCart();
    const product = DB.getProducts().find(p => p.id === productId);
    if(product && product.inStock) {
      const existing = cart.find(item => item.product.id === productId);
      if(existing) {
        existing.quantity += 1;
      } else {
        cart.push({ product, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      return true;
    }
    return false;
  },
  removeFromCart: (productId) => {
    let cart = DB.getCart();
    cart = cart.filter(item => item.product.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
  },
  clearCart: () => localStorage.setItem('cart', JSON.stringify([])),

  getReviews: () => JSON.parse(localStorage.getItem('reviews')),
  addReview: (customerId, text, rating) => {
    const reviews = DB.getReviews();
    reviews.push({ id: Date.now(), customerId, text, rating, date: new Date().toISOString() });
    localStorage.setItem('reviews', JSON.stringify(reviews));
  },
  deleteReview: (id) => {
    let reviews = DB.getReviews();
    reviews = reviews.filter(r => r.id !== id);
    localStorage.setItem('reviews', JSON.stringify(reviews));
  },

  placeOrder: (customerId) => {
    const cart = DB.getCart();
    if(cart.length === 0) return false;
    const orders = JSON.parse(localStorage.getItem('orders'));
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    // get user's mobile number
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const customerObj = users.find(u => u.username === customerId);
    const mobile = customerObj ? (customerObj.mobile || 'N/A') : 'N/A';

    const newOrder = {
      id: 'ORD-' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString(),
      customerId,
      mobile,
      items: cart,
      total,
      status: 'pending'
    };
    
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    DB.clearCart();
    return true;
  },
  getOrders: () => JSON.parse(localStorage.getItem('orders')),

  register: (username, password, mobile) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if(users.find(u => u.username === username)) {
      return false; // username exists
    }
    const newUser = { username, password, role: 'customer', mobile };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    sessionStorage.setItem('currentUser', JSON.stringify({
      username: newUser.username,
      role: newUser.role
    }));
    return newUser;
  },

  login: (username, password) => {
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.username === username && u.password === password);
    if(user) {
      sessionStorage.setItem('currentUser', JSON.stringify({
        username: user.username,
        role: user.role
      }));
      return user;
    }
    return null;
  },
  logout: () => {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  },
  getCurrentUser: () => JSON.parse(sessionStorage.getItem('currentUser'))
};

// Global Notifications Wrapper
window.showNotification = (msg) => {
  let notif = document.getElementById('notification');
  if(!notif) {
    notif = document.createElement('div');
    notif.id = 'notification';
    document.body.appendChild(notif);
  }
  notif.textContent = msg;
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), 3000);
}

// Global Nav Update
window.updateNav = () => {
  const user = DB.getCurrentUser();
  const navContainer = document.getElementById('auth-nav');
  if(!navContainer) return;

  const baseLinks = `<a href="index.html" class="nav-link" style="margin-right:1rem">Home</a><a href="about.html" class="nav-link" style="margin-right:1rem">About Us</a>`;

  if(!user) {
    navContainer.innerHTML = baseLinks + `<a href="login.html" class="btn btn-primary">Login</a>`;
  } else {
    let links = baseLinks;
    if(user.role === 'admin') {
      links += `<a href="admin.html" class="nav-link">Dashboard</a>`;
    } else {
      const cartCount = DB.getCart().reduce((c, i) => c + i.quantity, 0);
      links += `<a href="cart.html" class="btn btn-outline">
                  🛒 Cart <span style="background:var(--primary);color:white;padding:2px 8px;border-radius:12px;margin-left:5px">${cartCount}</span>
                </a>`;
    }
    links += `<button onclick="DB.logout()" class="btn btn-outline" style="border-color:var(--error);color:var(--error)">Logout</button>`;
    navContainer.innerHTML = links;
  }
}
