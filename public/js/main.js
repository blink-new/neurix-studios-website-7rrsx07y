document.addEventListener('DOMContentLoaded', function() {
  // Custom cursor
  const cursor = document.querySelector('.cursor');
  const cursorFollower = document.querySelector('.cursor-follower');
  
  document.addEventListener('mousemove', function(e) {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
    setTimeout(function() {
      cursorFollower.style.left = e.clientX + 'px';
      cursorFollower.style.top = e.clientY + 'px';
    }, 100);
  });
  
  document.addEventListener('mousedown', function() {
    cursor.style.width = '15px';
    cursor.style.height = '15px';
    cursorFollower.style.width = '30px';
    cursorFollower.style.height = '30px';
  });
  
  document.addEventListener('mouseup', function() {
    cursor.style.width = '20px';
    cursor.style.height = '20px';
    cursorFollower.style.width = '40px';
    cursorFollower.style.height = '40px';
  });
  
  // Links and buttons cursor effect
  const links = document.querySelectorAll('a, button, .btn');
  links.forEach(link => {
    link.addEventListener('mouseenter', function() {
      cursor.style.width = '30px';
      cursor.style.height = '30px';
      cursorFollower.style.width = '0';
    });
    
    link.addEventListener('mouseleave', function() {
      cursor.style.width = '20px';
      cursor.style.height = '20px';
      cursorFollower.style.width = '40px';
      cursorFollower.style.height = '40px';
    });
  });

  // Mobile menu toggle
  const menuBtn = document.querySelector('.menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (menuBtn) {
    menuBtn.addEventListener('click', function() {
      this.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
  }
  
  // Navbar scroll effect
  const navbar = document.querySelector('.navbar');
  
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }
  
  // Moving lines animation
  const lines = document.querySelector('.lines');
  
  if (lines) {
    for (let i = 0; i < 6; i++) {
      const line = document.createElement('div');
      line.classList.add('line');
      lines.appendChild(line);
    }
  }
  
  // Reviews slider
  const reviews = document.querySelector('.reviews');
  const sliderDots = document.querySelectorAll('.slider-dot');
  let currentSlide = 0;
  
  if (reviews && sliderDots.length > 0) {
    function showSlide(index) {
      reviews.style.transform = `translateX(-${index * 100}%)`;
      
      sliderDots.forEach((dot, i) => {
        if (i === index) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
    
    sliderDots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentSlide = index;
        showSlide(currentSlide);
      });
    });
    
    // Auto slide
    setInterval(() => {
      currentSlide = (currentSlide + 1) % sliderDots.length;
      showSlide(currentSlide);
    }, 5000);
  }
  
  // Chatbot functionality
  const chatButton = document.querySelector('.chat-button');
  const chatBox = document.querySelector('.chat-box');
  const closeChat = document.querySelector('.close-chat');
  const chatForm = document.querySelector('.chat-form');
  const chatInput = document.querySelector('.chat-input');
  const chatMessages = document.querySelector('.chat-messages');
  const staffButton = document.querySelector('.staff-button');
  
  if (chatButton && chatBox) {
    chatButton.addEventListener('click', function() {
      chatBox.classList.toggle('show');
    });
    
    if (closeChat) {
      closeChat.addEventListener('click', function() {
        chatBox.classList.remove('show');
      });
    }
    
    // Simple chatbot responses
    const responses = {
      'hello': 'Hello! How can I help you today?',
      'hi': 'Hi there! How can I assist you?',
      'services': 'We offer web design, development, e-commerce solutions, and digital marketing services.',
      'pricing': 'Our pricing varies based on project requirements. Would you like to talk to a staff member for a custom quote?',
      'contact': 'You can reach us via email at contact@neurix.com or talk to a staff member directly.',
      'help': 'I can provide information about our services, pricing, or connect you with a staff member. What do you need help with?'
    };
    
    if (chatForm && chatInput) {
      chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const message = chatInput.value.trim();
        
        if (message === '') return;
        
        // Add user message
        addMessage('user', message);
        
        // Clear input
        chatInput.value = '';
        
        // Bot response
        setTimeout(() => {
          let response = 'I\'m not sure I understand. Would you like to speak with a staff member?';
          
          // Check for matching responses
          for (const key in responses) {
            if (message.toLowerCase().includes(key)) {
              response = responses[key];
              break;
            }
          }
          
          addMessage('bot', response);
        }, 500);
      });
    }
    
    function addMessage(sender, message) {
      if (!chatMessages) return;
      
      const messageElement = document.createElement('div');
      messageElement.classList.add('message', sender);
      
      let senderName = '';
      if (sender === 'user') {
        senderName = 'You';
      } else if (sender === 'bot') {
        senderName = 'Chatbot';
      } else if (sender === 'staff') {
        senderName = 'Staff';
      }
      
      messageElement.innerHTML = `
        <div class="sender-name">${senderName}</div>
        <div class="message-content">${message}</div>
      `;
      
      chatMessages.appendChild(messageElement);
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Talk to staff button
    if (staffButton) {
      staffButton.addEventListener('click', function() {
        addMessage('bot', 'Connecting you to a staff member...');
        
        setTimeout(() => {
          addMessage('staff', 'Hello! This is a staff member. How can I help you today?');
        }, 1000);
      });
    }
  }
  
  // Load products
  const productsContainer = document.querySelector('#products-container');
  
  if (productsContainer) {
    fetch('/api/products')
      .then(response => response.json())
      .then(products => {
        let productsHTML = '';
        
        products.forEach(product => {
          let featuresHTML = '';
          
          product.features.forEach(feature => {
            featuresHTML += `<li>${feature}</li>`;
          });
          
          productsHTML += `
            <div class="product-card">
              <div class="product-img"></div>
              <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">$${product.price}</div>
                <ul class="product-features">
                  ${featuresHTML}
                </ul>
                <a href="#order" class="btn">Order Now</a>
              </div>
            </div>
          `;
        });
        
        productsContainer.innerHTML = productsHTML;
      })
      .catch(error => console.error('Error fetching products:', error));
  }
  
  // Load reviews
  const reviewsContainer = document.querySelector('#reviews-container');
  
  if (reviewsContainer) {
    fetch('/api/reviews')
      .then(response => response.json())
      .then(reviews => {
        let reviewsHTML = '';
        let dotsHTML = '';
        
        reviews.forEach((review, index) => {
          // Create stars based on rating
          let stars = '';
          for (let i = 0; i < review.rating; i++) {
            stars += '★';
          }
          
          reviewsHTML += `
            <div class="review">
              <div class="review-text">"${review.comment}"</div>
              <div class="review-rating">${stars}</div>
              <div class="review-author">${review.name}</div>
              <div class="review-company">${review.company}</div>
            </div>
          `;
          
          dotsHTML += `
            <div class="slider-dot ${index === 0 ? 'active' : ''}"></div>
          `;
        });
        
        reviewsContainer.innerHTML = reviewsHTML;
        
        const sliderNav = document.querySelector('.slider-nav');
        if (sliderNav) {
          sliderNav.innerHTML = dotsHTML;
          
          // Reattach slider functionality
          const sliderDots = document.querySelectorAll('.slider-dot');
          const reviews = document.querySelector('.reviews');
          
          sliderDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
              reviews.style.transform = `translateX(-${index * 100}%)`;
              
              sliderDots.forEach((d, i) => {
                if (i === index) {
                  d.classList.add('active');
                } else {
                  d.classList.remove('active');
                }
              });
            });
          });
        }
      })
      .catch(error => console.error('Error fetching reviews:', error));
  }
  
  // Order form submission
  const orderForm = document.querySelector('#order-form');
  
  if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.classList.add('alert', 'alert-success');
      successMessage.innerHTML = 'Your order has been submitted successfully! We will contact you shortly.';
      
      orderForm.innerHTML = '';
      orderForm.appendChild(successMessage);
    });
  }
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const target = document.querySelector(this.getAttribute('href'));
      
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });
});