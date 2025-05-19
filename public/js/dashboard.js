// Add profile editing functionality
const userMenu = document.querySelector('.user-menu');
if (userMenu) {
  const profileBtn = document.createElement('button');
  profileBtn.className = 'btn btn-sm';
  profileBtn.textContent = 'Edit Profile';
  profileBtn.style.marginRight = '10px';
  profileBtn.onclick = showProfileModal;
  
  userMenu.insertBefore(profileBtn, userMenu.firstChild);
}

function showProfileModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Edit Profile</h2>
      <form id="profileForm">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="displayName">Display Name</label>
          <input type="text" id="displayName" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="currentPassword">Current Password</label>
          <input type="password" id="currentPassword" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="newPassword">New Password (optional)</label>
          <input type="password" id="newPassword" class="form-control">
        </div>
        <div class="form-group">
          <button type="submit" class="btn">Update Profile</button>
          <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const profileForm = document.getElementById('profileForm');
  profileForm.addEventListener('submit', updateProfile);
}

async function updateProfile(e) {
  e.preventDefault();
  
  const formData = {
    username: document.getElementById('username').value,
    displayName: document.getElementById('displayName').value,
    currentPassword: document.getElementById('currentPassword').value,
    newPassword: document.getElementById('newPassword').value || undefined
  };
  
  try {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      alert('Profile updated successfully');
      closeModal();
    } else {
      const data = await response.json();
      alert(data.message);
    }
  } catch (error) {
    console.error('Profile update error:', error);
    alert('Error updating profile');
  }
}

function closeModal() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove();
  }
}